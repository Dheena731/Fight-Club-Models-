import { createContext, useContext } from 'react';

export const GameStateCtx = createContext(null);
export const GameDispatchCtx = createContext(null);
export const ArenaCredentialsCtx = createContext(null);

export function useGameState() {
  const ctx = useContext(GameStateCtx);
  if (!ctx) throw new Error('useGameState outside GameProvider');
  return ctx;
}

export function useGameDispatch() {
  const ctx = useContext(GameDispatchCtx);
  if (!ctx) throw new Error('useGameDispatch outside GameProvider');
  return ctx;
}

export function useArenaCredentials() {
  const ctx = useContext(ArenaCredentialsCtx);
  if (!ctx) throw new Error('useArenaCredentials outside GameProvider');
  return ctx;
}
