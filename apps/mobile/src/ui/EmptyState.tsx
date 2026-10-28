import { View, StyleSheet } from 'react-native';

import { space } from '@/theme/tokens';
import { AppText } from './AppText';

type Props = { title: string; message?: string };

export function EmptyState({ title, message }: Props) {
  return (
    <View style={styles.box}>
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      {message ? (
        <AppText color="muted" style={styles.center}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.sm },
  center: { textAlign: 'center' },
});
