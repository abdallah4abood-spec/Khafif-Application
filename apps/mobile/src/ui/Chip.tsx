import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, space, TOUCH_TARGET } from '@/theme/tokens';
import { AppText } from './AppText';

type Props = { label: string; selected?: boolean; onPress: () => void };

export function Chip({ label, selected = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      role="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected }}
      style={[styles.chip, selected && styles.selected]}
    >
      <AppText variant="small" style={{ color: selected ? colors.surface : colors.ink }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: TOUCH_TARGET,
    minWidth: TOUCH_TARGET,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
