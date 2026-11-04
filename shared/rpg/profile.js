export const PROFILE_VERSION = 1;
export const PROFILE_SAVE_KEY = 'ai-frontier:profile:v1';

export const PROFILE_COMPANIONS = Object.freeze([
  { id: 'emberquill', name: 'Emberquill', description: 'A protective Ember owl with a luminous quill.' },
  { id: 'kitewhisk', name: 'Kitewhisk', description: 'A curious Grove fox with a golden fan tail.' },
  { id: 'duplet', name: 'Duplet', description: 'Two Tide salamanders sharing one winding body.' },
  { id: 'crosswake', name: 'Crosswake', description: 'A rose-coloured octopus and compass-carrying guide.' },
  { id: 'zipcat', name: 'Zipcat', description: 'An orange courier cat with a long relay tail.' },
  { id: 'rampart', name: 'Rampart', description: 'A slate bull with ivory horns and weathered armour.' },
  { id: 'latticewing', name: 'Latticewing', description: 'An amber bee with patterned mint wings.' },
  { id: 'mossback', name: 'Mossback', description: 'A violet llama carrying a small garden.' },
  { id: 'patchbyte', name: 'Patchbyte', description: 'A violet automaton with a bright cyan core.' },
].map(Object.freeze));

export const COSMETICS = Object.freeze([
  {
    id: 'skin-lantern', type: 'skin', name: 'Lantern glow',
    description: 'A lantern-lit frame around your companion’s original portrait.',
    companionIds: Object.freeze(['emberquill', 'kitewhisk', 'duplet']),
    unlockHint: 'Restore Frontier Crossing and return to Mara to finish The Lantern Signal.',
  },
  {
    id: 'badge-lantern-signal', type: 'badge', name: 'Lantern Signal',
    description: 'A reminder of the light you brought home.',
    unlockHint: 'Finish The Lantern Signal and celebrate the restored town.',
  },
  {
    id: 'badge-static-clear', type: 'badge', name: 'Static Clear',
    description: 'The Moss Circuit is quiet again.',
    unlockHint: 'Defeat the Static Wisp during your Journey through Moss Circuit.',
  },
  {
    id: 'badge-archive-warden', type: 'badge', name: 'Archive Warden',
    description: 'Earned at the heart of the Forgotten Archive.',
    unlockHint: 'Defeat the Archive guardian during your Journey.',
  },
  {
    id: 'title-lantern-keeper', type: 'title', name: 'Lantern Keeper',
    description: 'Carry a little of Frontier Crossing with you.',
    unlockHint: 'Return to Mara after restoring the lantern signal.',
  },
].map(Object.freeze));

const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const validCompanion = (id) => PROFILE_COMPANIONS.some((entry) => entry.id === id);
const bounded = (value, min, max, fallback) => Number.isInteger(value) && value >= min && value <= max ? value : fallback;
const compatible = (item, companionId) => !item.companionIds || item.companionIds.includes(companionId);

export function getCosmetic(id) {
  return typeof id === 'string' ? COSMETICS.find((item) => item.id === id) ?? null : null;
}

function trainerName(value) {
  if (typeof value !== 'string') return 'Trainer';
  return Array.from(value.slice(0, 256)
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff<>]/g, '')
    .replace(/\s+/g, ' ').trim()).slice(0, 32).join('') || 'Trainer';
}

function knownIds(value) {
  // Catalog order makes repeated imports/synchronization deterministic and bounded.
  return COSMETICS.filter((item) => Array.isArray(value) && value.includes(item.id)).map((item) => item.id);
}

/** The only profile projection boundary. Never spread adventure, fighter or provider data here. */
export function createProfile(value = {}) {
  const input = record(value) ? value : {};
  const companionId = validCompanion(input.companionId) ? input.companionId : 'emberquill';
  const ownedIds = knownIds(input.ownedIds);
  const loadout = record(input.loadout) ? input.loadout : {};
  const validEquipment = (id, type) => {
    const item = getCosmetic(id);
    return item?.type === type && ownedIds.includes(id) && compatible(item, companionId);
  };
  const badgeIds = Array.isArray(loadout.badgeIds)
    ? [...new Set(loadout.badgeIds.filter((id) => validEquipment(id, 'badge')))].slice(0, 3) : [];
  return {
    version: PROFILE_VERSION,
    trainerName: trainerName(input.trainerName),
    companionId,
    level: bounded(input.level, 1, 999, 1),
    worldsCleared: bounded(input.worldsCleared, 0, 9999, 0),
    ownedIds,
    loadout: {
      skinId: validEquipment(loadout.skinId, 'skin') ? loadout.skinId : null,
      titleId: validEquipment(loadout.titleId, 'title') ? loadout.titleId : null,
      badgeIds,
    },
    verification: 'local',
  };
}

/** Returns a validated profile, or null for missing/unreadable/corrupt storage. Does not overwrite it. */
export function loadProfile(storage) {
  try {
    const raw = (storage === undefined ? globalThis.localStorage : storage)?.getItem(PROFILE_SAVE_KEY);
    if (typeof raw !== 'string' || raw.length > 16384) return null;
    const value = JSON.parse(raw);
    return record(value) && value.version === PROFILE_VERSION ? createProfile(value) : null;
  } catch {
    return null;
  }
}

/** Boolean result lets the root surface storage failure without losing its in-memory profile. */
export function saveProfile(profile, storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    if (!target || typeof target.setItem !== 'function') return false;
    target.setItem(PROFILE_SAVE_KEY, JSON.stringify(createProfile(profile)));
    return true;
  } catch {
    return false;
  }
}

/** Accept only the root's Journey projection; this is not proof of an official achievement. */
export function syncAdventureProfile(profile, projection = {}) {
  const current = createProfile(profile);
  const input = record(projection) ? projection : {};
  return createProfile({
    trainerName: input.trainerName ?? current.trainerName,
    companionId: validCompanion(input.companionId) ? input.companionId : current.companionId,
    level: bounded(input.level, 1, 999, current.level),
    worldsCleared: Math.max(current.worldsCleared, bounded(input.worldsCleared, 0, 9999, current.worldsCleared)),
    ownedIds: [...current.ownedIds, ...knownIds(input.rewardIds)],
    loadout: current.loadout,
  });
}

/** Unknown/unowned/incompatible IDs are a no-op. Use {unequip:true} to remove an equipped item. */
export function equipCosmetic(profile, cosmeticId, options = {}) {
  const next = createProfile(profile);
  const item = getCosmetic(cosmeticId);
  if (!item || !next.ownedIds.includes(item.id) || !compatible(item, next.companionId)) return next;
  const remove = options?.unequip === true;
  if (item.type === 'badge') {
    const pinned = next.loadout.badgeIds;
    if (remove) next.loadout.badgeIds = pinned.filter((id) => id !== item.id);
    else if (pinned.length < 3 && !pinned.includes(item.id)) pinned.push(item.id);
  } else {
    const slot = item.type === 'skin' ? 'skinId' : 'titleId';
    if (!remove) next.loadout[slot] = item.id;
    else if (next.loadout[slot] === item.id) next.loadout[slot] = null;
  }
  return next;
}

/** Freeze a fresh allowlisted copy, including nested equipment, for the duration of a match. */
export function profileSnapshot(profile) {
  const snapshot = createProfile(profile);
  Object.freeze(snapshot.ownedIds);
  Object.freeze(snapshot.loadout.badgeIds);
  Object.freeze(snapshot.loadout);
  return Object.freeze(snapshot);
}
