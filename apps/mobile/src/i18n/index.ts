import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './ar.json';
import en from './en.json';

export type Locale = 'ar' | 'en';
export const SUPPORTED_LOCALES: readonly Locale[] = ['ar', 'en'];
export const DEFAULT_LOCALE: Locale = 'ar';

export function isRtlLocale(locale: Locale): boolean {
  return locale === 'ar';
}

/** Device language -> app locale. Anything that is not `en` falls back to Arabic (docs/03 section C). */
export function pickLocale(deviceLanguageCode: string | null | undefined): Locale {
  return deviceLanguageCode === 'en' ? 'en' : DEFAULT_LOCALE;
}

const i18n = createInstance();
void i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: SUPPORTED_LOCALES as unknown as string[],
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
});

export default i18n;
