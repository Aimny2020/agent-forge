import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type PropsWithChildren } from 'react';

import { applyTheme, useThemeStore } from '../../shared/theme/themeStore';
import { applyLanguage, useLanguageStore } from '../../shared/i18n/languageStore';

function ThemeSync() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system' || typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = (event: MediaQueryListEvent) => applyTheme('system', event.matches);
    media.addEventListener('change', syncSystemTheme);
    return () => media.removeEventListener('change', syncSystemTheme);
  }, [theme]);

  return null;
}

function LanguageSync() {
  const language = useLanguageStore((state) => state.language);

  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <LanguageSync />
      {children}
    </QueryClientProvider>
  );
}
