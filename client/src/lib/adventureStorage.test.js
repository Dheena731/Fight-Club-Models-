import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdventure } from '../../../shared/rpg/adventure.js';
import { readAdventure, retryGameSave, writeAdventure } from './adventureStorage.js';
import { createProfile } from '../../../shared/rpg/profile.js';
import { ADVENTURE_SAVE_KEY, CIRCUIT_SAVE_KEY, loadCircuitRecord } from '../../../shared/rpg/adventureSave.js';

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

test('Circuit retry recovers the separate record after quota failure without replacing Journey', () => {
  const entries = new Map(); let failCircuit = true;
  const storage = { getItem: key => entries.get(key) ?? null, setItem(key, value) { if (key === CIRCUIT_SAVE_KEY && failCircuit) throw new Error('quota'); entries.set(key, value); } };
  const journey = createAdventure({ trainerName: 'Protected' });
  assert.equal(writeAdventure(journey, storage), true);
  const untouched = storage.getItem(ADVENTURE_SAVE_KEY);
  const circuit = { mode: 'circuit', circuit: { bestWins: 3 } };
  assert.equal(retryGameSave(circuit, createProfile(), storage), false);
  failCircuit = false;
  assert.equal(retryGameSave(circuit, createProfile(), storage), true);
  assert.equal(loadCircuitRecord(storage).bestWins, 3);
  assert.equal(storage.getItem(ADVENTURE_SAVE_KEY), untouched);
});
