import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeState = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(theme: ThemePreference, prefersDark = systemPrefersDark()) {
  const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  document.documentElement.dataset.theme = resolved;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      // Preserve the pre-rename key so an upgrade does not reset the user's saved theme.
      name: 'agentforge-theme',
      partialize: ({ theme }) => ({ theme }),
      onRehydrateStorage: () => (state) => applyTheme(state?.theme ?? 'system'),
    },
  ),
);
