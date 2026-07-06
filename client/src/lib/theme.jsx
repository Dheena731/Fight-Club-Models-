import { createContext, useContext, useState, useEffect } from 'react';

const ThemeCtx = createContext({ theme: 'dark', toggle: () => {} });

export function useTheme() {
  return useContext(ThemeCtx);
}
export { ThemeCtx };

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('aba:theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aba:theme', theme);
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }}>
      {children}
    </ThemeCtx.Provider>
  );
}
