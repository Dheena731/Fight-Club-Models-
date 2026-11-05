import test from 'node:test';
import assert from 'node:assert/strict';
import { createPvpStore } from './pvp.js';
import { PVP_TURN_MS } from '../../shared/rpg/pvp.js';

const host = { trainerName: 'Mara', companionId: 'emberquill', hp: 999, level: 999 };
const guest = { trainerName: 'Ivo', companionId: 'duplet' };
function pair(options) {
  const store = createPvpStore(options);
  const a = store.create(host);
  const b = store.join(a.room.code, guest);
  return { store, a, b, code: a.room.code };
}
function act(game, player, type, extra = {}) {
  const room = game.store.read(game.code, player.token);
  return game.store.command(game.code, player.token, { version: room.version, type, ...extra });
}

test('two slots normalize stats and never publish passes or opponent choices', () => {
  const game = pair();
  const { store, a, b, code } = game;
  assert.match(code, /^[A-F0-9]{10}$/);
  assert.notEqual(a.token, b.token);
  assert.equal(b.room.players[0].hp, 40);
  assert.equal(b.room.players[1].hp, 40);
  assert.equal(b.room.players[0].energy, 3);
  assert.throws(() => store.join(code, guest), /two trainers/);
  act(game, a, 'choice', { moveId: 'overcharge' });
  const publicB = store.read(code, b.token);
  assert.equal(publicB.players[0].ready, true);
  assert.equal(publicB.duel.myChoice, null);
  assert.equal(publicB.duel.history.length, 0);
  const serialized = JSON.stringify(publicB);
  assert.ok(!serialized.includes(a.token) && !serialized.includes(b.token));
  assert.ok(!serialized.includes('overcharge'));
  assert.equal(store.read(code, a.token).duel.myChoice, 'overcharge');
  const resolved = act(game, b, 'choice', { moveId: 'ward' });
  assert.deepEqual(resolved.duel.history[0].choices, ['overcharge', 'ward']);
});

test('unauthorized, stale and duplicate commands fail without changing state', () => {
  const game = pair();
  const { store, code, a, b } = game;
  assert.throws(() => store.read(code), /pass/);
  assert.throws(() => store.read(code, 'é'.repeat(43)), /pass/);
  assert.throws(() => store.command(code, 'A'.repeat(43), { version: b.room.version, type: 'leave' }), /pass/);
  assert.throws(() => store.command(code, a.token, { version: a.room.version, type: 'choice', moveId: 'strike' }), /changed/);
  const locked = act(game, a, 'choice', { moveId: 'strike', seat: 1 });
  assert.equal(locked.players[0].ready, true);
  assert.equal(locked.players[1].ready, false);
  assert.throws(() => act(game, a, 'choice', { moveId: 'ward' }), /locked/);
  assert.throws(() => act(game, b, 'choice', { moveId: 'toString' }), /Choose/);
  assert.equal(store.read(code, b.token).version, locked.version);
});

test('forfeit finishes a duel, leaving prevents rematch and reconnect remains readable', () => {
  const game = pair();
  const result = act(game, game.a, 'leave');
  assert.deepEqual(result.duel.result, { winner: 1, reason: 'forfeit' });
  assert.equal(result.players[0].left, true);
  assert.throws(() => act(game, game.b, 'rematch'), /left/);
  assert.throws(() => act(game, game.a, 'choice', { moveId: 'strike' }), /left/);
  assert.equal(game.store.read(game.code, game.a.token).players[0].left, true);
  const lonely = game.store.create(host);
  game.store.command(lonely.room.code, lonely.token, { version: 1, type: 'leave' });
  assert.throws(() => game.store.join(lonely.room.code, guest), /host left/);
});

test('only mutual consent starts a rematch and resets stats, choices and history', () => {
  let time = 0;
  const game = pair({ now: () => time });
  act(game, game.a, 'choice', { moveId: 'overcharge' });
  time = PVP_TURN_MS;
  const ended = game.store.read(game.code, game.b.token);
  assert.deepEqual(ended.duel.result, { winner: 0, reason: 'timeout' });
  const requested = act(game, game.a, 'rematch');
  assert.equal(requested.status, 'finished');
  assert.deepEqual(requested.players.map(player => player.rematch), [true, false]);
  assert.throws(() => act(game, game.a, 'rematch'), /already/);
  const restarted = act(game, game.b, 'rematch');
  assert.equal(restarted.status, 'active');
  assert.equal(restarted.match, 2);
  assert.equal(restarted.duel.turn, 1);
  assert.deepEqual(restarted.duel.history, []);
  assert.deepEqual(restarted.players.map(player => [player.hp, player.energy, player.rematch, player.ready]), [[40, 3, false, false], [40, 3, false, false]]);
  assert.equal(restarted.duel.deadline, time + PVP_TURN_MS);
});

test('reads cannot hold rooms open, room capacity recovers and absolute lifetime is bounded', () => {
  let time = 0;
  const store = createPvpStore({ now: () => time, maxRooms: 1, idleMs: 100, lifeMs: 150 });
  const a = store.create(host);
  assert.throws(() => store.create(host), /full/);
  time = 99;
  store.read(a.room.code, a.token);
  time = 100;
  assert.throws(() => store.read(a.room.code, a.token), /expired/);
  const next = store.create(host);
  time = 190;
  const joined = store.join(next.room.code, guest);
  time = 249;
  assert.equal(store.read(next.room.code, joined.token).status, 'active');
  time = 250;
  assert.throws(() => store.read(next.room.code, joined.token), /expired/);
});

test('identity and code validation reject malformed input without storing client extras', () => {
  const store = createPvpStore();
  for (const input of [null, {}, { ...host, trainerName: '' }, { ...host, trainerName: 'x'.repeat(25) }, { ...host, trainerName: 'Mara\nIvo' }, { ...host, companionId: '__proto__' }]) {
    assert.throws(() => store.create(input), /trainer name|Choose/);
  }
  assert.throws(() => store.join('../rooms', guest), /Invite codes/);
  const created = store.create(host);
  assert.equal(created.room.players[0].level, undefined);
});
