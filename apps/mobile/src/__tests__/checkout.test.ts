import { sdk } from '@/api/sdk';
import {
  CheckoutFailure,
  createCheckoutIdempotencyKey,
  placeTestOrder,
  validateAddress,
  type AddressInput,
} from '@/api/checkout';
import type { HttpTypes } from '@medusajs/types';

jest.mock('@/api/sdk', () => ({
  sdk: {
    store: {
      cart: {
        update: jest.fn(),
        addShippingMethod: jest.fn(),
        complete: jest.fn(),
      },
      fulfillment: { listCartOptions: jest.fn() },
      payment: {
        listPaymentProviders: jest.fn(),
        initiatePaymentSession: jest.fn(),
      },
    },
  },
}));

const address: AddressInput = {
  email: 'buyer@example.test',
  firstName: 'Test',
  lastName: 'Buyer',
  address: '1 Sample Street',
  city: 'Hebron',
  phone: '1234567',
  countryCode: 'ps',
};

function cart(overrides: Partial<HttpTypes.StoreCart> = {}): HttpTypes.StoreCart {
  return {
    id: 'cart-1',
    region_id: 'region-1',
    currency_code: 'ils',
    total: 90,
    subtotal: 90,
    original_item_total: 70,
    original_item_subtotal: 70,
    original_item_tax_total: 0,
    item_total: 70,
    item_subtotal: 70,
    item_tax_total: 0,
    original_total: 90,
    original_subtotal: 90,
    original_tax_total: 0,
    tax_total: 0,
    discount_total: 0,
    discount_tax_total: 0,
    gift_card_total: 0,
    gift_card_tax_total: 0,
    shipping_total: 20,
    shipping_subtotal: 20,
    shipping_tax_total: 0,
    original_shipping_total: 20,
    original_shipping_subtotal: 20,
    original_shipping_tax_total: 0,
    promotions: [],
    items: [{ id: 'line-1', quantity: 1 } as HttpTypes.StoreCartLineItem],
    ...overrides,
  };
}

const flatShippingOption: HttpTypes.StoreCartShippingOption = {
  id: 'shipping-1',
  name: 'Standard delivery',
  price_type: 'flat',
  service_zone_id: 'zone-1',
  shipping_profile_id: 'profile-1',
  provider_id: 'manual_manual',
  data: null,
  type: { id: 'type-1', label: 'Standard', description: '2-3 days', code: 'standard' },
  provider: { id: 'manual_manual', is_enabled: true },
  amount: 20,
  prices: [],
  calculated_price: {} as HttpTypes.StoreCalculatedPrice,
  insufficient_inventory: false,
};

beforeEach(() => jest.clearAllMocks());

describe('checkout validation', () => {
  it('rejects malformed email and missing delivery details', () => {
    expect(validateAddress({ ...address, email: 'bad' })).toBe('invalid_email');
    expect(validateAddress({ ...address, city: '  ' })).toBe('invalid_address');
    expect(validateAddress(address)).toBeNull();
  });

  it('generates distinct idempotency keys', () => {
    expect(createCheckoutIdempotencyKey()).not.toBe(createCheckoutIdempotencyKey());
  });
});

