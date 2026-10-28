import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';

import CheckoutScreen from '@/app/checkout';
import { sdk } from '@/api/sdk';
import { useCartStore } from '@/api/cart';
import { placeTestOrder } from '@/api/checkout';
import i18n from '@/i18n';
import { useSettingsStore } from '@/features/settings/settingsStore';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock('@/api/sdk', () => ({
  sdk: {
    store: {
      cart: {
        retrieve: jest.fn(),
        addShippingMethod: jest.fn(),
      },
      fulfillment: { listCartOptions: jest.fn() },
    },
  },
}));
jest.mock('@/api/catalog', () => ({ getKhafifRegion: jest.fn().mockResolvedValue({ id: 'region-1' }) }));
jest.mock('@/api/checkout', () => {
  const actual = jest.requireActual('@/api/checkout') as typeof import('@/api/checkout');
  return {
    ...actual,
    placeTestOrder: jest.fn(),
    createCheckoutIdempotencyKey: jest.fn(() => 'khafif-test-key'),
  };
});
jest.mock('@/lib/network', () => ({ useIsOnline: () => true }));

const localItem = {
  variantId: 'variant-1',
  productId: 'product-1',
  title: 'Olive oil',
  thumbnail: null,
  unitAmount: 70,
  currencyCode: 'ils',
  quantity: 1,
  stockQuantity: 4,
};

async function renderCheckout() {
  useSettingsStore.setState({ locale: 'en' });
  await i18n.changeLanguage('en');
  useCartStore.setState({ regionId: 'region-1', cartId: 'cart-1', items: [localItem] });
  jest.mocked(sdk.store.cart.retrieve).mockResolvedValue({
    cart: { id: 'cart-1', region_id: 'region-1', currency_code: 'ils', subtotal: 70, total: 70, shipping_total: 0 },
  } as Awaited<ReturnType<typeof sdk.store.cart.retrieve>>);
  jest.mocked(sdk.store.fulfillment.listCartOptions).mockResolvedValue({
    shipping_options: [{
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
      calculated_price: {} as never,
      insufficient_inventory: false,
      service_zone: {} as never,
    }],
  });
  jest.mocked(sdk.store.cart.addShippingMethod).mockResolvedValue({
    cart: { id: 'cart-1', region_id: 'region-1', currency_code: 'ils', subtotal: 90, total: 90, shipping_total: 20 },
  } as Awaited<ReturnType<typeof sdk.store.cart.addShippingMethod>>);
  return render(<I18nextProvider i18n={i18n}><CheckoutScreen /></I18nextProvider>);
}

beforeEach(() => {
  jest.clearAllMocks();
  useCartStore.setState({ regionId: null, cartId: null, items: [] });
});

describe('CheckoutScreen', () => {
  it('validates required customer and delivery fields before submitting', async () => {
    await renderCheckout();
    await screen.findByText('Standard delivery');
    fireEvent.press(screen.getByRole('button', { name: 'Place test order' }));

    expect(await screen.findByText('This field is required.')).toBeTruthy();
    expect(placeTestOrder).not.toHaveBeenCalled();
  });

  it('shows the backend-confirmed order and clears the local cart after success', async () => {
    jest.mocked(placeTestOrder).mockResolvedValue({
      id: 'order-1',
      display_id: 42,
      total: 90,
      currency_code: 'ils',
    } as Awaited<ReturnType<typeof placeTestOrder>>);
    await renderCheckout();
    await screen.findByText('Standard delivery');

    fireEvent.changeText(screen.getByLabelText('Email address'), 'buyer@example.test');
    fireEvent.changeText(screen.getByLabelText('First name'), 'Test');
    fireEvent.changeText(screen.getByLabelText('Last name'), 'Buyer');
    fireEvent.changeText(screen.getByLabelText('Street address'), '1 Sample Street');
    fireEvent.changeText(screen.getByLabelText('City'), 'Hebron');
    fireEvent.changeText(screen.getByLabelText('Phone number'), '1234567');

    fireEvent.press(screen.getByRole('button', { name: 'Place test order' }));

    expect(await screen.findByText('Your test order is confirmed.')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    await waitFor(() => expect(useCartStore.getState().items).toEqual([]));
  });
});
