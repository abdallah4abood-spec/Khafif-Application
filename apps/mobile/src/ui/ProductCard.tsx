import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { metadataText, type CatalogProduct } from '@/api/catalog';
import { useLocale } from '@/features/settings/useLocale';
import { formatMoney } from '@/lib/money';
import { colors, radius, space } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type Props = { product: CatalogProduct; onPress: () => void; accessibilityLabel?: string };

export function ProductCard({ product, onPress, accessibilityLabel }: Props) {
  const { locale } = useLocale();
  const name = locale === 'ar' ? metadataText(product.metadata, 'title_ar', product.title) : product.title;
  const prices = (product.variants ?? [])
    .map((variant) => variant.calculated_price?.calculated_amount)
    .filter((amount): amount is number => typeof amount === 'number' && Number.isFinite(amount));
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const currency = product.variants?.[0]?.calculated_price?.currency_code ?? 'ils';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${name}, ${formatMoney(minPrice, currency, locale)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {product.thumbnail ? (
        <Image
          source={{ uri: product.thumbnail }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={120}
          accessibilityLabel={name}
        />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Feather name="image" size={28} color={colors.muted} />
        </View>
      )}
      <View style={styles.details}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {name}
        </AppText>
        <AppText variant="small" color="primary">
          {minPrice === null
            ? locale === 'ar'
              ? 'السعر غير متوفر'
              : 'Price unavailable'
            : minPrice === maxPrice
              ? formatMoney(minPrice, currency, locale)
              : `${formatMoney(minPrice, currency, locale)} – ${formatMoney(maxPrice, currency, locale)}`}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderColor: colors.surfaceAlt,
    borderWidth: 1,
    borderRadius: radius.xl,
  },
  image: { width: '100%', height: 136, backgroundColor: colors.surfaceAlt },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  details: { padding: space.md, gap: space.xs },
  pressed: { borderColor: colors.primary },
});
