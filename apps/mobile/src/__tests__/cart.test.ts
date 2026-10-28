import { sdk } from '@/api/sdk';
import { CART_STORAGE_KEY, MAX_CART_QUANTITY, syncLocalCart, useCartStore, type LocalCartItem } from '@/api/cart';
import type { HttpTypes } from '@medusajs/types';

jest.mock('@/api/sdk', () => ({
  sdk: {
    store: {
      cart: {
        retrieve: jest.fn(),
        create: jest.fn(),
        createLineItem: jest.fn(),
        updateLineItem: jest.fn(),
        deleteLineItem: jest.fn(),
      },
    },
  },
}));

const item = (overrides: Partial<LocalCartItem> = {}): LocalCartItem => ({
  variantId: 'variant-a',
  productId: 'product-a',
  title: 'Olive oil',
  thumbnail: null,
  unitAmount: 35,
  currencyCode: 'ils',
  quantity: 1,
  stockQuantity: 5,
  ...overrides,
});

function cart(overrides: Partial<HttpTypes.StoreCart> = {}): HttpTypes.StoreCart {
  return {
    id: 'cart-1',
    region_id: 'region-1',
    currency_code: 'ils',
    total: 70,
    subtotal: 70,
    original_item_total: 70,
    original_item_subtotal: 70,
    original_item_tax_total: 0,
    item_total: 70,
    item_subtotal: 70,
    item_tax_total: 0,
    original_total: 70,
    original_subtotal: 70,
    original_tax_total: 0,
    tax_total: 0,
    discount_total: 0,
    discount_tax_total: 0,
    gift_card_total: 0,
    gift_card_tax_total: 0,
    shipping_total: 0,
    shipping_subtotal: 0,
    shipping_tax_total: 0,
    original_shipping_total: 0,
    original_shipping_subtotal: 0,
    original_shipping_tax_total: 0,
    promotions: [],
    ...overrides,
  };
}

beforeEach(async () => {
  useCartStore.setState({ regionId: null, items: [], cartId: null });
  await useCartStore.persist.clearStorage();
  jest.clearAllMocks();
});

describe('local-first cart', () => {
  it('merges the same variant and clamps to stock and the cart maximum', () => {
    useCartStore.getState().addItem(item({ quantity: 3 }));
    useCartStore.getState().addItem(item({ quantity: 9 }));
    expect(useCartStore.getState().items).toEqual([item({ quantity: 5 })]);

    useCartStore.getState().setQuantity('variant-a', MAX_CART_QUANTITY + 1);
    expect(useCartStore.getState().items[0]?.quantity).toBe(5);
  });

  it('removes an item when its quantity is reduced below one and persists cart data', async () => {
    useCartStore.getState().setRegionId('region-1');
    useCartStore.getState().addItem(item());
    await new Promise((resolve) => setTimeout(resolve, 0));

    const stored = await useCartStore.persist.getOptions().storage?.getItem(CART_STORAGE_KEY);
    expect(stored?.state).toMatchObject({ regionId: 'region-1', items: [item()] });

    useCartStore.getState().setQuantity('variant-a', 0);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('reconciles remote quantities, removals, and new local variants', async () => {
    const firstCart = cart({
      items: [
        { id: 'line-a', variant_id: 'variant-a', quantity: 1 } as HttpTypes.StoreCartLineItem,
        { id: 'line-b', variant_id: 'variant-b', quantity: 2 } as HttpTypes.StoreCartLineItem,
      ],
    });
    const finalCart = cart({
      items: [
        { id: 'line-a', variant_id: 'variant-a', quantity: 3 } as HttpTypes.StoreCartLineItem,
        { id: 'line-c', variant_id: 'variant-c', quantity: 1 } as HttpTypes.StoreCartLineItem,
      ],
    });
    jest.mocked(sdk.store.cart.retrieve)
      .mockResolvedValueOnce({ cart: firstCart })
      .mockResolvedValueOnce({ cart: finalCart });
    jest.mocked(sdk.store.cart.updateLineItem).mockResolvedValue({ cart: finalCart });
    jest.mocked(sdk.store.cart.deleteLineItem).mockResolvedValue({ deleted: true, id: 'line-b', object: 'line-item', parent: finalCart });
    jest.mocked(sdk.store.cart.createLineItem).mockResolvedValue({ cart: finalCart });

    const result = await syncLocalCart('region-1', 'cart-1', [
      item({ quantity: 3 }),
      item({ variantId: 'variant-c', productId: 'product-c', quantity: 1 }),
    ]);

    expect(sdk.store.cart.updateLineItem).toHaveBeenCalledWith('cart-1', 'line-a', { quantity: 3 });
    expect(sdk.store.cart.deleteLineItem).toHaveBeenCalledWith('cart-1', 'line-b');
    expect(sdk.store.cart.createLineItem).toHaveBeenCalledWith('cart-1', { variant_id: 'variant-c', quantity: 1 });
    expect(result.itemVariantIds).toEqual(['variant-a', 'variant-c']);
    expect(result.total).toBe(70);
  });

  it('recreates a saved server cart when the shopping region changes', async () => {
    jest.mocked(sdk.store.cart.retrieve).mockResolvedValue({ cart: cart({ region_id: 'old-region' }) });
    jest.mocked(sdk.store.cart.create).mockResolvedValue({
      cart: cart({ id: 'cart-new', region_id: 'region-1', items: [
        { id: 'line-new', variant_id: 'variant-a', quantity: 2 } as HttpTypes.StoreCartLineItem,
      ] }),
    });

    const result = await syncLocalCart('region-1', 'cart-1', [item({ quantity: 2 })]);

    expect(result.cartId).toBe('cart-new');
    expect(sdk.store.cart.create).toHaveBeenCalledWith(
      { region_id: 'region-1', items: [{ variant_id: 'variant-a', quantity: 2 }] },
      { fields: '+items' },
    );
  });
});
