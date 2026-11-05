import test from 'node:test';
import assert from 'node:assert/strict';
import { createMovementController, RUN_STEP_MS, WALK_STEP_MS, stepDuration } from './adventureMovement.js';

test('held input follows the clock and ignores OS key repeat', () => {
  const input = createMovementController();
  input.press('KeyD', [1, 0]);
  assert.deepEqual(input.tick(0), [1, 0]);
  input.press('KeyD', [1, 0]);
  assert.equal(input.tick(WALK_STEP_MS - 1), null);
  assert.deepEqual(input.tick(WALK_STEP_MS), [1, 0]);
  input.release('KeyD');
  assert.equal(input.tick(1000), null);
  input.press('KeyD', [1, 0]);
  assert.deepEqual(input.tick(1001), [1, 0]);
});

test('latest direction wins without diagonals and releasing it restores the held direction', () => {
  const input = createMovementController();
  input.press('KeyD', [1, 0]);
  input.press('KeyW', [0, -1]);
  input.press('KeyD', [1, 0]);
  assert.deepEqual(input.tick(0), [0, -1]);
  input.press('pointer:4', [0, 1]);
  assert.equal(input.tick(1), null);
  assert.deepEqual(input.tick(WALK_STEP_MS), [0, 1]);
  input.release('pointer:4');
  assert.deepEqual(input.tick(WALK_STEP_MS * 2), [0, -1]);
  input.release('KeyW');
  assert.deepEqual(input.tick(WALK_STEP_MS * 3), [1, 0]);
});

test('running changes cadence and late frames emit only one step', () => {
  const input = createMovementController();
  input.press('KeyD', [1, 0]);
  input.tick(0);
  input.setRunning(true);
  assert.equal(input.tick(RUN_STEP_MS - 1), null);
  assert.deepEqual(input.tick(RUN_STEP_MS), [1, 0]);
  assert.deepEqual(input.tick(60000), [1, 0]);
  assert.equal(input.tick(60000), null);
  input.setRunning(false);
  assert.equal(input.tick(60000 + WALK_STEP_MS - 1), null);
  assert.deepEqual(input.tick(60000 + WALK_STEP_MS), [1, 0]);
});

test('cancel clears all keyboard and pointer inputs and resets cadence', () => {
  const input = createMovementController();
  input.press('KeyD', [1, 0]);
  input.press('pointer:1', [-1, 0]);
  input.setRunning(true);
  input.tick(0);
  input.cancel();
  assert.equal(input.tick(10000), null);
  input.press('KeyW', [0, -1]);
  assert.deepEqual(input.tick(10001), [0, -1]);
  assert.equal(input.tick(10001 + RUN_STEP_MS), null);
  assert.deepEqual(input.tick(10001 + WALK_STEP_MS), [0, -1]);
});

test('departure terrain controls cadence and run changes retain that surface', () => {
  for (const surface of ['grass', 'dirt', 'stone', 'water', 'bridge']) assert.equal(stepDuration(false, surface), WALK_STEP_MS);
  assert.equal(stepDuration(false, 'mud'), WALK_STEP_MS * 1.55);
  assert.equal(stepDuration(true, 'sand'), RUN_STEP_MS * 1.2);
  const input = createMovementController();
  input.press('KeyD', [1, 0]);
  assert.deepEqual(input.tick(0, 'mud'), [1, 0]);
  assert.equal(input.tick(200, 'grass'), null);
  input.setRunning(true);
  const next = stepDuration(true, 'mud');
  assert.equal(input.tick(next - 1, 'sand'), null);
  assert.deepEqual(input.tick(next, 'sand'), [1, 0]);
  assert.equal(input.tick(next + stepDuration(true, 'sand') - 1, 'grass'), null);
  assert.deepEqual(input.tick(next + stepDuration(true, 'sand'), 'grass'), [1, 0]);
});
