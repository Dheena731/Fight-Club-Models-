import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdventure } from '../../../shared/rpg/adventure.js';
import { journeyStorageIdentity, readAdventure, retryGameSave, writeGameProfile, writeAdventure } from './adventureStorage.js';
import { PROFILE_SAVE_KEY, createProfile, equipCosmetic, saveProfile } from '../../../shared/rpg/profile.js';
import { ADVENTURE_SAVE_KEY, CIRCUIT_SAVE_KEY, LEGACY_SAVE_KEYS, loadCircuitRecord } from '../../../shared/rpg/adventureSave.js';
import { createSaveBackup, prepareSaveRestore, restoreSaveBackup } from '../../../shared/rpg/saveBackup.js';

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

function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}

test('restore rejects old-tab manual equipment changes and retry writes without changing the restored Locker', () => {
  const store = memoryStorage(); const oldJourney = createAdventure();
  writeAdventure(oldJourney, store);
  const oldProfile = createProfile({ ownedIds: ['badge-static-clear'] });
  saveProfile(oldProfile, store);
  const oldIdentity = journeyStorageIdentity(store);
  const text = JSON.stringify(createSaveBackup(store, { profile: createProfile({ trainerName: 'Restored' }) }));
  restoreSaveBackup(prepareSaveRestore(text, store), store);
  const original = store.getItem(PROFILE_SAVE_KEY);
  const changed = equipCosmetic(oldProfile, 'badge-static-clear');
  assert.equal(writeGameProfile(changed, oldIdentity, store), false);
  assert.equal(retryGameSave(oldJourney, changed, store, oldIdentity), false);
  assert.equal(store.getItem(PROFILE_SAVE_KEY), original);
});

test('title Practice without a nested Journey cannot overwrite a later restored Locker', () => {
  const store = memoryStorage(); const identity = journeyStorageIdentity(store);
  assert.equal(writeGameProfile(createProfile(), identity, store), true);
  const source = memoryStorage(); writeAdventure(createAdventure({ trainerName: 'New' }), source);
  restoreSaveBackup(prepareSaveRestore(JSON.stringify(createSaveBackup(source)), store), store);
  const original = store.getItem(PROFILE_SAVE_KEY);
  assert.equal(writeGameProfile(createProfile({ trainerName: 'Stale' }), identity, store), false);
  assert.equal(retryGameSave(createAdventure({ mode: 'practice' }), createProfile(), store, identity), false);
  assert.equal(store.getItem(PROFILE_SAVE_KEY), original);
});

test('current Journey equipment writes remain allowed after ordinary movement autosaves', () => {
  const store = memoryStorage(); const state = createAdventure(); writeAdventure(state, store);
  const identity = journeyStorageIdentity(store);
  writeAdventure({ ...state, facing: 'left' }, store);
  assert.equal(writeGameProfile(createProfile({ trainerName: 'Current' }), identity, store), true);
  assert.equal(JSON.parse(store.getItem(PROFILE_SAVE_KEY)).trainerName, 'Current');
});

test('legacy-only identity is stable until any relevant original record changes', () => {
  const store = memoryStorage(); store.setItem(LEGACY_SAVE_KEYS[0], 'original legacy');
  const identity = journeyStorageIdentity(store);
  assert.equal(writeGameProfile(createProfile(), identity, store), true);
  store.setItem(LEGACY_SAVE_KEYS[0], 'changed legacy');
  assert.equal(writeGameProfile(createProfile(), identity, store), false);
});

test('unreadable or invalid Journey storage cannot authorize Locker writes', () => {
  const store = memoryStorage(); store.setItem(ADVENTURE_SAVE_KEY, '{invalid');
  assert.equal(journeyStorageIdentity(store), null);
  assert.equal(writeGameProfile(createProfile(), null, store), false);
  assert.equal(journeyStorageIdentity({ getItem() { throw new Error('denied'); } }), null);
});
