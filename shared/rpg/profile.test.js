import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COSMETICS, PROFILE_COMPANIONS, PROFILE_SAVE_KEY, createProfile, loadProfile, saveProfile,
  syncAdventureProfile, equipCosmetic, profileSnapshot, getCosmetic,
} from './profile.js';

const rewards = COSMETICS.map((item) => item.id);
const earned = (companionId = 'emberquill') => syncAdventureProfile(createProfile({ companionId }), {
  trainerName: 'Mara', companionId, level: 7, worldsCleared: 1, rewardIds: rewards,
});
const memoryStorage = (initial = null) => {
  let raw = initial;
  return {
    getItem(key) { assert.equal(key, PROFILE_SAVE_KEY); return raw; },
    setItem(key, value) { assert.equal(key, PROFILE_SAVE_KEY); raw = value; },
  };
};

test('the catalog has the five fixed rewards and immutable, unique IDs', () => {
  assert.deepEqual(rewards, ['skin-lantern', 'badge-lantern-signal', 'badge-static-clear', 'badge-archive-warden', 'title-lantern-keeper']);
  assert.equal(new Set(rewards).size, rewards.length);
  assert.ok(Object.isFrozen(COSMETICS));
  for (const item of COSMETICS) {
    assert.ok(Object.isFrozen(item));
    assert.ok(item.unlockHint && item.description);
    assert.strictEqual(getCosmetic(item.id), item);
  }
  for (const id of ['__proto__', 'constructor', 'unknown', null, {}, 1]) assert.equal(getCosmetic(id), null);
});

test('defaults are deterministic, local and usable without a save', () => {
  assert.deepEqual(createProfile(), createProfile(null));
  assert.deepEqual(createProfile().loadout, { skinId: null, titleId: null, badgeIds: [] });
  assert.equal(createProfile().companionId, 'emberquill');
  assert.equal(createProfile({ verification: 'verified' }).verification, 'local');
  assert.equal(loadProfile(memoryStorage()), null);
});

test('only explicitly catalogued companions are accepted', () => {
  assert.equal(PROFILE_COMPANIONS.length, 9);
  for (const { id } of PROFILE_COMPANIONS) assert.equal(createProfile({ companionId: id }).companionId, id);
  for (const id of ['owl', 'claude', '__proto__', '../trainer', {}, null]) {
    assert.equal(createProfile({ companionId: id }).companionId, 'emberquill');
  }
});

test('unknown and unowned equipment cannot be equipped or imported', () => {
  const base = createProfile();
  for (const id of [...rewards, '__proto__', 'skin-missing', {}, null]) {
    assert.deepEqual(equipCosmetic(base, id), base);
  }
  const imported = createProfile({ ownedIds: ['bogus'], loadout: {
    skinId: 'skin-lantern', titleId: 'title-lantern-keeper', badgeIds: rewards,
  } });
  assert.deepEqual(imported.ownedIds, []);
  assert.deepEqual(imported.loadout, base.loadout);
});

test('equipment is type checked and incompatible skins are rejected for every roster member', () => {
  for (const { id } of PROFILE_COMPANIONS) {
    const next = equipCosmetic(earned(id), 'skin-lantern');
    assert.equal(next.loadout.skinId, ['emberquill', 'kitewhisk', 'duplet'].includes(id) ? 'skin-lantern' : null);
  }
  const wrongTypes = createProfile({ ownedIds: rewards, loadout: {
    skinId: 'title-lantern-keeper', titleId: 'badge-static-clear', badgeIds: ['skin-lantern'],
  } });
  assert.deepEqual(wrongTypes.loadout, createProfile().loadout);
  const switched = syncAdventureProfile(equipCosmetic(earned(), 'skin-lantern'), { companionId: 'mossback' });
  assert.equal(switched.loadout.skinId, null);
  assert.ok(switched.ownedIds.includes('skin-lantern'));
});

test('pinning is unique, limited to three badges and reversible without deleting ownership', () => {
  let profile = earned();
  for (const id of rewards) profile = equipCosmetic(profile, id);
  const badges = ['badge-lantern-signal', 'badge-static-clear', 'badge-archive-warden'];
  assert.deepEqual(profile.loadout.badgeIds, badges);
  assert.deepEqual(equipCosmetic(profile, badges[0]), profile);
  assert.deepEqual(equipCosmetic(profile, 'badge-unknown'), profile);
  const removed = equipCosmetic(profile, badges[1], { unequip: true });
  assert.deepEqual(removed.loadout.badgeIds, [badges[0], badges[2]]);
  assert.deepEqual(removed.ownedIds, rewards);
  assert.deepEqual(equipCosmetic(removed, badges[1]).loadout.badgeIds, [badges[0], badges[2], badges[1]]);
  assert.equal(equipCosmetic(profile, 'skin-lantern', { unequip: true }).loadout.skinId, null);
  assert.equal(equipCosmetic(profile, 'title-lantern-keeper', { unequip: true }).loadout.titleId, null);
  assert.deepEqual(profile.loadout.badgeIds, badges, 'input is not mutated');
});

