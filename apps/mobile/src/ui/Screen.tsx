import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { colors } from '@/theme/tokens';
import { OfflineBanner } from './OfflineBanner';

/** Standard screen wrapper: background + connectivity banner. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <OfflineBanner />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
