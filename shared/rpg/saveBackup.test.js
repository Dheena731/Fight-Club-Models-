import test from 'node:test';
import assert from 'node:assert/strict';
import { adventureReducer, createAdventure } from './adventure.js';
import { ADVENTURE_REGIONS } from './adventureContent.js';
import { ADVENTURE_SAVE_KEY, CIRCUIT_SAVE_KEY, LEGACY_SAVE_KEYS, loadAdventure, saveAdventure, toAdventureSave } from './adventureSave.js';
import { PROFILE_SAVE_KEY, createProfile, loadProfile, saveProfile } from './profile.js';
import { createGame, toSave } from './worldState.js';
import { BACKUP_FORMAT, MAX_BACKUP_BYTES, createSaveBackup, prepareSaveRestore, restoreSaveBackup } from './saveBackup.js';

function storage(entries = {}) {
  const data = new Map(Object.entries(entries));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}
function source() {
  const store = storage();
  const state = createAdventure({ trainerName: 'Mira', starterId: 'kitewhisk' });
  saveAdventure(state, store);
  saveProfile(createProfile({ trainerName: 'Mira', companionId: 'kitewhisk', ownedIds: ['badge-static-clear', 'title-lantern-keeper'], loadout: { titleId: 'title-lantern-keeper', badgeIds: ['badge-static-clear'] } }), store);
  store.setItem(CIRCUIT_SAVE_KEY, JSON.stringify({ version: 1, bestWins: 2 }));
  return { store, state, text: JSON.stringify(createSaveBackup(store)) };
}

test('backup round trip restores Journey and local Locker, keeps the better Circuit record and rotates run identity', () => {
  const { text, state } = source();
  const destination = storage({ unrelated: 'keep', [CIRCUIT_SAVE_KEY]: JSON.stringify({ version: 1, bestWins: 3 }) });
  const restored = restoreSaveBackup(prepareSaveRestore(text, destination), destination);
  assert.equal(restored.trainerName, 'Mira');
  assert.equal(restored.activeId, 'kitewhisk');
  assert.notEqual(restored.runId, state.runId);
  assert.deepEqual(toAdventureSave(loadAdventure(destination)), toAdventureSave(restored));
  assert.deepEqual(loadProfile(destination).loadout.badgeIds, ['badge-static-clear']);
  assert.equal(loadProfile(destination).loadout.titleId, 'title-lantern-keeper');
  assert.equal(loadProfile(destination).verification, 'local');
  assert.equal(JSON.parse(destination.getItem(CIRCUIT_SAVE_KEY)).bestWins, 3);
  assert.equal(destination.getItem('unrelated'), 'keep');
  assert.throws(() => saveAdventure(state, destination), { code: 'STALE_JOURNEY' });
});

test('creating and previewing a backup never writes, including when the player cancels', () => {
  const { store, text } = source();
  const original = [...store.data];
  store.setItem = () => assert.fail('preview/export must not write');
  createSaveBackup(store);
  prepareSaveRestore(text, store);
  assert.deepEqual([...store.data], original);
});

test('an exported Journey encounter resumes the same deterministic next turn without adding XP', () => {
  const { store, state } = source();
  const object = ADVENTURE_REGIONS.grove.objects.find(entry => entry.encounterId === 'static-wisp');
  const field = { ...state, locationId: 'grove', discoveries: ['frontier', 'grove'], x: object.x - 1, y: object.y, facing: 'right', flags: { ...state.flags, questStarted: true, shardFound: true }, inventory: { ...state.inventory, 'signal-shard': 1 } };
  const battle = adventureReducer(field, { type: 'INTERACT' });
  assert.ok(battle.battle);
  const text = JSON.stringify(createSaveBackup(store, { journey: battle }));
  const destination = storage();
  const restored = restoreSaveBackup(prepareSaveRestore(text, destination), destination);
  assert.deepEqual(restored.team, battle.team);
  const action = { type: 'BATTLE_MOVE', moveId: battle.team[0].moves[0] };
  const expected = toAdventureSave(adventureReducer(battle, action));
  const actual = toAdventureSave(adventureReducer(restored, action));
  assert.deepEqual({ ...actual, runId: expected.runId }, expected);
});