test('duplicate and malformed imported inventories and badge pins are bounded', () => {
  const value = createProfile({ ownedIds: [...rewards, ...rewards, '__proto__', {}], loadout: {
    badgeIds: ['badge-static-clear', 'badge-static-clear', 'badge-lantern-signal', 'badge-archive-warden', 'skin-lantern', 'fourth'],
  } });
  assert.deepEqual(value.ownedIds, rewards);
  assert.deepEqual(value.loadout.badgeIds, ['badge-static-clear', 'badge-lantern-signal', 'badge-archive-warden']);
  assert.equal(value.loadout.badgeIds.length, 3);
});

test('synchronization is idempotent, only adds known grants, and preserves equipment', () => {
  const profile = equipCosmetic(earned(), 'title-lantern-keeper');
  const projection = { trainerName: 'Rin', companionId: 'kitewhisk', level: 9, worldsCleared: 1, rewardIds: [...rewards, 'paid-item'] };
  const once = syncAdventureProfile(profile, projection);
  assert.deepEqual(syncAdventureProfile(once, projection), once);
  assert.deepEqual(syncAdventureProfile(once, { rewardIds: [] }).ownedIds, rewards);
  assert.equal(once.loadout.titleId, 'title-lantern-keeper');
  assert.equal(syncAdventureProfile(once, { worldsCleared: 0 }).worldsCleared, 1);
  assert.equal(profile.trainerName, 'Mara');
});

test('profile and frozen snapshot allowlists exclude secrets, calls and arbitrary nested data', () => {
  const hostile = { ...earned(), apiKey: 'SECRET', credentials: { token: 'SECRET' }, calls: ['SECRET'],
    response: 'SECRET', verification: 'official', loadout: { ...earned().loadout, apiKey: 'SECRET', fighters: ['SECRET'] } };
  for (const value of [createProfile(hostile), syncAdventureProfile(hostile, hostile), profileSnapshot(hostile)]) {
    assert.ok(!JSON.stringify(value).includes('SECRET'));
    assert.equal(value.verification, 'local');
    assert.deepEqual(Object.keys(value).sort(), ['version', 'trainerName', 'companionId', 'level', 'worldsCleared', 'ownedIds', 'loadout', 'verification'].sort());
  }
  const frozen = profileSnapshot(equipCosmetic(earned(), 'badge-static-clear'));
  assert.ok(Object.isFrozen(frozen) && Object.isFrozen(frozen.loadout) && Object.isFrozen(frozen.ownedIds));
  assert.ok(Object.isFrozen(frozen.loadout.badgeIds));
  assert.throws(() => frozen.loadout.badgeIds.push('badge-archive-warden'), TypeError);
  assert.deepEqual(createProfile(frozen), frozen, 'a snapshot can be revalidated without losing equipment');
  const source = equipCosmetic(earned(), 'badge-static-clear');
  const detached = profileSnapshot(source);
  source.loadout.badgeIds.length = 0;
  source.ownedIds.length = 0;
  assert.deepEqual(detached.loadout.badgeIds, ['badge-static-clear']);
  assert.deepEqual(detached.ownedIds, rewards);
});

test('names and prestige counters reject unsafe types, controls and unbounded values', () => {
  assert.equal(createProfile({ trainerName: '  Rin\u202e<>\n  Vale  ' }).trainerName, 'Rin Vale');
  assert.equal(Array.from(createProfile({ trainerName: '🌿'.repeat(100) }).trainerName).length, 32);
  for (const value of [-1, Infinity, NaN, '5', {}, 1000000]) {
    const profile = createProfile({ trainerName: value, level: value, worldsCleared: value });
    assert.equal(profile.trainerName, typeof value === 'string' ? value : 'Trainer');
    assert.equal(profile.level, 1);
    assert.equal(profile.worldsCleared, 0);
  }
});

test('save/load round trip persists only normalized, local catalog data', () => {
  const storage = memoryStorage();
  const profile = rewards.reduce((current, id) => equipCosmetic(current, id), earned('duplet'));
  assert.equal(saveProfile({ ...profile, apiKey: 'SECRET', verification: 'official' }, storage), true);
  assert.ok(!storage.getItem(PROFILE_SAVE_KEY).includes('SECRET'));
  assert.deepEqual(loadProfile(storage), profile);
});

test('corrupt, oversized, wrong-version and malicious storage is safe and never overwritten', () => {
  for (const raw of ['', '{', 'null', '[]', 'true', '"text"', '{"version":999}', ' '.repeat(16385)]) {
    const storage = memoryStorage(raw);
    assert.equal(loadProfile(storage), null);
    assert.equal(storage.getItem(PROFILE_SAVE_KEY), raw);
  }
  const malicious = memoryStorage('{"version":1,"__proto__":{"polluted":true},"trainerName":{},"ownedIds":["__proto__"],"loadout":{"badgeIds":{},"skinId":"constructor"},"verification":"verified"}');
  assert.deepEqual(loadProfile(malicious), createProfile());
  assert.equal({}.polluted, undefined);
  for (const value of [null, [], 'text', 42, { ownedIds: {}, loadout: [] }]) assert.doesNotThrow(() => createProfile(value));
});

test('blocked storage getters, read errors, quota failures and missing storage do not throw', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.equal(loadProfile(blocked), null);
  assert.equal(saveProfile(earned(), blocked), false);
  assert.equal(saveProfile(earned(), null), false);
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('denied'); } });
    assert.equal(loadProfile(), null);
    assert.equal(saveProfile(earned()), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});
