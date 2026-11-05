import { createContext, useContext } from 'react';

export const StageCtx = createContext(null);

export function useStage() {
  const ctx = useContext(StageCtx);
  if (!ctx) throw new Error('useStage outside StageProvider');
  return ctx;
}
