import { MoonStar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useThemeStore, type ThemePreference } from './themeStore';

export function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <label className="theme-control">
      <MoonStar aria-hidden="true" size={16} />
      <span className="sr-only">{t('theme.label')}</span>
      <select
        aria-label={t('theme.label')}
        value={theme}
        onChange={(event) => setTheme(event.target.value as ThemePreference)}
      >
        <option value="system">{t('theme.system')}</option>
        <option value="light">{t('theme.light')}</option>
        <option value="dark">{t('theme.dark')}</option>
      </select>
    </label>
  );
}
