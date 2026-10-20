import { createContext, useContext, useReducer, useMemo, useCallback, useRef } from 'react';
import { gameReducer, initialState, PHASE, FIGHT_BEAT } from './gameReducer';
import { clearKeys } from '../lib/keys';

const GameStateCtx = createContext(null);
const GameDispatchCtx = createContext(null);
const ArenaCredentialsCtx = createContext(null);

export function GameProvider({ children }) {
  const [state, reduce] = useReducer(gameReducer, initialState);
  const credentialsRef = useRef({ a: '', b: '' });
  const dispatch = useCallback((action) => {
    if (action.type === 'START_FIGHT') {
      const a = action.loadout?.fighterAId;
      const b = action.loadout?.fighterBId;
      credentialsRef.current = { a: a?.apiKey || '', b: b?.apiKey || '' };
      reduce({ ...action, loadout: {
        ...action.loadout,
        fighterAId: a ? { ...a, apiKey: undefined } : a,
        fighterBId: b ? { ...b, apiKey: undefined } : b,
      } });
      return;
    }
    if (['ENTER_WORLD', 'RETURN_WORLD', 'RETURN_TITLE'].includes(action.type)) {
      credentialsRef.current = { a: '', b: '' };
      clearKeys();
      if (window.location.hash.startsWith('#r=')) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    reduce(action);
  }, []);
  const withArenaCredentials = useCallback((loadout) => loadout ? ({
    ...loadout,
    fighterAId: loadout.fighterAId ? { ...loadout.fighterAId, apiKey: credentialsRef.current.a } : null,
    fighterBId: loadout.fighterBId ? { ...loadout.fighterBId, apiKey: credentialsRef.current.b } : null,
  }) : null, []);
  const value = useMemo(() => state, [state]);
  return (
    <GameDispatchCtx.Provider value={dispatch}>
      <GameStateCtx.Provider value={value}>
        <ArenaCredentialsCtx.Provider value={withArenaCredentials}>{children}</ArenaCredentialsCtx.Provider>
      </GameStateCtx.Provider>
    </GameDispatchCtx.Provider>
  );
}

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

export { PHASE, FIGHT_BEAT };
