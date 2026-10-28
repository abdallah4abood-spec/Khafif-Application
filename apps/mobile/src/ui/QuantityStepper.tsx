import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, View } from 'react-native';

import { MAX_CART_QUANTITY } from '@/api/cart';
import { colors, radius, space, TOUCH_TARGET } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type Props = {
  quantity: number;
  onChange: (quantity: number) => void;
  maximum?: number | null;
  disabled?: boolean;
  decreaseLabel: string;
  increaseLabel: string;
};

export function QuantityStepper({
  quantity,
  onChange,
  maximum = MAX_CART_QUANTITY,
  disabled = false,
  decreaseLabel,
  increaseLabel,
}: Props) {
  const maxQuantity = Math.max(1, Math.min(maximum ?? MAX_CART_QUANTITY, MAX_CART_QUANTITY));
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={decreaseLabel}
        accessibilityState={{ disabled: disabled || quantity <= 1 }}
        disabled={disabled || quantity <= 1}
        onPress={() => onChange(Math.max(1, quantity - 1))}
        style={styles.control}
      >
        <Feather name="minus" size={16} color={colors.primary} />
      </Pressable>
      <AppText
        accessibilityLabel={`${quantity}`}
        accessibilityRole="text"
        variant="bodyStrong"
        style={styles.quantity}
      >
        {quantity}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={increaseLabel}
        accessibilityState={{ disabled: disabled || quantity >= maxQuantity }}
        disabled={disabled || quantity >= maxQuantity}
        onPress={() => onChange(Math.min(maxQuantity, quantity + 1))}
        style={styles.control}
      >
        <Feather name="plus" size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.xs,
  },
  control: { width: TOUCH_TARGET, height: TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
  quantity: { minWidth: 28, textAlign: 'center' },
});
