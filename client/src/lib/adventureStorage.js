import { ADVENTURE_SAVE_KEY, LEGACY_SAVE_KEYS, fromAdventureSave, loadAdventure, saveAdventure, saveCircuitRecord } from '../../../shared/rpg/adventureSave.js';
import { saveProfile } from '../../../shared/rpg/profile.js';

// UI boundary: shared save validation throws detailed errors; rendering must stay usable.
export function readAdventure(storage) {
  try {
    const state = loadAdventure(storage);
    return { state, error: state?.saveWarning || '' };
  } catch (error) {
    return { state: null, error: error.message || 'Your adventure could not be read. Existing saves have not been removed.' };
  }
}

export function writeAdventure(state, storage, options) {
  try { return saveAdventure(state, storage, options); } catch { return false; }
}

// Legacy-only / empty saves need a stable identity too: title Practice has no returnJourney.
export function journeyStorageIdentity(storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    const raw = target.getItem(ADVENTURE_SAVE_KEY);
    if (raw !== null) {
      const journey = fromAdventureSave(JSON.parse(raw));
      return journey?.mode === 'journey' ? `journey:${journey.runId}` : null;
    }
    return `legacy:${JSON.stringify(LEGACY_SAVE_KEYS.map(key => target.getItem(key)))}`;
  } catch { return null; }
}

export function writeGameProfile(profile, expectedIdentity, storage) {
  return typeof expectedIdentity === 'string' && journeyStorageIdentity(storage) === expectedIdentity && saveProfile(profile, storage);
}

export function retryGameSave(state, profile, storage, identity) {
  if (state.mode === 'circuit') return saveCircuitRecord(state.circuit, storage);
  const journey = state.mode === 'journey' ? state : state.returnJourney;
  return (!journey || writeAdventure(journey, storage)) && writeGameProfile(profile, identity ?? (journey ? `journey:${journey.runId}` : null), storage);
}
