import { useState, useEffect } from 'react';
import { readPreference, writePreference } from './preferences.js';
import { ThemeCtx } from './themeHooks';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => readPreference('aba:theme', 'dark') === 'light' ? 'light' : 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    writePreference('aba:theme', theme);
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }}>
      {children}
    </ThemeCtx.Provider>
  );
}
