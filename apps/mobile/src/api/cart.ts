import type { CatalogProduct } from '@/api/catalog';
import { sdk } from '@/api/sdk';
import { asyncJsonStorage } from '@/lib/storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const CART_STORAGE_KEY = 'khafif.cart.v1';
export const MAX_CART_QUANTITY = 99;

export type LocalCartItem = {
  variantId: string;
  productId: string;
  title: string;
  thumbnail: string | null;
  unitAmount: number;
  currencyCode: string;
  quantity: number;
  stockQuantity: number | null;
};

type CartState = {
  regionId: string | null;
  items: LocalCartItem[];
  cartId: string | null;
  setRegionId: (regionId: string) => void;
  addItem: (item: LocalCartItem) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  setCartId: (cartId: string | null) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      regionId: null,
      items: [],
      cartId: null,
      setRegionId: (regionId) => set({ regionId }),
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((current) => current.variantId === item.variantId);
          if (!existing) return { items: [...state.items, item] };
          const quantity = existing.quantity + item.quantity;
          const maxQuantity = Math.min(MAX_CART_QUANTITY, item.stockQuantity ?? MAX_CART_QUANTITY);
          return {
            items: state.items.map((current) =>
              current.variantId === item.variantId
                ? { ...current, quantity: Math.min(quantity, maxQuantity) }
                : current,
            ),
          };
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity < 1
              ? state.items.filter((item) => item.variantId !== variantId)
              : state.items.map((item) =>
                  item.variantId === variantId
                    ? {
                        ...item,
                        quantity: Math.min(
                          quantity,
                          MAX_CART_QUANTITY,
                          item.stockQuantity ?? MAX_CART_QUANTITY,
                        ),
                      }
                    : item,
                ),
        })),
      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((item) => item.variantId !== variantId) })),
      setCartId: (cartId) => set({ cartId }),
      clear: () => set({ items: [], cartId: null }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: 1,
      storage: asyncJsonStorage,
      partialize: (state) => ({ regionId: state.regionId, items: state.items, cartId: state.cartId }),
      migrate: (persisted) => {
        if (typeof persisted !== 'object' || persisted === null) {
          return { regionId: null, items: [], cartId: null };
        }

        const state = persisted as Partial<CartState>;
        const items = Array.isArray(state.items)
          ? state.items.filter(
              (item): item is LocalCartItem =>
                typeof item === 'object' &&
                item !== null &&
                typeof item.variantId === 'string' &&
                typeof item.productId === 'string' &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0,
            )
          : [];

        return {
          regionId: typeof state.regionId === 'string' ? state.regionId : null,
          items,
          cartId: typeof state.cartId === 'string' ? state.cartId : null,
        };
      },
    },
  ),
);

export function createLocalCartItem(
  product: CatalogProduct,
  variantId: string,
  locale: 'ar' | 'en',
): LocalCartItem | null {
  const variant = product.variants?.find((item) => item.id === variantId);
  const calculatedPrice = variant?.calculated_price?.calculated_amount;

  if (!variant || typeof calculatedPrice !== 'number' || calculatedPrice < 0) return null;

  return {
    variantId,
    productId: product.id,
    title:
      locale === 'ar'
        ? metadataText(product.metadata, 'title_ar', product.title)
        : product.title,
    thumbnail: product.thumbnail ?? null,
    unitAmount: calculatedPrice,
    currencyCode: variant.calculated_price?.currency_code ?? 'ils',
    quantity: 1,
    stockQuantity:
      variant.manage_inventory === false
        ? null
        : typeof variant.inventory_quantity === 'number'
          ? variant.inventory_quantity
          : 0,
  };
}

function metadataText(metadata: unknown, key: string, fallback: string): string {
  if (typeof metadata !== 'object' || metadata === null) return fallback;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export type CartSyncResult = {
  cartId: string;
  items: Awaited<ReturnType<typeof sdk.store.cart.retrieve>>['cart']['items'];
  total: number | null;
  currencyCode: string;
  itemVariantIds: string[];
};

/** The cart id is the only remote cart data persisted; item edits happen locally until checkout. */
export async function syncLocalCart(
  regionId: string,
  cartId: string | null,
  items: LocalCartItem[],
): Promise<CartSyncResult> {
  const response = cartId
    ? await sdk.store.cart.retrieve(cartId, { fields: '+items' })
    : await sdk.store.cart.create({ region_id: regionId }, { fields: '+items' });
  const currentCart = response.cart;
  if (currentCart.region_id !== regionId) {
    const { cart } = await sdk.store.cart.create({
      region_id: regionId,
      items: items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
    }, { fields: '+items' });
    return {
      cartId: cart.id,
      items: cart.items ?? [],
      total: typeof cart.total === 'number' ? cart.total : null,
      currencyCode: cart.currency_code ?? 'ils',
      itemVariantIds: (cart.items ?? []).flatMap((item) => (item.variant_id ? [item.variant_id] : [])),
    };
  }
  const existingItems = currentCart.items ?? [];
  const desiredByVariant = new Map(items.map((item) => [item.variantId, item]));
  const remoteByVariant = new Map(
    existingItems.flatMap((item) => (item.variant_id ? [[item.variant_id, item] as const] : [])),
  );

  for (const remoteItem of existingItems) {
    const variantId = remoteItem.variant_id;
    if (!variantId) continue;
    const desired = desiredByVariant.get(variantId);

    if (!desired) {
      await sdk.store.cart.deleteLineItem(currentCart.id, remoteItem.id);
    } else if (remoteItem.quantity !== desired.quantity) {
      await sdk.store.cart.updateLineItem(currentCart.id, remoteItem.id, { quantity: desired.quantity });
    }
  }

  for (const item of items) {
    if (!remoteByVariant.has(item.variantId)) {
      await sdk.store.cart.createLineItem(currentCart.id, {
        variant_id: item.variantId,
        quantity: item.quantity,
      });
    }
  }

  const { cart } = await sdk.store.cart.retrieve(currentCart.id, { fields: '+items' });
  return {
    cartId: cart.id,
    items: cart.items ?? [],
    total: typeof cart.total === 'number' ? cart.total : null,
    currencyCode: cart.currency_code ?? 'ils',
    itemVariantIds: (cart.items ?? []).flatMap((item) => (item.variant_id ? [item.variant_id] : [])),
  };
}
