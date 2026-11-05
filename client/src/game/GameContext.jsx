import { useReducer, useMemo, useCallback, useRef } from 'react';
import { gameReducer, initialState } from './gameReducer';
import { clearKeys } from '../lib/keys';
import { GameStateCtx, GameDispatchCtx, ArenaCredentialsCtx } from './gameHooks';

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
