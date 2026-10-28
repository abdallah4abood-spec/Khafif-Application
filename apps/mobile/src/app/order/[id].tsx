import Feather from '@expo/vector-icons/Feather';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useLocale } from '@/features/settings/useLocale';
import { formatMoney } from '@/lib/money';
import { colors, space } from '@/theme/tokens';
import { ActionButton } from '@/ui/ActionButton';
import { AppText } from '@/ui/AppText';
import { EmptyState } from '@/ui/EmptyState';
import { Screen } from '@/ui/Screen';

type OrderSnapshot = {
  displayId: number | null;
  currencyCode: string;
  total: number | null;
};

function readSnapshot(raw: string | undefined): OrderSnapshot | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const snapshot = value as Partial<OrderSnapshot>;
    if (
      typeof snapshot.currencyCode !== 'string' ||
      typeof snapshot.total !== 'number'
    ) return null;
    return {
      displayId: typeof snapshot.displayId === 'number' ? snapshot.displayId : null,
      currencyCode: snapshot.currencyCode,
      total: snapshot.total,
    };
  } catch {
    return null;
  }
}

export default function OrderConfirmationScreen() {
  const { id, summary } = useLocalSearchParams<{ id: string; summary?: string }>();
  const order = readSnapshot(summary);
  const { t } = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();

  return (
    <Screen>
      <Stack.Screen options={{ title: t('checkout.success'), headerBackVisible: false }} />
      {order ? (
        <View style={styles.container}>
          <View style={styles.successMark}>
            <Feather name="check" size={40} color={colors.surface} />
          </View>
          <AppText variant="title" style={styles.center}>{t('checkout.success')}</AppText>
          <AppText variant="bodyStrong" color="muted">{t('checkout.orderNumber')}</AppText>
          <AppText variant="heading" color="primary">{order.displayId ?? id}</AppText>
          <AppText variant="heading">
            {formatMoney(order.total, order.currencyCode, locale)}
          </AppText>
          <AppText variant="small" color="muted">{t('checkout.testMode')}</AppText>
          <ActionButton label={t('checkout.continue')} onPress={() => router.replace('/(tabs)')} style={styles.continueButton} />
        </View>
      ) : (
        <View style={styles.container}>
          <EmptyState title={t('checkout.success')} message={t('checkout.orderNotFound')} />
          <ActionButton label={t('checkout.continue')} onPress={() => router.replace('/(tabs)')} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  successMark: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  continueButton: { width: '100%', marginTop: space.lg },
});
