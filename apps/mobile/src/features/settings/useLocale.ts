import { getLocales } from 'expo-localization';
import { useCallback } from 'react';

import i18n, { isRtlLocale, pickLocale, type Locale } from '@/i18n';
import { useSettingsStore } from './settingsStore';

/** Stored choice wins; otherwise the device language (en -> en, anything else -> ar). */
export function resolveLocale(stored: Locale | null, deviceLanguageCode: string | null | undefined): Locale {
  return stored ?? pickLocale(deviceLanguageCode);
}

export function useLocale() {
  const stored = useSettingsStore((s) => s.locale);
  const setStored = useSettingsStore((s) => s.setLocale);
  const locale = resolveLocale(stored, getLocales()[0]?.languageCode);

  const setLocale = useCallback(
    (next: Locale) => {
      setStored(next);
      void i18n.changeLanguage(next);
    },
    [setStored],
  );

  return { locale, setLocale, isRTL: isRtlLocale(locale) };
}
