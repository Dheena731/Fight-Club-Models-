import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraAxis, fieldPoseBounds, followerTile, sampleTrail, stridePose } from './adventureAnimation.js';

test('authored atlas crops retain boots and north hats while excluding neighboring poses', () => {
  const east = fieldPoseBounds(0, 2, 1246, 1263);
  assert.ok(east.y <= 636 && east.y + east.height > 884, 'east pose includes head and boots');
  assert.ok(east.y + east.height < 926, 'next-row hat cannot become a detached foot');
  assert.equal(east.y + east.baseline, 884, 'east boots use their own ground baseline');
  const north = fieldPoseBounds(0, 3, 1246, 1263);
  assert.ok(north.offsetY < 0 && north.y < 926, 'north hat above the nominal grid is retained');
  assert.equal(north.cellHeight, 316, 'cropping retains the original rendering scale');
  const westCat = fieldPoseBounds(2, 1, 1246, 1263); const westDuplet = fieldPoseBounds(3, 1, 1246, 1263);
  assert.ok(westCat.x + westCat.width < 924, 'cat frame excludes its neighboring dragon');
  assert.ok(westDuplet.x <= 924 && westDuplet.offsetX < 0, 'dragon keeps its cross-column outline');
});

test('camera centers small maps and clamps both ends of a larger map', () => {
  assert.equal(cameraAxis(5, 240, 400), 120);
  assert.equal(cameraAxis(5, 800, 400), 200);
  assert.equal(cameraAxis(795, 800, 400), 600);
  assert.equal(cameraAxis(350, 800, 400), 350);
});

test('arrival places the follower behind, then beside the trainer on a walkable tile', () => {
  assert.deepEqual(followerTile(4, 5, 'right', () => true), { x: 3, y: 5 });
  assert.deepEqual(followerTile(4, 5, 'up', (x, y) => y !== 6), { x: 5, y: 5 });
  assert.deepEqual(followerTile(4, 5, 'down', (x, y) => x === 4 && y === 6), { x: 4, y: 6 });
  assert.deepEqual(followerTile(4, 5, 'left', () => false), { x: 4, y: 5 });
});

test('follower samples each leg of a corner instead of crossing the blocked diagonal', () => {
  const trail = [{ x: 0, y: 0, distance: 0 }, { x: 24, y: 0, distance: 24 }, { x: 24, y: 24, distance: 48 }];
  assert.deepEqual(sampleTrail(trail, 12), { x: 12, y: 0, facing: 'right' });
  assert.deepEqual(sampleTrail(trail, 36), { x: 24, y: 12, facing: 'down' });
  assert.deepEqual(sampleTrail(trail, 99), { x: 24, y: 24, facing: 'down' });
  assert.deepEqual(sampleTrail([trail[0]], 0), { x: 0, y: 0, facing: 'down' });
});

test('stride alternates feet, extends when running, and stays neutral for reduced motion', () => {
  const first = stridePose(Math.PI / 2, 'right');
  const second = stridePose(Math.PI * 1.5, 'right');
  assert.ok(first.leftX > 0 && first.rightX < 0 && first.leftY < 0);
  assert.ok(second.leftX < 0 && second.rightX > 0 && second.rightY < 0);
  assert.ok(stridePose(Math.PI / 2, 'right', true).leftX > first.leftX);
  const front = stridePose(Math.PI / 2, 'down');
  assert.ok(front.leftY > 0 && front.rightY < 0);
  const reduced = stridePose(1, 'down', true, true);
  assert.ok(Object.values(reduced).every(value => value === 0));
  const reused = {};
  assert.equal(stridePose(1, 'left', false, false, reused), reused);
  assert.equal(sampleTrail([{ x: 0, y: 0, distance: 0 }], 0, reused), reused);
});
