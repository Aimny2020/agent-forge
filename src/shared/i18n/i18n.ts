import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from './resources';

export const supportedLocales = ['zh-CN', 'en'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
export type LanguagePreference = 'system' | SupportedLocale;

export function resolveSystemLocale(languages = typeof navigator === 'undefined' ? [] : navigator.languages): SupportedLocale {
  return languages.some((language) => language.toLowerCase().startsWith('zh')) ? 'zh-CN' : 'en';
}

export function resolveLocale(preference: LanguagePreference): SupportedLocale {
  return preference === 'system' ? resolveSystemLocale() : preference;
}

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: resolveSystemLocale(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
