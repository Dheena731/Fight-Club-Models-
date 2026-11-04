import test from 'node:test';
import assert from 'node:assert/strict';
import { readPreference, writePreference } from './preferences.js';

test('noncritical appearance and audio preferences work when storage is available', () => {
  const values = new Map(); const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(readPreference('theme', 'dark', storage), 'dark');
  assert.equal(writePreference('theme', 'light', storage), true);
  assert.equal(readPreference('theme', 'dark', storage), 'light');
});

test('blocked reads and quota failures cannot crash boot or preference changes', () => {
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.equal(readPreference('theme', 'dark', storage), 'dark');
  assert.equal(readPreference('muted', 'on', storage), 'on');
  assert.equal(writePreference('muted', 'off', storage), false);
});
