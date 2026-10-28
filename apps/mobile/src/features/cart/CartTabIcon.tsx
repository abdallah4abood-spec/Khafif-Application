import Feather from '@expo/vector-icons/Feather';
import { View, StyleSheet, type ColorValue } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCartStore } from '@/api/cart';
import { cartItemCount } from '@/features/cart/cartBadge';
import { colors, radius } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type Props = { color: ColorValue; size: number };

export function CartTabIcon({ color, size }: Props) {
  const { t } = useTranslation();
  const items = useCartStore((state) => state.items);
  const count = cartItemCount(items);
  return (
    <View style={styles.container}>
      <Feather name="shopping-bag" size={size} color={typeof color === 'string' ? color : colors.muted} />
      {count > 0 ? (
        <View style={styles.badge} accessibilityLabel={t('tabs.cartCount', { count })}>
          <AppText variant="caption" style={styles.badgeText}>
            {count > 99 ? '99+' : count}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', width: 28, height: 26, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -6, end: -10, minWidth: 17, height: 17, paddingHorizontal: 3, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.ink, fontSize: 9, lineHeight: 13 },
});
