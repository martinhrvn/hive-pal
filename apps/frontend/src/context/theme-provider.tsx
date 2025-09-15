import { useEffect, useState } from 'react';
import { Theme, ThemeProviderContext } from './theme-context';
import { usePreferences } from '@/api/hooks/useUserPreferences';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const { preferences, updatePreferences } = usePreferences();
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );

  // Update theme when user preferences are loaded
  useEffect(() => {
    if (preferences.data?.theme) {
      setTheme(preferences.data.theme as Theme);
    }
  }, [preferences.data?.theme]);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      // Always update localStorage as fallback
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);

      // If user is logged in and preferences are available, update via API
      if (preferences.data) {
        updatePreferences.mutate({
          ...preferences.data,
          theme: newTheme,
        });
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
