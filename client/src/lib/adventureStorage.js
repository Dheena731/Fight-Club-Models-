import { loadAdventure, saveAdventure, saveCircuitRecord } from '../../../shared/rpg/adventureSave.js';
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

export function retryGameSave(state, profile, storage) {
  if (state.mode === 'circuit') return saveCircuitRecord(state.circuit, storage);
  const journey = state.mode === 'journey' ? state : state.returnJourney;
  return (!journey || writeAdventure(journey, storage)) && saveProfile(profile, storage);
}
