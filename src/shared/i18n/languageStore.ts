import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import i18n, { type LanguagePreference, resolveLocale } from './i18n';

type LanguageState = {
  language: LanguagePreference;
  setLanguage: (language: LanguagePreference) => void;
};

export function applyLanguage(language: LanguagePreference) {
  const locale = resolveLocale(language);
  void i18n.changeLanguage(locale);
  document.documentElement.lang = locale;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'system',
      setLanguage: (language) => {
        applyLanguage(language);
        set({ language });
      },
    }),
    {
      name: 'agentpalette-language',
      partialize: ({ language }) => ({ language }),
      onRehydrateStorage: () => (state) => applyLanguage(state?.language ?? 'system'),
    },
  ),
);
