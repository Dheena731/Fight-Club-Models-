export const PVP_COMPANIONS = [
  { id: 'emberquill', name: 'Emberquill' },
  { id: 'kitewhisk', name: 'Kitewhisk' },
  { id: 'duplet', name: 'Duplet' },
];

export const PVP_MOVES = [
  { id: 'strike', name: 'Signal Strike', cost: 0, damage: 8, guard: 0, restore: 1, description: 'Deal 8 damage. Recover 1 energy.' },
  { id: 'ward', name: 'Ward', cost: 0, damage: 2, guard: 10, restore: 2, description: 'Block 10 incoming damage and deal 2. Recover 2 energy.' },
  { id: 'overcharge', name: 'Overcharge', cost: 3, damage: 17, guard: 0, restore: 0, description: 'Spend 3 energy to deal 17 damage.' },
];

export const PVP_HP = 40;
export const PVP_ENERGY = 6;
export const PVP_MAX_TURNS = 20;
export const PVP_TURN_MS = 120_000;

export function createDuel() {
  return { turn: 1, players: [0, 1].map(() => ({ hp: PVP_HP, energy: 3 })), choices: [null, null], history: [], result: null };
}

export function submitDuelChoice(duel, seat, moveId) {
  if (duel.result) throw new Error('This duel has finished. Request a rematch to play again.');
  if (seat !== 0 && seat !== 1) throw new Error('Invalid trainer seat.');
  if (duel.choices[seat]) throw new Error('Your choice is already locked for this turn.');
  const move = PVP_MOVES.find(entry => entry.id === moveId);
  if (!move) throw new Error('Choose Signal Strike, Ward or Overcharge.');
  if (duel.players[seat].energy < move.cost) throw new Error('Not enough energy. Choose Strike or Ward to recover it.');
  const choices = [...duel.choices];
  choices[seat] = moveId;
  if (choices.includes(null)) return { ...duel, choices };
  const moves = choices.map(id => PVP_MOVES.find(entry => entry.id === id));
  const damage = moves.map((entry, index) => Math.max(0, moves[1 - index].damage - entry.guard));
  const players = duel.players.map((player, index) => ({
    hp: Math.max(0, player.hp - damage[index]),
    energy: Math.min(PVP_ENERGY, player.energy - moves[index].cost + moves[index].restore),
  }));
  const knockedOut = players.some(player => player.hp === 0);
  const ended = knockedOut || duel.turn === PVP_MAX_TURNS;
  const result = ended ? {
    winner: players[0].hp === players[1].hp ? null : players[0].hp > players[1].hp ? 0 : 1,
    reason: knockedOut ? 'knockout' : 'turn-limit',
  } : null;
  return {
    turn: ended ? duel.turn : duel.turn + 1,
    players, choices: [null, null], result,
    history: [...duel.history, { turn: duel.turn, choices, damage, hp: players.map(player => player.hp) }],
  };
}

export function expireDuelTurn(duel) {
  if (duel.result) return duel;
  const ready = duel.choices.map(Boolean);
  return { ...duel, choices: [null, null], result: { winner: ready[0] === ready[1] ? null : ready[0] ? 0 : 1, reason: 'timeout' } };
}
