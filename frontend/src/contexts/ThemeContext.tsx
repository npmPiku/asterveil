import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'night';

type ThemeContextValue = {
  theme: Theme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  return 'night';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('asterveil-theme', theme);
  }, [theme]);

  const value = useMemo(() => ({ theme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
