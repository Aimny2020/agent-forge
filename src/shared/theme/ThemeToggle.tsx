import { MoonStar } from 'lucide-react';

import { useThemeStore, type ThemePreference } from './themeStore';

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <label className="theme-control">
      <MoonStar aria-hidden="true" size={16} />
      <span className="sr-only">外观主题</span>
      <select
        aria-label="外观主题"
        value={theme}
        onChange={(event) => setTheme(event.target.value as ThemePreference)}
      >
        <option value="system">跟随系统</option>
        <option value="light">亮色</option>
        <option value="dark">暗色</option>
      </select>
    </label>
  );
}
