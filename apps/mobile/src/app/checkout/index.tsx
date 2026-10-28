import Feather from '@expo/vector-icons/Feather';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { syncLocalCart, useCartStore } from '@/api/cart';
import { CheckoutFailure, createCheckoutIdempotencyKey, placeTestOrder, validateAddress, type AddressInput, type CheckoutError, type StoreShippingOption } from '@/api/checkout';
import { getKhafifRegion } from '@/api/catalog';
import { sdk } from '@/api/sdk';
import { useLocale } from '@/features/settings/useLocale';
import { formatMoney } from '@/lib/money';
import { useIsOnline } from '@/lib/network';
import { colors, radius, space, TOUCH_TARGET } from '@/theme/tokens';
import { ActionButton } from '@/ui/ActionButton';
import { AppText } from '@/ui/AppText';
import { Banner } from '@/ui/Banner';
import { EmptyState } from '@/ui/EmptyState';
import { Screen } from '@/ui/Screen';

const INITIAL_ADDRESS: AddressInput = {
  email: '',
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  phone: '',
  countryCode: 'ps',
};

type ShippingOption = StoreShippingOption;

function checkoutMessage(error: CheckoutError, t: (key: string) => string): string {
  switch (error) {
    case 'invalid_email': return t('checkout.invalidEmail');
    case 'invalid_address': return t('checkout.required');
    case 'cart_empty': return t('checkout.emptyCart');
    case 'region_missing': return t('checkout.loadError');
    case 'shipping_invalid': return t('checkout.shippingRequired');
    case 'test_provider_missing': return t('checkout.providerMissing');
    case 'order_failed': return t('checkout.submitError');
  }
}

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();
  const online = useIsOnline();
  const items = useCartStore((state) => state.items);
  const regionId = useCartStore((state) => state.regionId);
  const storedCartId = useCartStore((state) => state.cartId);
  const setCartId = useCartStore((state) => state.setCartId);
  const clearCart = useCartStore((state) => state.clear);
  const [address, setAddress] = useState<AddressInput>(INITIAL_ADDRESS);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AddressInput, string>>>({});
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [shippingError, setShippingError] = useState(false);
  const [cartId, setCheckoutCartId] = useState(storedCartId);
  const [cartTotals, setCartTotals] = useState<{ subtotal: number | null; total: number | null; shipping: number | null; currencyCode: string }>({
    subtotal: null,
    total: null,
    shipping: null,
    currencyCode: items[0]?.currencyCode ?? 'ils',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasPriceChanged, setHasPriceChanged] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [order, setOrder] = useState<{ id: string; displayId?: number | null } | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(createCheckoutIdempotencyKey);
  const submitLock = useRef(false);

  useEffect(() => {
    let active = true;
    if (!online || !regionId || items.length === 0) return;

    const loadCartAndShipping = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const synced = await syncLocalCart(regionId, storedCartId, items);
        if (!active) return;
        setCartId(synced.cartId);
        setCheckoutCartId(synced.cartId);
        const { cart } = await sdk.store.cart.retrieve(synced.cartId);
        if (!active) return;
        setCartTotals({
          subtotal: typeof cart.subtotal === 'number' ? cart.subtotal : null,
          total: typeof cart.total === 'number' ? cart.total : null,
          shipping: typeof cart.shipping_total === 'number' ? cart.shipping_total : null,
          currencyCode: cart.currency_code ?? synced.currencyCode,
        });
        const region = await getKhafifRegion();
        if (!region) throw new Error('Missing Medusa ILS region.');
        const { shipping_options } = await sdk.store.fulfillment.listCartOptions({ cart_id: synced.cartId });
        if (!active) return;
        const validOptions = shipping_options.filter((option) => !option.insufficient_inventory);
        setShippingOptions(validOptions);
        const initialSelection = validOptions[0];
        setShippingError(false);
        setSelectedShippingId(initialSelection?.id ?? null);
        if (initialSelection?.price_type === 'flat') {
          const { cart: pricedCart } = await sdk.store.cart.addShippingMethod(synced.cartId, {
            option_id: initialSelection.id,
          });
          if (!active) return;
          setCartTotals({
            subtotal: typeof pricedCart.subtotal === 'number' ? pricedCart.subtotal : null,
            total: typeof pricedCart.total === 'number' ? pricedCart.total : null,
            shipping: typeof pricedCart.shipping_total === 'number' ? pricedCart.shipping_total : initialSelection.amount,
            currencyCode: pricedCart.currency_code ?? synced.currencyCode,
          });
        } else if (initialSelection) {
          setShippingError(true);
        }
      } catch {
        if (active) setErrorMessage(t('checkout.loadError'));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadCartAndShipping();
    return () => { active = false; };
    // Use a stable cart key so field edits don't reissue checkout reads.
  }, [online, regionId, items, storedCartId, setCartId, reloadToken, t]);

  function updateAddress(field: keyof AddressInput, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setErrorMessage('');
  }

  async function submitOrder() {
    if (!online || !cartId || submitLock.current || confirmed) return;
    const validationError = validateAddress(address);
    const errors: Partial<Record<keyof AddressInput, string>> = {};
    if (!address.firstName.trim()) errors.firstName = t('checkout.required');
    if (!address.lastName.trim()) errors.lastName = t('checkout.required');
    if (!address.address.trim()) errors.address = t('checkout.required');
    if (!address.city.trim()) errors.city = t('checkout.required');
    if (!address.phone.trim()) errors.phone = t('checkout.required');
    if (!address.countryCode.trim()) errors.countryCode = t('checkout.required');
    if (!/^\S+@\S+\.\S+$/.test(address.email.trim())) errors.email = t('checkout.invalidEmail');
    setFieldErrors(errors);
    if (validationError || !selectedShippingId || hasPriceChanged) {
      if (hasPriceChanged) setErrorMessage(t('checkout.changeReview'));
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const placedOrder = await placeTestOrder({
        cartId,
        address,
        shippingOptionId: selectedShippingId,
        idempotencyKey,
      });
      const orderTotal = typeof placedOrder.total === 'number' ? placedOrder.total : null;
      setOrder({ id: placedOrder.id, displayId: placedOrder.display_id });
      setCartTotals((current) => ({
        ...current,
        total: orderTotal,
        currencyCode: placedOrder.currency_code ?? current.currencyCode,
      }));
      setConfirmed(true);
      clearCart();
      setIdempotencyKey(createCheckoutIdempotencyKey());
    } catch (error) {
      const reason = error instanceof CheckoutFailure ? error.reason : 'order_failed';
      setErrorMessage(checkoutMessage(reason, t));
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }

  if (items.length === 0 && !confirmed) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t('checkout.title') }} />
        <View style={styles.emptyState}>
          <EmptyState title={t('cart.empty')} message={t('checkout.emptyCart')} />
          <ActionButton label={t('cart.continueShopping')} onPress={() => router.replace('/(tabs)')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: confirmed ? t('checkout.success') : t('checkout.title') }} />
      {confirmed && order ? (
        <View style={styles.confirmation}>
          <View style={styles.successMark}>
            <Feather name="check" size={40} color={colors.surface} />
          </View>
          <AppText variant="title" style={styles.center}>{t('checkout.success')}</AppText>
          <AppText variant="bodyStrong" color="muted">{t('checkout.orderNumber')}</AppText>
          <AppText variant="heading" color="primary">{order.displayId ?? order.id}</AppText>
          <SummaryRow label={t('checkout.total')} amount={cartTotals.total} currencyCode={cartTotals.currencyCode} locale={locale} />
          <AppText variant="small" color="muted">{t('checkout.testMode')}</AppText>
          <ActionButton
            label={t('checkout.viewOrder')}
            onPress={() => router.replace({
              pathname: '/order/[id]',
              params: {
                id: order.id,
                summary: JSON.stringify({
                  displayId: order.displayId ?? null,
                  currencyCode: cartTotals.currencyCode,
                  total: cartTotals.total,
                }),
              },
            })}
            style={styles.continueButton}
          />
          <ActionButton label={t('checkout.continue')} secondary onPress={() => router.replace('/(tabs)')} />
        </View>
      ) : !online ? (
        <View style={styles.offline}>
          <Banner kind="warn" message={t('offline.bannerShort')} />
          <AppText variant="heading" style={styles.center}>{t('cart.checkoutOffline')}</AppText>
          <AppText color="muted" style={styles.center}>{t('checkout.submitError')}</AppText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Banner kind="info" message={t('checkout.testMode')} />
          {errorMessage ? (
            <View style={styles.errorBlock}>
              <Banner kind="error" message={errorMessage} />
              <ActionButton label={t('common.retry')} secondary onPress={() => setReloadToken((current) => current + 1)} />
            </View>
          ) : null}
          {shippingError ? <Banner kind="error" message={t('checkout.calculatedShippingUnavailable')} /> : null}
          {isLoading ? (
            <View style={styles.loader} accessibilityRole="progressbar" accessibilityLabel={t('common.loading')}>
              <ActivityIndicator color={colors.primary} />
              <AppText color="muted">{t('common.loading')}</AppText>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <AppText variant="heading">{t('checkout.stepAddress')}</AppText>
                <Field
                  label={t('checkout.email')}
                  value={address.email}
                  onChangeText={(value) => updateAddress('email', value)}
                  error={fieldErrors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.nameRow}>
                  <Field
                    label={t('checkout.firstName')}
                    value={address.firstName}
                    onChangeText={(value) => updateAddress('firstName', value)}
                    error={fieldErrors.firstName}
                  />
                  <Field
                    label={t('checkout.lastName')}
                    value={address.lastName}
                    onChangeText={(value) => updateAddress('lastName', value)}
                    error={fieldErrors.lastName}
                  />
                </View>
                <Field
                  label={t('checkout.address')}
                  value={address.address}
                  onChangeText={(value) => updateAddress('address', value)}
                  error={fieldErrors.address}
                />
                <Field
                  label={t('checkout.city')}
                  value={address.city}
                  onChangeText={(value) => updateAddress('city', value)}
                  error={fieldErrors.city}
                />
                <View style={styles.nameRow}>
                  <Field
                    label={t('checkout.phone')}
                    value={address.phone}
                    onChangeText={(value) => updateAddress('phone', value)}
                    error={fieldErrors.phone}
                    keyboardType="phone-pad"
                  />
                  <Field
                    label={t('checkout.country')}
                    value={address.countryCode.toUpperCase()}
                    onChangeText={(value) => updateAddress('countryCode', value)}
                    error={fieldErrors.countryCode}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.section}>
                <AppText variant="heading">{t('checkout.shipping')}</AppText>
                {shippingOptions.length === 0 ? (
                  <AppText color="muted">{t('checkout.loadError')}</AppText>
                ) : shippingOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selectedShippingId === option.id, selected: selectedShippingId === option.id }}
                    onPress={() => {
                      if (option.price_type !== 'flat') return;
                      if (option.price_type !== 'flat' || !cartId) return;
                      setSelectedShippingId(option.id);
                      setHasPriceChanged(true);
                      setShippingError(false);
                      void sdk.store.cart.addShippingMethod(cartId, { option_id: option.id }).then(({ cart: pricedCart }) => {
                        setCartTotals((current) => ({
                          ...current,
                          subtotal: typeof pricedCart.subtotal === 'number' ? pricedCart.subtotal : current.subtotal,
                          total: typeof pricedCart.total === 'number' ? pricedCart.total : null,
                          shipping: typeof pricedCart.shipping_total === 'number' ? pricedCart.shipping_total : option.amount,
                          currencyCode: pricedCart.currency_code ?? current.currencyCode,
                        }));
                        setHasPriceChanged(false);
                      }).catch(() => {
                        setErrorMessage(t('checkout.loadError'));
                      });
                    }}
                    style={[styles.shippingOption, selectedShippingId === option.id && styles.shippingOptionSelected]}
                  >
                    <Feather
                      name={selectedShippingId === option.id ? 'check-circle' : 'circle'}
                      size={20}
                      color={selectedShippingId === option.id ? colors.primary : colors.muted}
                    />
                    <View style={styles.shippingDetails}>
                      <AppText variant="bodyStrong">{t(option.name === 'Pickup' ? 'checkout.pickup' : 'checkout.standard')}</AppText>
                      {option.type?.description ? <AppText variant="caption" color="muted">{option.type.description}</AppText> : null}
                    </View>
                    <AppText variant="small" color="primary">
                      {option.price_type === 'flat'
                        ? formatMoney(option.amount, cartTotals.currencyCode, locale)
                        : t('checkout.calculatedShippingUnavailable')}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <View style={styles.section}>
                <AppText variant="heading">{t('checkout.review')}</AppText>
                {items.map((item) => (
                  <View key={item.variantId} style={styles.summaryRow}>
                    <AppText style={styles.summaryItem} numberOfLines={2}>{item.title} × {item.quantity}</AppText>
                    <AppText variant="small">{formatMoney(item.unitAmount * item.quantity, item.currencyCode, locale)}</AppText>
                  </View>
                ))}
                <SummaryRow label={t('checkout.subtotal')} amount={cartTotals.subtotal} currencyCode={cartTotals.currencyCode} locale={locale} />
                <SummaryRow label={t('checkout.shippingTotal')} amount={cartTotals.shipping} currencyCode={cartTotals.currencyCode} locale={locale} />
                <View style={styles.totalRow}>
                  <AppText variant="heading">{t('checkout.total')}</AppText>
                  <AppText variant="heading" color="primary">
                    {formatMoney(cartTotals.total, cartTotals.currencyCode, locale)}
                  </AppText>
                </View>
              </View>

              <ActionButton
                label={t('checkout.placeOrder')}
                onPress={() => void submitOrder()}
                loading={isSubmitting}
                disabled={isSubmitting || !cartId || !selectedShippingId || cartTotals.total === null || hasPriceChanged || shippingError}
              />
            </>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  keyboardType?: 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function Field({ label, value, onChangeText, error, keyboardType, autoCapitalize }: FieldProps) {
  return (
    <View style={styles.field}>
      <AppText variant="small">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'words'}
        autoCorrect={false}
        style={[styles.input, error ? styles.inputError : undefined]}
      />
      {error ? <AppText accessibilityLiveRegion="polite" variant="caption" color="error">{error}</AppText> : null}
    </View>
  );
}

type SummaryRowProps = { label: string; amount: number | null; currencyCode: string; locale: 'ar' | 'en' };
function SummaryRow({ label, amount, currencyCode, locale }: SummaryRowProps) {
  return (
    <View style={styles.summaryRow}>
      <AppText color="muted">{label}</AppText>
      <AppText>{formatMoney(amount, currencyCode, locale)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.lg },
  content: { padding: space.lg, paddingBottom: space.xxxl, gap: space.xl },
  offline: { flex: 1, justifyContent: 'center', gap: space.md, padding: space.xl },
  confirmation: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  successMark: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  continueButton: { width: '100%', marginTop: space.lg },
  center: { textAlign: 'center' },
  loader: { alignItems: 'center', justifyContent: 'center', minHeight: 160, gap: space.md },
  errorBlock: { gap: space.md },
  section: { gap: space.md },
  nameRow: { flexDirection: 'row', gap: space.md },
  field: { flex: 1, minWidth: 0, gap: space.xs },
  input: { width: '100%', minHeight: TOUCH_TARGET + 8, borderWidth: 1, borderColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: space.md, backgroundColor: colors.surface, color: colors.ink, fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 16, textAlign: 'auto' },
  inputError: { borderColor: colors.error },
  shippingOption: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: TOUCH_TARGET + 12, padding: space.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.surfaceAlt },
  shippingOptionSelected: { borderColor: colors.primary, backgroundColor: colors.tintPrimary },
  shippingDetails: { flex: 1, minWidth: 0, gap: space.xs },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, paddingVertical: space.xs },
  summaryItem: { flex: 1, minWidth: 0 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, marginTop: space.sm, paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.surfaceAlt },
});
