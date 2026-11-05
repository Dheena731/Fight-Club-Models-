import { createContext, useContext } from 'react';

export const ThemeCtx = createContext({ theme: 'dark', toggle: () => {} });

export function useTheme() {
  return useContext(ThemeCtx);
}
