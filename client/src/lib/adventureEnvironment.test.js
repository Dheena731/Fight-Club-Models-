import test from 'node:test';
import assert from 'node:assert/strict';
import { crossingTimeline, environmentGrid, groundNoise, landscapeValue, traversalPose } from './adventureEnvironment.js';
import { ADVENTURE_REGIONS, terrainAt } from '../../../shared/rpg/adventureContent.js';

test('every rendered region tile agrees with canonical movement and sound terrain', () => {
  assert.equal(Object.keys(ADVENTURE_REGIONS).length, 17);
  for (const region of Object.values(ADVENTURE_REGIONS)) {
    const grid = environmentGrid(region);
    for (let y = 0; y < region.height; y++) for (let x = 0; x < region.width; x++) {
      assert.equal(grid[y][x], terrainAt(region.id, x, y), `${region.id} at ${x},${y}`);
    }
  }
});

test('rendered terrain follows authored last-match precedence including bridges over rivers', () => {
  const grid = environmentGrid({ width: 4, height: 3, path: [{ x: 0, y: 1, w: 4, h: 1 }], terrain: [
    { x: 1, y: 0, w: 2, h: 3, kind: 'water' }, { x: 1, y: 1, w: 2, h: 1, kind: 'bridge' },
  ] });
  assert.deepEqual(grid, [['grass', 'water', 'water', 'grass'], ['dirt', 'bridge', 'bridge', 'dirt'], ['grass', 'water', 'water', 'grass']]);
});

test('crossing waits for the companion to follow and settle before completing', () => {
  assert.deepEqual(crossingTimeline(0, 420), { approach: 0, player: 0, follower: 0, settle: 0, done: false });
  const playerLanded = crossingTimeline(420, 420);
  assert.equal(playerLanded.player, 1); assert.ok(playerLanded.follower < 1); assert.equal(playerLanded.done, false);
  const companionLanded = crossingTimeline(520, 420);
  assert.equal(companionLanded.follower, 1); assert.equal(companionLanded.done, false);
  assert.deepEqual(crossingTimeline(630, 420), { approach: 1, player: 1, follower: 1, settle: 1, done: true });
  assert.deepEqual(crossingTimeline(0, 760, true), { approach: 1, player: 1, follower: 1, settle: 1, done: true });
});

test('landscape noise remains deterministic with distinct coordinates', () => {
  assert.equal(groundNoise(12, 5), groundNoise(12, 5));
  assert.notEqual(groundNoise(12, 5), groundNoise(5, 12));
});

test('landscape fields are stable, bounded, and continuous across lattice seams', () => {
  for (let y = -6; y <= 40; y += 0.5) for (let x = -6; x <= 56; x += 0.5) {
    const value = landscapeValue(x, y, 7);
    assert.ok(value >= 0 && value <= 1);
    assert.equal(value, landscapeValue(x, y, 7));
    assert.ok(Math.abs(value - landscapeValue(x + 0.01, y, 7)) < 0.004);
    assert.ok(Math.abs(value - landscapeValue(x, y + 0.01, 7)) < 0.004);
  }
  assert.notEqual(landscapeValue(12, 5, 7), landscapeValue(12, 5, 8));
  for (let seam = -5; seam <= 55; seam += 5) {
    assert.ok(Math.abs(landscapeValue(seam - 0.001, 7) - landscapeValue(seam + 0.001, 7)) < 0.00001);
  }
});

test('jump and climb preserve exact ground endpoints and only lift between them', () => {
  for (const kind of ['jump', 'ledge', 'climb']) {
    const traversal = { kind, from: { x: 3, y: 5 }, to: { x: 7, y: 2 } };
    const start = traversalPose(traversal, 0); const middle = traversalPose(traversal, 0.5); const end = traversalPose(traversal, 1);
    assert.equal(start.x, 84); assert.equal(start.y, 142.8); assert.equal(start.lift, 0);
    assert.equal(end.x, 180); assert.ok(Math.abs(end.y - 70.8) < 0.000001); assert.ok(Math.abs(end.lift) < 0.000001);
    assert.ok(middle.lift > 0); assert.equal(middle.facing, 'right');
    assert.deepEqual(traversalPose(traversal, -1), start); assert.deepEqual(traversalPose(traversal, 2), end);
  }
});
