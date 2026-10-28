import AsyncStorage from '@react-native-async-storage/async-storage';

import { SETTINGS_STORAGE_KEY, useSettingsStore } from '@/features/settings/settingsStore';
import { resolveLocale } from '@/features/settings/useLocale';

describe('resolveLocale', () => {
  it('prefers the stored choice over the device language', () => {
    expect(resolveLocale('en', 'ar')).toBe('en');
    expect(resolveLocale('ar', 'en')).toBe('ar');
  });
  it('uses the device language when nothing is stored', () => {
    expect(resolveLocale(null, 'en')).toBe('en');
    expect(resolveLocale(null, 'de')).toBe('ar');
  });
});

describe('settings store', () => {
  it('persists the locale under the versioned key', async () => {
    useSettingsStore.getState().setLocale('en');
    await new Promise((r) => setTimeout(r, 0));
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as { state: { locale: string }; version: number };
    expect(parsed.state.locale).toBe('en');
    expect(parsed.version).toBe(1);
  });
});
