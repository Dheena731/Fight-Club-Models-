export const PHASE = {
  BOOT: 'BOOT',
  TITLE: 'TITLE',
  WORLD: 'WORLD',
  SELECT: 'SELECT',
  VS: 'VS',
  FIGHT: 'FIGHT',
  RESULT: 'RESULT',
};

export const FIGHT_BEAT = {
  IDLE: 'IDLE',
  CORNER: 'CORNER',
  WINDUP: 'WINDUP',
  EXCHANGE: 'EXCHANGE',
  VERDICT: 'VERDICT',
};

export const initialState = {
  phase: PHASE.BOOT,
  loadout: null, // { fighterAId, fighterBId, mode, rounds, topic, fighters }
  result: null,
  fightBeat: FIGHT_BEAT.IDLE,
  bootError: null,
  arenaReturn: false,
};

export function gameReducer(state, action) {
  switch (action.type) {
    case 'BOOT_DONE':
      return { ...state, phase: PHASE.TITLE, bootError: null };

    case 'ENTER_WORLD':
    case 'RETURN_WORLD':
      return { ...state, phase: PHASE.WORLD, result: null, loadout: null, fightBeat: FIGHT_BEAT.IDLE, arenaReturn: false };

    case 'RETURN_TITLE':
      return { ...state, phase: PHASE.TITLE, result: null, loadout: null, fightBeat: FIGHT_BEAT.IDLE, arenaReturn: false };

    case 'ENTER_ARENA':
      return { ...state, phase: PHASE.SELECT, result: null, loadout: null, fightBeat: FIGHT_BEAT.IDLE, arenaReturn: true };

    case 'BOOT_ERROR':
      return { ...state, bootError: action.error };

    case 'START_FIGHT':
      return {
        ...state,
        phase: PHASE.VS,
        loadout: action.loadout,
        result: null,
        fightBeat: FIGHT_BEAT.IDLE,
      };

    case 'VS_DONE':
      return { ...state, phase: PHASE.FIGHT, fightBeat: FIGHT_BEAT.CORNER };

    case 'SET_FIGHT_BEAT':
      return { ...state, fightBeat: action.beat };

    case 'FIGHT_END':
      return {
        ...state,
        phase: PHASE.RESULT,
        result: action.result,
        fightBeat: FIGHT_BEAT.IDLE,
      };

    case 'SHOW_REPLAY':
      return {
        ...state,
        phase: PHASE.RESULT,
        result: action.result,
        loadout: null,
        fightBeat: FIGHT_BEAT.IDLE,
      };

    case 'REMATCH':
      // Keep loadout, go through VS again
      if (!state.loadout) return { ...state, phase: PHASE.SELECT };
      return {
        ...state,
        phase: PHASE.VS,
        result: null,
        fightBeat: FIGHT_BEAT.IDLE,
      };

    case 'NEW_FIGHTERS':
    case 'EXIT_TO_SELECT':
      return {
        ...state,
        phase: PHASE.SELECT,
        result: null,
        fightBeat: FIGHT_BEAT.IDLE,
        // keep loadout for rematch convenience on SELECT prefill? clear it
        loadout: action.type === 'NEW_FIGHTERS' ? null : state.loadout,
      };

    default:
      return state;
  }
}
