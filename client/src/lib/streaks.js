// Session-local win-streak tracker. Streaks live in localStorage keyed by
// fighter id; a fighter's streak resets when they lose. Each battle is
// recorded once (guarded by a result signature) so remounts/replays don't
// double-count.

const STREAK_KEY = 'arena.streaks';
const SEEN_KEY = 'arena.recordedBattles';

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? {};
  } catch {
    return {};
  }
}

function signature(result) {
  const r = result.rounds ?? [];
  return [
    result.fighters?.a?.id,
    result.fighters?.b?.id,
    result.winnerId,
    r.length,
    result.finalHp?.a,
    result.finalHp?.b,
  ].join('|');
}

/** Record a finished battle. Returns the winner's current streak (0 for draws). */
export function recordBattle(result) {
  const winnerId = result.winnerId;
  const aId = result.fighters?.a?.id;
  const bId = result.fighters?.b?.id;
  if (!aId || !bId) return 0;

  const seen = load(SEEN_KEY);
  const sig = signature(result);
  const streaks = load(STREAK_KEY);

  if (!seen[sig]) {
    if (winnerId) {
      const loserId = winnerId === aId ? bId : aId;
      streaks[winnerId] = (streaks[winnerId] ?? 0) + 1;
      streaks[loserId] = 0;
    }
    seen[sig] = 1;
    // keep the seen list from growing unbounded
    const keys = Object.keys(seen);
    if (keys.length > 50) delete seen[keys[0]];
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    localStorage.setItem(STREAK_KEY, JSON.stringify(streaks));
  }

  return winnerId ? (streaks[winnerId] ?? 0) : 0;
}

/** Current streak for a fighter id. */
export function getStreak(fighterId) {
  return load(STREAK_KEY)[fighterId] ?? 0;
}
