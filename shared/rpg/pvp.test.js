import test from 'node:test';
import assert from 'node:assert/strict';
import { createDuel, submitDuelChoice, expireDuelTurn, PVP_MAX_TURNS } from './pvp.js';

const turn = (duel, a, b) => submitDuelChoice(submitDuelChoice(duel, 0, a), 1, b);

test('choices stay pending until two humans choose, then damage resolves simultaneously', () => {
  const initial = createDuel();
  const pending = submitDuelChoice(initial, 0, 'overcharge');
  assert.deepEqual(pending.players, initial.players);
  assert.equal(initial.choices[0], null);
  const resolved = submitDuelChoice(pending, 1, 'ward');
  assert.deepEqual(resolved.players, [{ hp: 38, energy: 0 }, { hp: 33, energy: 5 }]);
  assert.deepEqual(resolved.history[0].choices, ['overcharge', 'ward']);
  assert.equal(resolved.turn, 2);
});

test('unknown, duplicate, unaffordable and invalid-seat choices cannot alter a duel', () => {
  const initial = createDuel();
  assert.throws(() => submitDuelChoice(initial, 0, 'constructor'), /Choose/);
  assert.throws(() => submitDuelChoice(initial, 2, 'strike'), /seat/);
  const pending = submitDuelChoice(initial, 0, 'strike');
  assert.throws(() => submitDuelChoice(pending, 0, 'ward'), /locked/);
  const spent = turn(initial, 'overcharge', 'ward');
  assert.throws(() => submitDuelChoice(spent, 0, 'overcharge'), /energy/);
  assert.equal(spent.players[0].energy, 0);
});

test('simultaneous knockout draws without a first-player advantage', () => {
  let duel = createDuel();
  for (let i = 0; i < 5; i++) duel = turn(duel, 'strike', 'strike');
  assert.deepEqual(duel.result, { winner: null, reason: 'knockout' });
  assert.deepEqual(duel.players.map(player => player.hp), [0, 0]);
  assert.throws(() => submitDuelChoice(duel, 0, 'strike'), /finished/);
});

test('stalemates finish at the turn limit, compare HP and draw exact ties', () => {
  let duel = createDuel();
  for (let i = 0; i < PVP_MAX_TURNS; i++) duel = turn(duel, 'ward', 'ward');
  assert.equal(duel.turn, PVP_MAX_TURNS);
  assert.equal(duel.history.length, PVP_MAX_TURNS);
  assert.deepEqual(duel.result, { winner: null, reason: 'turn-limit' });
  assert.deepEqual(duel.players.map(player => player.energy), [6, 6]);
  const unequal = turn({ ...createDuel(), turn: PVP_MAX_TURNS }, 'strike', 'ward');
  assert.equal(unequal.result.winner, 1);
});

test('a turn deadline rewards the locked trainer; two idle trainers draw', () => {
  assert.deepEqual(expireDuelTurn(createDuel()).result, { winner: null, reason: 'timeout' });
  const pending = submitDuelChoice(createDuel(), 1, 'ward');
  assert.deepEqual(expireDuelTurn(pending).result, { winner: 1, reason: 'timeout' });
});
