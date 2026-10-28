import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { LocaleProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';
import { I18nextProvider } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MEDUSA_URL } from '@/api/sdk';
import { useLocale } from '@/features/settings/useLocale';
import { useSettingsStore } from '@/features/settings/settingsStore';
import i18n from '@/i18n';
import { startConnectivity } from '@/lib/network';
import { persistOptions, queryClient } from '@/lib/queryClient';
import { colors } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();
startConnectivity(MEDUSA_URL);

function useSettingsHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useSettingsStore.persist.onFinishHydration(onChange),
    () => useSettingsStore.persist.hasHydrated(),
    () => false,
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });
  const hydrated = useSettingsHydrated();
  const { locale, isRTL } = useLocale();

  // Keep i18next in step with the resolved locale (stored choice or device default).
  if (i18n.language !== locale) void i18n.changeLanguage(locale);

  const ready = hydrated && (fontsLoaded || fontError !== null);
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // Hold the splash only for fonts + locale; never for the network (docs/07).
  if (!ready) return null;

  const direction = isRTL ? 'rtl' : 'ltr';
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider>
          <LocaleProvider direction={direction}>
            {/* `direction` mirrors layout without a native reload (Expo Go cannot force RTL at runtime; ADR-7). */}
            <View style={{ flex: 1, direction, backgroundColor: colors.bg }}>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }} />
            </View>
          </LocaleProvider>
        </SafeAreaProvider>
      </I18nextProvider>
    </PersistQueryClientProvider>
  );
}