test('backup projections exclude provider credentials, transcripts, arbitrary keys and verified claims at every boundary', () => {
  const { store, state } = source();
  store.setItem('provider-key', 'secret-marker');
  const profile = { ...loadProfile(store), apiKey: 'secret-marker', verification: 'verified', loadout: { ...loadProfile(store).loadout, secret: 'secret-marker' } };
  state.apiKey = 'secret-marker'; state.message = 'secret-marker'; state.team[0].provider = 'secret-marker';
  const backup = createSaveBackup(store, { journey: state, profile });
  assert.equal(JSON.stringify(backup).includes('secret-marker'), false);
  backup.secret = 'secret-marker'; backup.journey.apiKey = 'secret-marker'; backup.profile.endpoint = 'secret-marker';
  backup.profile.ownedIds.push('unknown'); backup.profile.loadout.badgeIds.push('unknown'); backup.profile.verification = 'verified';
  const normalized = prepareSaveRestore(JSON.stringify(backup), store).backup;
  assert.equal(JSON.stringify(normalized).includes('secret-marker'), false);
  assert.equal(normalized.profile.verification, 'local');
  assert.equal(normalized.profile.ownedIds.includes('unknown'), false);
  assert.equal(normalized.profile.loadout.badgeIds.includes('unknown'), false);
});

for (const type of ['START_PRACTICE', 'START_CIRCUIT']) {
  test(`${type} backs up only its protected Journey, never its disposable battle`, () => {
    const { store, state } = source();
    const mode = adventureReducer(state, { type });
    const backup = createSaveBackup(store, { journey: mode });
    assert.equal(backup.journey.mode, 'journey');
    assert.deepEqual(backup.journey, toAdventureSave(state));
    assert.equal(backup.journey.battle, null);
  });
}

test('title Practice without a nested Journey backs up the saved Journey and cannot create an empty backup', () => {
  const { store, state } = source();
  const backup = createSaveBackup(store, { journey: createAdventure({ mode: 'practice' }), profile: createProfile({ trainerName: 'Stale tab' }) });
  assert.deepEqual(backup.journey, toAdventureSave(state));
  assert.deepEqual(backup.profile, loadProfile(store), 'a storage-fallback Journey must use its stored Locker, not the old Practice tab identity');
  assert.throws(() => createSaveBackup(storage()), /No saved Journey/);
});

test('Journey-only restores do not write Locker, Circuit or legacy records', () => {
  const { store } = source();
  const backup = createSaveBackup(store, { scope: 'journey' });
  assert.equal(backup.profile, null); assert.equal(backup.circuit, null);
  const destination = storage({ [PROFILE_SAVE_KEY]: 'original locker', [CIRCUIT_SAVE_KEY]: 'original circuit', [LEGACY_SAVE_KEYS[0]]: 'original legacy' });
  restoreSaveBackup(prepareSaveRestore(JSON.stringify(backup), destination), destination);
  assert.equal(destination.getItem(PROFILE_SAVE_KEY), 'original locker');
  assert.equal(destination.getItem(CIRCUIT_SAVE_KEY), 'original circuit');
  assert.equal(destination.getItem(LEGACY_SAVE_KEYS[0]), 'original legacy');
});

for (const version of [1, 2]) {
  test(`backup envelope migrates legacy v${version} Journey without changing the original legacy keys`, () => {
    const legacy = { ...toSave(createGame('serpent')), version };
    const store = storage({ [LEGACY_SAVE_KEYS[version === 1 ? 1 : 0]]: JSON.stringify(legacy) });
    const original = [...store.data];
    const text = JSON.stringify({ format: BACKUP_FORMAT, version: 1, scope: 'journey', journey: legacy });
    const restored = restoreSaveBackup(prepareSaveRestore(text, store), store);
    assert.equal(restored.activeId, 'duplet');
    assert.equal(restored.legacy.version, version);
    for (const [key, value] of original) assert.equal(store.getItem(key), value);
  });
}

