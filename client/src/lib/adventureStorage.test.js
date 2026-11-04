import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdventure } from '../../../shared/rpg/adventure.js';
import { readAdventure, writeAdventure } from './adventureStorage.js';

test('a storage failure never crashes the game UI or reports a successful save', () => {
  const unavailable = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  const loaded = readAdventure(unavailable);
  assert.equal(loaded.state, null);
  assert.match(loaded.error, /Could not read/);
  assert.equal(writeAdventure(createAdventure(), unavailable), false);
});

test('successful UI persistence returns the validated adventure without an error', () => {
  const entries = new Map(); const storage = { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
  assert.equal(writeAdventure(createAdventure({ trainerName: 'Ivo', starterId: 'duplet' }), storage), true);
  const loaded = readAdventure(storage);
  assert.equal(loaded.state.trainerName, 'Ivo');
  assert.equal(loaded.error, '');
});
