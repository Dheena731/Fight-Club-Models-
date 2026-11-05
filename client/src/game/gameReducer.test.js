import test from 'node:test';
import assert from 'node:assert/strict';
import { gameReducer, initialState, PHASE, FIGHT_BEAT } from './gameReducer.js';
import { readDuelInvite } from '../lib/duelInvite.js';

test('Journey duels retain the exact protected adventure on entry and return', () => {
  const adventure = { trainerName: 'Mara', locationId: 'frontier', x: 12, hp: 32, flags: { questComplete: true } };
  const duel = gameReducer({ ...initialState, phase: PHASE.WORLD, loadout: { oldArena: true }, result: { oldResult: true } }, { type: 'ENTER_PVP', adventure });
  assert.equal(duel.phase, PHASE.PVP);
  assert.equal(duel.pvpReturn, true);
  assert.equal(duel.adventure, adventure);
  assert.equal(duel.loadout, null);
  assert.equal(duel.result, null);
  assert.equal(duel.fightBeat, FIGHT_BEAT.IDLE);
  const returned = gameReducer(duel, { type: 'RETURN_WORLD' });
  assert.equal(returned.phase, PHASE.WORLD);
  assert.equal(returned.adventure, adventure);
  assert.equal(returned.pvpReturn, false);
});

test('title or invite duels return to title even when an older Journey snapshot is retained', () => {
  const adventure = { trainerName: 'Kite', level: 5 };
  const duel = gameReducer({ ...initialState, phase: PHASE.TITLE, adventure }, { type: 'ENTER_PVP' });
  assert.equal(duel.phase, PHASE.PVP);
  assert.equal(duel.pvpReturn, false);
  assert.equal(duel.adventure, adventure);
  const returned = gameReducer(duel, { type: 'RETURN_TITLE' });
  assert.equal(returned.phase, PHASE.TITLE);
  assert.equal(returned.adventure, adventure);
});

test('only bounded invite codes route startup into a duel; no token or replay payload is accepted', () => {
  assert.equal(readDuelInvite('#duel=aB23F9Cd18'), 'AB23F9CD18');
  for (const hash of ['', '#r=AB23F9CD18', '#duel=ABC', '#duel=AB23F9CD18&token=secret', '#duel=../room', '#duel=AB23F9CD180', '#duel=AB%23F9CD18', '#duel=AB23Z9CD18', null]) {
    assert.equal(readDuelInvite(hash), null);
  }
});
