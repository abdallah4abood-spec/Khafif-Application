import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useLocale } from '@/features/settings/useLocale';
import { useIsOnline } from '@/lib/network';
import { space } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Chip } from '@/ui/Chip';
import { Screen } from '@/ui/Screen';

export default function AccountScreen() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const online = useIsOnline();

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.section}>
          <AppText variant="heading">{t('account.language')}</AppText>
          <View style={styles.row} role="radiogroup">
            <Chip
              label={t('account.languageAr')}
              selected={locale === 'ar'}
              onPress={() => setLocale('ar')}
            />
            <Chip
              label={t('account.languageEn')}
              selected={locale === 'en'}
              onPress={() => setLocale('en')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="heading">{t('account.connection')}</AppText>
          <AppText>{online ? t('account.online') : t('account.offline')}</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="heading">{t('account.about')}</AppText>
          <AppText color="muted">{t('account.aboutText')}</AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, gap: space.xxl },
  section: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
});
