import { createAdventure } from './adventure.js';
import { ADVENTURE_SAVE_KEY, CIRCUIT_SAVE_KEY, LEGACY_SAVE_KEYS, fromAdventureSave, loadAdventure, loadCircuitRecord, toAdventureSave } from './adventureSave.js';
import { PROFILE_SAVE_KEY, PROFILE_VERSION, createProfile, loadProfile } from './profile.js';

export const BACKUP_FORMAT = 'cogimon-save-backup';
export const MAX_BACKUP_BYTES = 256 * 1024;
const KEYS = [ADVENTURE_SAVE_KEY, PROFILE_SAVE_KEY, CIRCUIT_SAVE_KEY, ...LEGACY_SAVE_KEYS];
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = message => { throw new Error(message); };

function targetStorage(storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    if (target && typeof target.getItem === 'function') return target;
  } catch { /* A browser can deny access to the storage getter itself. */ }
  return fail('Site storage is unavailable. Allow storage for Cogimon and try again.');
}

function snapshot(storage) {
  try { return KEYS.map(key => storage.getItem(key)); }
  catch { return fail('Your current saves could not be read. Nothing was replaced.'); }
}

function normalize(value) {
  if (!record(value) || value.format !== BACKUP_FORMAT || value.version !== 1) {
    return fail('This is not a supported Cogimon backup. Choose a file downloaded from Save Data.');
  }
  const journey = fromAdventureSave(value.journey);
  if (!journey || journey.mode !== 'journey') return fail('The backup Journey is damaged or incomplete. Your current saves are unchanged.');
  if (!['journey', 'all'].includes(value.scope)) return fail('The backup contents are not supported. Your current saves are unchanged.');
  const all = value.scope === 'all';
  if (all && (!record(value.profile) || value.profile.version !== PROFILE_VERSION || !record(value.circuit)
    || value.circuit.version !== 1 || !Number.isInteger(value.circuit.bestWins) || value.circuit.bestWins < 0 || value.circuit.bestWins > 3)) {
    return fail('The backup Locker or Circuit record is damaged. Your current saves are unchanged.');
  }
  return {
    format: BACKUP_FORMAT, version: 1, scope: value.scope,
    journey: toAdventureSave(journey),
    profile: all ? createProfile(value.profile) : null,
    circuit: all ? { version: 1, bestWins: value.circuit.bestWins } : null,
  };
}

/** Select only game-owned records; never enumerate localStorage or accept provider data. */
export function createSaveBackup(storage, { journey, profile, scope = 'all' } = {}) {
  const target = targetStorage(storage);
  const state = journey === undefined ? loadAdventure(target) : journey;
  const carriedJourney = state?.mode === 'journey' ? state : state?.returnJourney;
  const protectedJourney = carriedJourney ?? loadAdventure(target);
  if (!protectedJourney) return fail('No saved Journey yet. Begin a Journey before making a backup.');
  return normalize({
    format: BACKUP_FORMAT, version: 1, scope,
    journey: toAdventureSave(protectedJourney),
    profile: (carriedJourney ? profile : undefined) ?? loadProfile(target) ?? createProfile(),
    circuit: loadCircuitRecord(target),
  });
}

/** Parsing and preview do not write. The token also detects another tab changing the save. */
export function prepareSaveRestore(text, storage) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) {
    return fail('Choose a Cogimon JSON backup smaller than 256 KB. Nothing was replaced.');
  }
  let value;
  try { value = JSON.parse(text); } catch { return fail('This file is not valid JSON. Choose a Cogimon backup; your current saves are unchanged.'); }
  const backup = normalize(value);
  return { backup, expected: snapshot(targetStorage(storage)) };
}

/** Confirmed, verified local replacement. Legacy saves and unrelated keys are never written. */
export function restoreSaveBackup(prepared, storage) {
  const target = targetStorage(storage);
  const backup = normalize(prepared?.backup);
  const before = snapshot(target);
  if (!Array.isArray(prepared?.expected) || prepared.expected.length !== KEYS.length
    || before.some((raw, index) => raw !== prepared.expected[index])) {
    return fail('Your saves changed after this preview, possibly in another tab. Choose the backup again to review the latest state. Nothing was replaced.');
  }
  // Reusing the imported run ID would let an already-open tab undo the restore.
  const journey = fromAdventureSave(backup.journey);
  journey.runId = createAdventure({}).runId;
  const writes = [[ADVENTURE_SAVE_KEY, JSON.stringify(toAdventureSave(journey))]];
  if (backup.scope === 'all') {
    writes.push([PROFILE_SAVE_KEY, JSON.stringify(backup.profile)]);
    writes.push([CIRCUIT_SAVE_KEY, JSON.stringify({ version: 1, bestWins: Math.max(backup.circuit.bestWins, loadCircuitRecord(target).bestWins) })]);
  }
  const touched = [];
  try {
    for (const [key, value] of writes) {
      touched.push(key);
      target.setItem(key, value);
      if (target.getItem(key) !== value) throw new Error('write verification failed');
    }
    if (writes.some(([key, value]) => target.getItem(key) !== value)) throw new Error('write verification failed');
  } catch {
    let recovered = true;
    for (const key of touched.reverse()) {
      try {
        const original = before[KEYS.indexOf(key)];
        if (target.getItem(key) !== original) {
          if (original === null) target.removeItem(key); else target.setItem(key, original);
        }
        if (target.getItem(key) !== original) recovered = false;
      } catch { recovered = false; }
    }
    return fail(recovered
      ? 'Restore could not be saved. Your previous records were recovered. Allow site storage or free space and try again.'
      : 'Restore failed and some previous records could not be recovered. Keep your backup file safe, allow site storage, then restore it again. Do not continue playing until recovery succeeds.');
  }
  return journey;
}
