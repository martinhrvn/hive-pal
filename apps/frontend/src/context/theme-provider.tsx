import { useEffect, useState } from 'react';
import { Theme, ThemeProviderContext } from './theme-context';
import { usePreferences } from '@/api/hooks/useUserPreferences';
import { useAuth } from '@/context/auth-context';

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
  const { isLoggedIn, isLoading } = useAuth();
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

    // The public/marketing surface (landing, tools, releases, …) is designed
    // light-only. Once the session check has resolved and the visitor is logged
    // out, force light regardless of the stored preference — without mutating
    // `theme`, so a returning user's dark choice is restored after they sign in.
    if (!isLoading && !isLoggedIn) {
      root.classList.add('light');
      return;
    }

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme, isLoggedIn, isLoading]);

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
