import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_REGIONS, WORLD_PROJECTS } from './adventureContent.js';
import { createAdventure, exitLocked, worldProjectProgress } from './adventure.js';
import { adventureRoute, mapLandmarks } from './adventureNavigation.js';

test('every current project lead can be tracked without revealing unrelated secrets', () => {
  for (const project of WORLD_PROJECTS) {
    const state = createAdventure();
    for (const stage of project.stages) {
      const lead = worldProjectProgress(state).find(entry => entry.id === project.id);
      const route = adventureRoute(state, lead);
      assert.ok(route, stage.objectId);
      assert.equal(route.blocked, false, stage.objectId);
      state.flags[stage.flag] = true;
    }
  }
  assert.equal(adventureRoute(createAdventure(), { regionId: '__proto__' }), null);
  assert.equal(adventureRoute(createAdventure(), { regionId: 'sunward', objectId: 'keeper-lens' }), null);
});

test('every outdoor destination has a real open route before the Wisp, except the Archive', () => {
  const state = createAdventure();
  for (const region of Object.values(ADVENTURE_REGIONS).filter(entry => entry.outdoor !== false)) {
    const route = adventureRoute(state, { regionId: region.id });
    assert.equal(route.blocked, region.id === 'archive', region.id);
    for (let index = 1; index < route.path.length; index++) {
      assert.ok(ADVENTURE_REGIONS[route.path[index - 1]].objects.some(object => object.to === route.path[index] && !exitLocked(state, object)));
    }
  }
  state.flags.wispDefeated = true;
  assert.deepEqual(adventureRoute(state, { regionId: 'archive' }).path, ['frontier', 'archive']);
});

test('an interior routes through its own exit and a local landmark keeps its own arrival point', () => {
  const state = createAdventure();
  const room = Object.values(ADVENTURE_REGIONS).find(region => region.parentRegion === 'frontier');
  state.locationId = room.id;
  Object.assign(state, room.spawn);
  assert.deepEqual(adventureRoute(state, { regionId: 'grove' }).path, [room.id, 'frontier', 'grove']);
  state.locationId = 'frontier';
  const target = { regionId: 'frontier', objectId: 'guide' };
  const guide = ADVENTURE_REGIONS.frontier.objects.find(object => object.id === 'guide');
  Object.assign(state, { x: guide.x, y: guide.y + 1 });
  assert.equal(adventureRoute(state, target).arrived, true);
  state.y += 2;
  const route = adventureRoute(state, target);
  assert.equal(route.arrived, false);
  assert.equal(route.next.id, 'guide');
  assert.equal(route.direction, 'north');
});

test('unknown, unexplored and secret landmark targets do not leak into navigation', () => {
  const state = createAdventure();
  assert.equal(adventureRoute(state, { regionId: 'missing' }), null);
  assert.equal(adventureRoute(state, { regionId: 'frontier', objectId: 'missing' }), null);
  assert.equal(adventureRoute(state, { regionId: 'riverlands', objectId: 'mill-wheel' }), null);
  state.discoveries.push('riverlands');
  assert.ok(mapLandmarks(state, 'riverlands').some(object => object.id === 'mill-wheel'));
  assert.equal(adventureRoute(state, { regionId: 'riverlands', objectId: 'river-cache' }), null);
  state.flags.riverCacheFound = true;
  assert.ok(adventureRoute(state, { regionId: 'riverlands', objectId: 'river-cache' }));
});

test('project shortcuts are skipped while locked and used when open and nearby', () => {
  const state = createAdventure();
  const shortcut = ADVENTURE_REGIONS.frontier.objects.find(object => object.type === 'exit' && object.requiresFlag);
  assert.ok(shortcut, 'world projects expose a flag-gated exit');
  Object.assign(state, { x: shortcut.x, y: shortcut.y });
  assert.notEqual(adventureRoute(state, { regionId: shortcut.to }).next.id, shortcut.id);
  state.flags[shortcut.requiresFlag] = true;
  assert.equal(adventureRoute(state, { regionId: shortcut.to }).next.id, shortcut.id);
});
