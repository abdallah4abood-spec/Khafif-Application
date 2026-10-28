import Feather from '@expo/vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { createLocalCartItem, useCartStore } from '@/api/cart';
import { getKhafifRegion, getProduct, metadataText } from '@/api/catalog';
import { toAppError } from '@/api/errors';
import { useLocale } from '@/features/settings/useLocale';
import { formatMoney } from '@/lib/money';
import { useIsOnline } from '@/lib/network';
import { colors, radius, space } from '@/theme/tokens';
import { ActionButton } from '@/ui/ActionButton';
import { AppText } from '@/ui/AppText';
import { Banner } from '@/ui/Banner';
import { Chip } from '@/ui/Chip';
import { QuantityStepper } from '@/ui/QuantityStepper';
import { RetryState } from '@/ui/RetryState';
import { Screen } from '@/ui/Screen';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const online = useIsOnline();
  const addItem = useCartStore((state) => state.addItem);
  const setRegionId = useCartStore((state) => state.setRegionId);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const regionQuery = useQuery({
    queryKey: ['catalog', 'region', 'ils'],
    queryFn: getKhafifRegion,
    staleTime: 24 * 60 * 60 * 1000,
    networkMode: 'offlineFirst',
  });
  const productQuery = useQuery({
    queryKey: ['catalog', 'product', id, regionQuery.data?.id ?? '', locale],
    queryFn: () => getProduct(id, regionQuery.data?.id ?? '', locale),
    enabled: Boolean(id && regionQuery.data?.id),
    staleTime: 10 * 60 * 1000,
    networkMode: 'offlineFirst',
  });

  const product = productQuery.data?.product;
  const options = useMemo(() => product?.options ?? [], [product?.options]);
  const variants = useMemo(() => product?.variants ?? [], [product?.variants]);
  const selectedVariant = useMemo(() => {
    if (!product) return null;
    if (options.length === 0) return variants[0] ?? null;
    if (!options.every((option) => selectedOptions[option.id] !== undefined)) return null;

    return variants.find((variant) =>
      options.every((option) =>
        variant.options?.some(
          (optionValue) => optionValue.option_id === option.id && optionValue.value === selectedOptions[option.id],
        ),
      ),
    ) ?? null;
  }, [options, product, selectedOptions, variants]);
  const stockQuantity = selectedVariant?.manage_inventory === false
    ? null
    : typeof selectedVariant?.inventory_quantity === 'number'
      ? selectedVariant.inventory_quantity
      : 0;
  const inStock = Boolean(selectedVariant && (stockQuantity === null || stockQuantity > 0));
  const name = product
    ? locale === 'ar' ? metadataText(product.metadata, 'title_ar', product.title) : product.title
    : '';
  const description = product
    ? locale === 'ar' ? metadataText(product.metadata, 'description_ar', product.description ?? '') : product.description ?? ''
    : '';
  const amount = selectedVariant?.calculated_price?.calculated_amount;
  const currencyCode = selectedVariant?.calculated_price?.currency_code ?? 'ils';
  const firstImage = product?.images?.[0]?.url ?? product?.thumbnail ?? null;

  return (
    <Screen>
      <Stack.Screen options={{ title: t('product.title'), headerBackTitle: t('common.back') }} />
      {productQuery.isPending ? (
        <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel={t('product.loading')}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText color="muted">{t('common.loading')}</AppText>
        </View>
      ) : productQuery.error ? (
        <RetryState
          kind={toAppError(productQuery.error).kind}
          retry={() => void productQuery.refetch()}
          loading={productQuery.isFetching}
        />
      ) : !product ? (
        <RetryState kind="not_found" retry={() => router.replace('/(tabs)')} />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            {firstImage ? (
              <Image
                source={{ uri: firstImage }}
                style={styles.heroImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={120}
                accessibilityLabel={name}
              />
            ) : (
              <View style={[styles.heroImage, styles.noImage]}>
                <Feather name="image" size={40} color={colors.muted} />
              </View>
            )}
            {product.images && product.images.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
                {product.images.map((image) => (
                  <Image
                    key={image.id}
                    source={{ uri: image.url }}
                    style={styles.galleryImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    accessibilityLabel={name}
                  />
                ))}
              </ScrollView>
            ) : null}
            <View style={styles.descriptionBlock}>
              <AppText variant="title">{name}</AppText>
              <AppText color="muted">{description}</AppText>
              {typeof amount === 'number' ? (
                <AppText variant="heading" color="primary">{formatMoney(amount, currencyCode, locale)}</AppText>
              ) : null}
            </View>
            {options.map((option) => {
              const optionName = locale === 'ar'
                ? metadataText(product.metadata, 'option_ar', option.title)
                : option.title;
              return (
                <View key={option.id} style={styles.optionGroup}>
                  <AppText variant="heading">{optionName || t('product.option')}</AppText>
                  <View style={styles.optionChips}>
                    {(option.values ?? []).map((value) => (
                      <Chip
                        key={value.id}
                        label={value.value ?? ''}
                        selected={selectedOptions[option.id] === value.value}
                        onPress={() => {
                          setSelectedOptions((current) => ({ ...current, [option.id]: value.value ?? '' }));
                          setAdded(false);
                        }}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
            {selectedVariant ? (
              <View style={styles.optionGroup}>
                <AppText variant="heading">{t('product.quantity')}</AppText>
                {inStock ? (
                  <QuantityStepper
                    quantity={quantity}
                    maximum={stockQuantity}
                    onChange={setQuantity}
                    decreaseLabel={t('cart.decreaseQuantity')}
                    increaseLabel={t('cart.increaseQuantity')}
                  />
                ) : <AppText color="error">{t('product.outOfStock')}</AppText>}
              </View>
            ) : options.length > 0 ? (
              <AppText color="muted">{t('product.chooseOption')}</AppText>
            ) : null}
            {!online ? <Banner kind="warn" message={t('offline.bannerShort')} /> : null}
          </ScrollView>
          <View style={styles.bottomBar}>
            {added ? <AppText accessibilityLiveRegion="polite" color="success">{t('product.added')}</AppText> : null}
            <ActionButton
              label={selectedVariant ? t('product.addToCart') : t('product.chooseOption')}
              disabled={!inStock || typeof amount !== 'number'}
              onPress={() => {
                if (!product || !selectedVariant || !regionQuery.data) return;
                const localItem = createLocalCartItem(product, selectedVariant.id, locale);
                if (!localItem) return;
                setRegionId(regionQuery.data.id);
                addItem({ ...localItem, quantity });
                setAdded(true);
              }}
            />
            {added ? (
              <ActionButton label={t('cart.title')} secondary onPress={() => router.push('/(tabs)/cart')} />
            ) : null}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.lg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  heroImage: { width: '100%', height: 280, backgroundColor: colors.surfaceAlt, borderRadius: radius.xl },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  gallery: { gap: space.sm },
  galleryImage: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  descriptionBlock: { gap: space.sm },
  optionGroup: { gap: space.sm },
  optionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  bottomBar: { padding: space.lg, paddingBottom: space.xl, gap: space.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.surfaceAlt },
});