test('invalid, oversized, unsupported and damaged files fail before any write', () => {
  const { store, text } = source(); const original = [...store.data];
  const change = modify => { const value = JSON.parse(text); modify(value); return JSON.stringify(value); };
  const invalid = ['{oops', 'null', '[]', '{}', ' '.repeat(MAX_BACKUP_BYTES + 1), JSON.stringify('🦊'.repeat(MAX_BACKUP_BYTES / 4)),
    change(v => { v.version = 99; }), change(v => { v.format = 'other'; }), change(v => { v.scope = 'unknown'; }),
    change(v => { v.journey.team = []; }), change(v => { v.journey = toAdventureSave(createAdventure({ mode: 'practice' })); }),
    change(v => { v.profile = null; }), change(v => { v.profile.version = 99; }), change(v => { v.circuit.bestWins = 4; })];
  for (const input of invalid) assert.throws(() => prepareSaveRestore(input, store));
  assert.deepEqual([...store.data], original);
});

test('changes to any protected save after preview require a new preview, even within the same run', () => {
  const { text } = source();
  for (const key of [ADVENTURE_SAVE_KEY, PROFILE_SAVE_KEY, CIRCUIT_SAVE_KEY, ...LEGACY_SAVE_KEYS]) {
    const destination = storage(); const prepared = prepareSaveRestore(text, destination);
    destination.setItem(key, 'changed after preview');
    assert.throws(() => restoreSaveBackup(prepared, destination), /changed after this preview/);
    assert.equal(destination.getItem(key), 'changed after preview');
    assert.equal(destination.data.size, 1);
  }
});

test('corrupt current records can be replaced explicitly and reusing a confirmed preview cannot restore twice', () => {
  const { text } = source(); const store = storage({ [ADVENTURE_SAVE_KEY]: '{corrupt' });
  const prepared = prepareSaveRestore(text, store);
  restoreSaveBackup(prepared, store);
  assert.equal(loadAdventure(store).trainerName, 'Mira');
  assert.throws(() => restoreSaveBackup(prepared, store), /changed after this preview/);
});

for (const failedKey of [ADVENTURE_SAVE_KEY, PROFILE_SAVE_KEY, CIRCUIT_SAVE_KEY]) {
  test(`a quota failure at ${failedKey} recovers all previous bytes`, () => {
    const { text } = source(); const destination = source().store; const before = [...destination.data];
    const prepared = prepareSaveRestore(text, destination); const originalSet = destination.setItem;
    destination.setItem = (key, value) => { if (key === failedKey) throw new Error('quota'); originalSet(key, value); };
    assert.throws(() => restoreSaveBackup(prepared, destination), /previous records were recovered/);
    assert.deepEqual([...destination.data], before);
  });
}

test('write verification catches silent storage drops and removes newly-created partial records on rollback', () => {
  const { text } = source(); const store = storage(); const set = store.setItem;
  store.setItem = (key, value) => { if (key !== PROFILE_SAVE_KEY) set(key, value); };
  assert.throws(() => restoreSaveBackup(prepareSaveRestore(text, store), store), /previous records were recovered/);
  assert.deepEqual([...store.data], []);
});

test('unrecoverable rollback has a distinct warning, never a false success or false preservation claim', () => {
  const { text } = source(); const store = storage(); const set = store.setItem;
  store.setItem = (key, value) => { if (key === PROFILE_SAVE_KEY) throw new Error('quota'); set(key, value); };
  store.removeItem = () => { throw new Error('blocked rollback'); };
  assert.throws(() => restoreSaveBackup(prepareSaveRestore(text, store), store), /some previous records could not be recovered/);
});

test('blocked storage access and unavailable writes are surfaced without deleting originals', () => {
  const { text } = source(); const denied = { getItem() { throw new Error('blocked'); } };
  assert.throws(() => prepareSaveRestore(text, denied), /could not be read/);
  assert.throws(() => prepareSaveRestore(text, null), /storage is unavailable/);
  const readOnly = { getItem() { return null; } };
  assert.throws(() => restoreSaveBackup(prepareSaveRestore(text, readOnly), readOnly), /previous records were recovered/);
});
