import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { syncLocalCart, useCartStore } from '@/api/cart';
import { useLocale } from '@/features/settings/useLocale';
import { formatMoney } from '@/lib/money';
import { useIsOnline } from '@/lib/network';
import { colors, space } from '@/theme/tokens';
import { ActionButton } from '@/ui/ActionButton';
import { AppText } from '@/ui/AppText';
import { Banner } from '@/ui/Banner';
import { EmptyState } from '@/ui/EmptyState';
import { QuantityStepper } from '@/ui/QuantityStepper';
import { Screen } from '@/ui/Screen';

export default function CartScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const online = useIsOnline();
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const regionId = useCartStore((state) => state.regionId);
  const cartId = useCartStore((state) => state.cartId);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const setCartId = useCartStore((state) => state.setCartId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const unitSubtotal = items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
  const currencyCode = items[0]?.currencyCode ?? 'ils';

  async function continueToCheckout() {
    if (!online || !regionId || items.length === 0 || isLoading) return;
    setError(false);
    setIsLoading(true);
    try {
      const cart = await syncLocalCart(regionId, cartId, items);
      setCartId(cart.cartId);
      const serverVariantIds = new Set(cart.itemVariantIds);
      for (const item of items) {
        if (!serverVariantIds.has(item.variantId)) {
          throw new Error('The store cart did not contain every selected item.');
        }
      }
      router.push('/checkout');
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Feather name="shopping-bag" size={36} color={colors.primary} />
          <EmptyState title={t('cart.empty')} message={t('cart.emptyMessage')} />
          <ActionButton label={t('cart.continueShopping')} onPress={() => router.push('/(tabs)')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.variantId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            {item.thumbnail ? (
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.thumbnail}
                contentFit="cover"
                cachePolicy="memory-disk"
                accessibilityLabel={item.title}
              />
            ) : null}
            <View style={styles.itemDetails}>
              <AppText variant="bodyStrong" numberOfLines={2}>{item.title}</AppText>
              <AppText variant="small" color="muted">{formatMoney(item.unitAmount, item.currencyCode, locale)}</AppText>
              <QuantityStepper
                quantity={item.quantity}
                maximum={item.stockQuantity}
                onChange={(quantity) => setQuantity(item.variantId, quantity)}
                decreaseLabel={t('cart.decreaseQuantity')}
                increaseLabel={t('cart.increaseQuantity')}
              />
            </View>
            <View style={styles.itemActions}>
              <AppText variant="bodyStrong" color="primary">
                {formatMoney(item.unitAmount * item.quantity, item.currencyCode, locale)}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('cart.remove')} ${item.title}`}
                onPress={() => removeItem(item.variantId)}
                style={styles.removeButton}
              >
                <Feather name="trash-2" size={19} color={colors.error} />
              </Pressable>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.heading}>
            <AppText variant="title">{t('cart.title')}</AppText>
            {!online ? <Banner kind="warn" message={t('offline.banner')} /> : null}
            {error ? <Banner kind="error" message={t('cart.syncError')} /> : null}
          </View>
        }
        ListFooterComponent={
          <View style={styles.summary}>
            <AppText variant="small" color="muted">{t('cart.estimatedTotal')}</AppText>
            <AppText variant="title" color="primary">
              {formatMoney(unitSubtotal, currencyCode, locale)}
            </AppText>
            <AppText variant="caption" color="muted">{t('cart.estimateNote')}</AppText>
          </View>
        }
      />
      <View style={styles.bottomBar}>
        <ActionButton
          label={online ? t('cart.checkout') : t('cart.checkoutOffline')}
          onPress={() => void continueToCheckout()}
          disabled={!online || !regionId || items.length === 0}
          loading={isLoading}
        />
        <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)')} style={styles.keepShopping}>
          <AppText variant="small" color="primary">{t('cart.continueShopping')}</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xl },
  list: { paddingHorizontal: space.lg, paddingBottom: space.lg, flexGrow: 1 },
  heading: { gap: space.sm, paddingVertical: space.lg },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  thumbnail: { width: 68, height: 68, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  itemDetails: { flex: 1, minWidth: 0, gap: space.sm },
  itemActions: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' },
  removeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  separator: { height: 1, backgroundColor: colors.surfaceAlt },
  summary: { alignItems: 'flex-start', gap: space.sm, paddingVertical: space.xl, marginTop: space.md, borderTopWidth: 1, borderColor: colors.surfaceAlt },
  bottomBar: { padding: space.lg, gap: space.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.surfaceAlt },
  keepShopping: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
