import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AppErrorKind } from '@/api/errors';
import { colors, space } from '@/theme/tokens';
import { ActionButton } from '@/ui/ActionButton';
import { AppText } from '@/ui/AppText';

type Props = { kind: AppErrorKind; retry: () => void; loading?: boolean };

export function RetryState({ kind, retry, loading = false }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <AppText variant="heading">{t('errors.title')}</AppText>
      <AppText color="muted" style={styles.message}>{t(`errors.${kind}`)}</AppText>
      <ActionButton label={t('common.retry')} onPress={retry} loading={loading} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.md },
  message: { textAlign: 'center' },
  button: { marginTop: space.sm, minWidth: 160, backgroundColor: colors.primary },
});
