import { PVP_ENERGY, PVP_MOVES } from '../../../../shared/rpg/pvp.js';

export function newPlaybackTurns(previous, next) {
  if (!previous?.duel || !next?.duel || previous.code !== next.code || previous.match !== next.match) return [];
  const oldCount = previous.duel.history.length;
  let energy = previous.players.map(player => player.energy);
  return next.duel.history.slice(oldCount).map((turn, index) => {
    const beforeEnergy = energy;
    energy = turn.choices.map((choice, seat) => {
      const move = PVP_MOVES.find(entry => entry.id === choice);
      return Math.min(PVP_ENERGY, beforeEnergy[seat] - move.cost + move.restore);
    });
    return {
      ...turn,
      before: index === 0 ? previous.players.map(player => player.hp) : next.duel.history[oldCount + index - 1].hp,
      beforeEnergy,
      afterEnergy: energy,
    };
  });
}
