import { loadAdventure, saveAdventure } from '../../../shared/rpg/adventureSave.js';

// UI boundary: shared save validation throws detailed errors; rendering must stay usable.
export function readAdventure(storage) {
  try {
    const state = loadAdventure(storage);
    return { state, error: state?.saveWarning || '' };
  } catch (error) {
    return { state: null, error: error.message || 'Your adventure could not be read. Existing saves have not been removed.' };
  }
}

export function writeAdventure(state, storage) {
  try { return saveAdventure(state, storage); } catch { return false; }
}