describe('placeTestOrder', () => {
  it('submits one validated test checkout using the region test provider and idempotency key', async () => {
    const shippingCart = cart({ shipping_methods: [
      { id: 'method-1', cart_id: 'cart-1', name: 'Standard delivery', amount: 20, is_tax_inclusive: false, shipping_option_id: 'shipping-1', created_at: '2026-01-01', updated_at: '2026-01-01' },
    ] });
    const order = { id: 'order-1', display_id: 42, total: 90, currency_code: 'ils' } as HttpTypes.StoreOrder;

    jest.mocked(sdk.store.cart.update).mockResolvedValue({ cart: cart() });
    jest.mocked(sdk.store.fulfillment.listCartOptions).mockResolvedValue({ shipping_options: [flatShippingOption] as HttpTypes.StoreCartShippingOptionWithServiceZone[] });
    jest.mocked(sdk.store.cart.addShippingMethod).mockResolvedValue({ cart: shippingCart });
    jest.mocked(sdk.store.payment.listPaymentProviders).mockResolvedValue({
      payment_providers: [{ id: 'pp_system_default' } as HttpTypes.StorePaymentProvider],
      limit: 10,
      offset: 0,
      count: 1,
    });
    jest.mocked(sdk.store.payment.initiatePaymentSession).mockResolvedValue({
      payment_collection: {} as HttpTypes.StorePaymentCollection,
    });
    jest.mocked(sdk.store.cart.complete).mockResolvedValue({ type: 'order', order });

    const placed = await placeTestOrder({
      cartId: 'cart-1',
      address,
      shippingOptionId: 'shipping-1',
      idempotencyKey: 'khafif-retry-key',
    });

    expect(placed).toEqual(order);
    expect(sdk.store.cart.update).toHaveBeenCalledWith('cart-1', {
      email: 'buyer@example.test',
      shipping_address: {
        first_name: 'Test',
        last_name: 'Buyer',
        address_1: '1 Sample Street',
        city: 'Hebron',
        phone: '1234567',
        country_code: 'ps',
      },
    });
    expect(sdk.store.payment.initiatePaymentSession).toHaveBeenCalledWith(shippingCart, {
      provider_id: 'pp_system_default',
    });
    expect(sdk.store.cart.complete).toHaveBeenCalledWith('cart-1', {}, { 'Idempotency-Key': 'khafif-retry-key' });
  });

  it('does not mutate the cart when address data is invalid', async () => {
    await expect(placeTestOrder({
      cartId: 'cart-1',
      address: { ...address, email: 'bad' },
      shippingOptionId: 'shipping-1',
      idempotencyKey: 'khafif-key',
    })).rejects.toMatchObject({ reason: 'invalid_email' });
    expect(sdk.store.cart.update).not.toHaveBeenCalled();
  });

  it('rejects unavailable shipping methods and never creates a real-payment session', async () => {
    jest.mocked(sdk.store.cart.update).mockResolvedValue({ cart: cart() });
    jest.mocked(sdk.store.fulfillment.listCartOptions).mockResolvedValue({ shipping_options: [] });

    await expect(placeTestOrder({
      cartId: 'cart-1', address, shippingOptionId: 'stale-option', idempotencyKey: 'khafif-key',
    })).rejects.toBeInstanceOf(CheckoutFailure);
    expect(sdk.store.payment.initiatePaymentSession).not.toHaveBeenCalled();
    expect(sdk.store.cart.complete).not.toHaveBeenCalled();
  });

  it('rejects when Medusa returns the cart rather than an order', async () => {
    const shippingCart = cart({ shipping_methods: [
      { id: 'method-1', cart_id: 'cart-1', name: 'Standard delivery', amount: 20, is_tax_inclusive: false, shipping_option_id: 'shipping-1', created_at: '2026-01-01', updated_at: '2026-01-01' },
    ] });
    jest.mocked(sdk.store.cart.update).mockResolvedValue({ cart: cart() });
    jest.mocked(sdk.store.fulfillment.listCartOptions).mockResolvedValue({ shipping_options: [flatShippingOption] as HttpTypes.StoreCartShippingOptionWithServiceZone[] });
    jest.mocked(sdk.store.cart.addShippingMethod).mockResolvedValue({ cart: shippingCart });
    jest.mocked(sdk.store.payment.listPaymentProviders).mockResolvedValue({
      payment_providers: [{ id: 'pp_system_default' } as HttpTypes.StorePaymentProvider],
      limit: 10,
      offset: 0,
      count: 1,
    });
    jest.mocked(sdk.store.payment.initiatePaymentSession).mockResolvedValue({ payment_collection: {} as HttpTypes.StorePaymentCollection });
    jest.mocked(sdk.store.cart.complete).mockResolvedValue({
      type: 'cart', cart: shippingCart, error: { message: 'not complete', name: 'Error', type: 'invalid_data' },
    });

    await expect(placeTestOrder({
      cartId: 'cart-1', address, shippingOptionId: 'shipping-1', idempotencyKey: 'khafif-key',
    })).rejects.toMatchObject({ reason: 'order_failed' });
  });
});
