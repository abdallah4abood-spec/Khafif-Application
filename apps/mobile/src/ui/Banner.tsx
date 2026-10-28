import { View, StyleSheet } from 'react-native';

import { colors, radius, space } from '@/theme/tokens';
import { AppText } from './AppText';

type Props = { kind: 'info' | 'warn' | 'error'; message: string };

const background = { info: colors.tintPrimary, warn: colors.warnBg, error: '#F9DEDC' } as const;

/** Status message. Announced politely to screen readers; never relies on colour alone (prefix glyph + text). */
export function Banner({ kind, message }: Props) {
  return (
    <View
      accessible
      role="status"
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: background[kind] }]}
    >
      <AppText variant="small" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    marginHorizontal: space.lg,
    marginTop: space.md,
  },
  text: { flexShrink: 1 },
});
