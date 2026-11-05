import test from 'node:test';
import assert from 'node:assert/strict';
import { PVP_SESSION_KEY, readPvpSession, writePvpSession, duelShareLink, duelSecondsLeft } from './session.js';
import { readDuelInvite } from '../../lib/duelInvite.js';

test('tab sessions validate shape and survive blocked storage without throwing', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const session = { code: 'ABCD123456', token: 'a'.repeat(43) };
  assert.equal(writePvpSession(storage, session), true);
  assert.deepEqual(readPvpSession(storage), session);
  assert.equal(readPvpSession(storage, 'ABCD123457'), null);
  assert.deepEqual(readPvpSession(storage, session.code), session);
  assert.equal(writePvpSession(storage, null), true);
  assert.equal(readPvpSession(storage), null);
  values.set(PVP_SESSION_KEY, '{');
  assert.equal(readPvpSession(storage), null);
  values.set(PVP_SESSION_KEY, JSON.stringify({ code: '../bad', token: 'a'.repeat(43) }));
  assert.equal(readPvpSession(storage), null);
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(readPvpSession(blocked), null);
  assert.equal(writePvpSession(blocked, session), false);
});

test('shared invites carry only a room code, never credentials or existing query data', () => {
  const link = duelShareLink('https://cogimon.example/play?token=private#old', 'ABCD123456');
  assert.equal(link, 'https://cogimon.example/play#duel=ABCD123456');
});

test('connecting a new room replaces an old invite and keeps its seat after reload', () => {
  const session = { code: 'ABCD123456', token: 'a'.repeat(43) };
  const storage = { getItem: () => JSON.stringify(session) };
  const connectedUrl = duelShareLink('https://cogimon.example/#duel=1234567890', session.code);
  assert.deepEqual(readPvpSession(storage, readDuelInvite(new URL(connectedUrl).hash)), session);
});

test('turn countdown never adds time from a clock tick before the latest room read', () => {
  const room = { serverTime: 1000, receivedAt: 19_000, duel: { deadline: 121_000 } };
  assert.equal(duelSecondsLeft(room, 1000), 120);
  assert.equal(duelSecondsLeft(room, 20_000), 119);
  assert.equal(duelSecondsLeft(room, 140_000), 0);
});
