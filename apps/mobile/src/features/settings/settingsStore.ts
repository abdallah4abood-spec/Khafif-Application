import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Locale } from '@/i18n';
import { asyncJsonStorage } from '@/lib/storage';

export const SETTINGS_STORAGE_KEY = 'khafif.settings.v1';

type SettingsState = {
  /** `null` until the user (or the device default) picks one. */
  locale: Locale | null;
  setLocale: (locale: Locale) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: null,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 1,
      storage: asyncJsonStorage,
      partialize: (s) => ({ locale: s.locale }),
    },
  ),
);
