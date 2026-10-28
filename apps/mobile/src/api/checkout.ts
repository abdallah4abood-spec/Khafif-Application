import { sdk } from '@/api/sdk';
import type { HttpTypes } from '@medusajs/types';

export type AddressInput = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  phone: string;
  countryCode: string;
};

export type CheckoutError = 'invalid_email' | 'invalid_address' | 'cart_empty' | 'region_missing' | 'shipping_invalid' | 'test_provider_missing' | 'order_failed';

export class CheckoutFailure extends Error {
  constructor(readonly reason: CheckoutError) {
    super(reason);
    this.name = 'CheckoutFailure';
  }
}

export type PlacedOrder = Extract<Awaited<ReturnType<typeof sdk.store.cart.complete>>, { type: 'order' }>['order'];
export type StoreShippingOption = HttpTypes.StoreCartShippingOption;

const ADDRESS_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADDRESS_REQUIRED: (keyof AddressInput)[] = ['firstName', 'lastName', 'address', 'city', 'phone', 'countryCode'];

export function createCheckoutIdempotencyKey(): string {
  return `khafif-${globalThis.crypto.randomUUID()}`;
}

export function validateAddress(address: AddressInput): CheckoutError | null {
  if (!ADDRESS_EMAIL.test(address.email.trim())) return 'invalid_email';
  if (ADDRESS_REQUIRED.some((key) => !address[key].trim())) return 'invalid_address';
  return null;
}

type CheckoutInput = {
  cartId: string;
  address: AddressInput;
  shippingOptionId: string;
  idempotencyKey: string;
};

/** Mutations are deliberately sequential and never auto-retried after a network timeout. */
export async function placeTestOrder({ cartId, address, shippingOptionId, idempotencyKey }: CheckoutInput): Promise<PlacedOrder> {
  const validationError = validateAddress(address);
  if (validationError) throw new CheckoutFailure(validationError);

  const { cart: updatedCart } = await sdk.store.cart.update(cartId, {
    email: address.email.trim().toLowerCase(),
    shipping_address: {
      first_name: address.firstName.trim(),
      last_name: address.lastName.trim(),
      address_1: address.address.trim(),
      city: address.city.trim(),
      phone: address.phone.trim(),
      country_code: address.countryCode.trim().toLowerCase(),
    },
  });

  if (!updatedCart.items?.length) throw new CheckoutFailure('cart_empty');
  if (!updatedCart.region_id) throw new CheckoutFailure('region_missing');

  const { shipping_options: shippingOptions } = await sdk.store.fulfillment.listCartOptions({
    cart_id: updatedCart.id,
  });
  const shippingOption = shippingOptions.find((option) => option.id === shippingOptionId);
  if (!shippingOption || shippingOption.price_type !== 'flat' || shippingOption.insufficient_inventory) {
    throw new CheckoutFailure('shipping_invalid');
  }

  const { cart: cartWithShipping } = await sdk.store.cart.addShippingMethod(updatedCart.id, {
    option_id: shippingOption.id,
  });
  if (
    !cartWithShipping.shipping_methods?.some((method) => method.shipping_option_id === shippingOption.id) ||
    typeof cartWithShipping.total !== 'number' ||
    cartWithShipping.total < 0
  ) {
    throw new CheckoutFailure('order_failed');
  }

  if (!cartWithShipping.region_id) throw new CheckoutFailure('region_missing');

  const { payment_providers: providers } = await sdk.store.payment.listPaymentProviders({
    region_id: cartWithShipping.region_id,
  });
  const testProvider = providers.find((provider) => provider.id.startsWith('pp_system_default'));
  if (!testProvider) throw new CheckoutFailure('test_provider_missing');

  await sdk.store.payment.initiatePaymentSession(cartWithShipping, {
    provider_id: testProvider.id,
  });

  const result = await sdk.store.cart.complete(cartWithShipping.id, {}, { 'Idempotency-Key': idempotencyKey });
  if (result.type !== 'order') throw new CheckoutFailure('order_failed');

  return result.order;
}
