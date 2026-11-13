import test from 'node:test';
import assert from 'node:assert/strict';
import { newPlaybackTurns } from './playback.js';
const room = (history = [], match = 1) => ({ code: 'ROOM', match, players: [{ hp: 40, energy: 3 }, { hp: 38, energy: 4 }], duel: { history } });
const turns = [
  { turn: 1, choices: ['overcharge', 'ward'], damage: [0, 7], hp: [40, 31] },
  { turn: 2, choices: ['strike', 'overcharge'], damage: [17, 8], hp: [23, 23] },
];
test('queues skipped updates in order with the prior HP and energy for each turn', () => {
  const queued = newPlaybackTurns(room(), room(turns));
  assert.deepEqual(queued.map(turn => turn.before), [[40, 38], [40, 31]]);
  assert.deepEqual(queued.map(turn => turn.beforeEnergy), [[3, 4], [0, 6]]);
  assert.deepEqual(queued.map(turn => turn.afterEnergy), [[0, 6], [1, 3]]);
});
test('does not replay repeated polls, reconnects, new matches, or a timeout without a turn', () => {
  assert.deepEqual(newPlaybackTurns(room(turns), room(turns)), []);
  assert.deepEqual(newPlaybackTurns(null, room(turns)), []);
  assert.deepEqual(newPlaybackTurns(room(), room(turns, 2)), []);
  assert.deepEqual(newPlaybackTurns(room(turns), { ...room(turns), status: 'finished', duel: { history: turns, result: { reason: 'timeout' } } }), []);
});
test('keeps authoritative HP for a knockout and a double knockout', () => {
  const ko = { turn: 3, choices: ['strike', 'strike'], damage: [8, 8], hp: [15, 0] };
  const double = { ...ko, hp: [0, 0] };
  assert.deepEqual(newPlaybackTurns(room(turns), room([...turns, ko]))[0].hp, [15, 0]);
  assert.deepEqual(newPlaybackTurns(room(turns), room([...turns, double]))[0].hp, [0, 0]);
});
