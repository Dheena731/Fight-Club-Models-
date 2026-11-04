import test from 'node:test';
import assert from 'node:assert/strict';
import { gameReducer, initialState, PHASE } from '../game/gameReducer.js';
import { createProfile, profileSnapshot } from '../../../shared/rpg/profile.js';

test('arena entry retains the exact adventure and freezes its separate cosmetic identity', () => {
  const adventure = { mode: 'journey', locationId: 'grove', x: 5, y: 6 };
  const identity = profileSnapshot(createProfile({ trainerName: 'Mara', companionId: 'kitewhisk' }));
  const select = gameReducer(initialState, { type: 'ENTER_ARENA', adventure, identity });
  assert.equal(select.phase, PHASE.SELECT);
  const versus = gameReducer(select, { type: 'START_FIGHT', loadout: { mode: 'roast', rounds: 3 } });
  assert.equal(versus.loadout.identity, identity);
  assert.ok(Object.isFrozen(versus.loadout.identity.loadout));
  const returned = gameReducer(versus, { type: 'RETURN_WORLD' });
  assert.equal(returned.adventure, adventure);
  assert.equal(returned.phase, PHASE.WORLD);
  assert.equal(returned.loadout, null);
});

test('title practice can enter without replacing the saved Journey or starting any arena phase', () => {
  const practice = { mode: 'practice' };
  const entered = gameReducer(initialState, { type: 'ENTER_WORLD', adventure: practice });
  assert.equal(entered.phase, PHASE.WORLD);
  assert.equal(entered.adventure, practice);
  assert.equal(entered.loadout, null);
});
