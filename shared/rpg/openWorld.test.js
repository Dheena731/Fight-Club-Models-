import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_REGIONS, WORLD_PROJECTS } from './adventureContent.js';
import { adventureReducer, createAdventure, exitLocked, isAdventureWalkable, nearbyInteractable, worldProjectProgress } from './adventure.js';
import { fromAdventureSave, toAdventureSave } from './adventureSave.js';

const act = (state, type, extra = {}) => adventureReducer(state, { type, ...extra });
const dismiss = state => act(state, 'DISMISS_DIALOGUE');
function visit(state, id) {
  const object = ADVENTURE_REGIONS[state.locationId].objects.find(entry => entry.id === id);
  assert.ok(object, `${state.locationId}/${id} exists`);
  const queue = [{ x: state.x, y: state.y, path: [] }];
  const seen = new Set([`${state.x},${state.y}`]);
  for (const point of queue) {
    if (Math.abs(point.x - object.x) + Math.abs(point.y - object.y) <= 1) {
      let next = state;
      for (const [dx, dy] of point.path) next = act(next, 'MOVE', { dx, dy });
      const dx = object.x - next.x; const dy = object.y - next.y;
      if (dx || dy) next = { ...next, facing: dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up' };
      if (nearbyInteractable(next)?.id === id) return act(next, 'INTERACT');
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = point.x + dx; const y = point.y + dy; const key = `${x},${y}`;
      if (!seen.has(key) && isAdventureWalkable(state, x, y)) { seen.add(key); queue.push({ x, y, path: [...point.path, [dx, dy]] }); }
    }
  }
  assert.fail(`No walkable route to ${state.locationId}/${id}`);
}
function resume(state) {
  const loaded = fromAdventureSave(toAdventureSave(state));
  assert.ok(loaded, 'progress saves without a chapter prerequisite');
  return loaded;
}
function repairFerry(state) {
  state = visit(state, 'riverlands-gate');
  state = visit(state, 'amber-mill-door');
  state = resume(dismiss(visit(state, 'mill-maintenance')));
  state = visit(state, 'amber-mill-exit');
  state = visit(state, 'frontier-gate');
  state = visit(state, 'lantern-workshop-door');
  state = resume(dismiss(visit(state, 'workshop-smith')));
  state = visit(state, 'lantern-workshop-exit');
  state = visit(state, 'riverlands-gate');
  state = visit(state, 'amber-mill-door');
  state = resume(dismiss(visit(state, 'mill-inspection-hatch')));
  const inventory = { ...state.inventory };
  state = dismiss(visit(state, 'mill-inspection-hatch'));
  assert.deepEqual(state.inventory, inventory, 'repair rewards are not farmable');
  state = visit(state, 'amber-mill-exit');
  state = visit(state, 'canal-ferry');
  assert.equal(state.locationId, 'frontier');
  state = visit(state, 'canal-ferry');
  assert.equal(state.locationId, 'riverlands');
  return visit(state, 'canal-ferry');
}
function repairLift(state) {
  state = visit(state, 'grove-gate');
  state = visit(state, 'sunward-gate');
  for (const id of ['routekeeper', 'wind-marker', 'keeper-lens', 'routekeeper']) state = resume(dismiss(visit(state, id)));
  state = visit(state, 'beacon-lift');
  assert.equal(state.locationId, 'frontier');
  state = visit(state, 'beacon-lift');
  assert.equal(state.locationId, 'sunward');
  return visit(state, 'beacon-lift');
}

test('a fresh Journey can walk the full outdoor ring in both directions', () => {
  for (const route of [
    ['grove-gate', 'sunward-gate', 'highlands-gate', 'orchard-gate', 'riverlands-gate', 'frontier-gate'],
    ['riverlands-gate', 'orchard-gate', 'highlands-gate', 'sunward-gate', 'grove-gate', 'frontier-gate'],
  ]) {
    let state = createAdventure();
    for (const id of route) state = resume(visit(state, id));
    assert.equal(state.locationId, 'frontier');
    assert.equal(state.discoveries.length, 6);
    assert.equal(state.flags.questStarted, false);
    assert.equal(state.flags.wispDefeated, false);
    const blocked = visit(state, 'archive-gate');
    assert.equal(blocked.locationId, 'frontier');
    assert.match(blocked.dialogue.text, /Static Wisp/);
  }
});

test('the orchard footpath adds a reciprocal choice beyond the river road', () => {
  let state = visit(createAdventure(), 'grove-gate');
  state = resume(visit(state, 'orchard-footpath'));
  assert.equal(state.locationId, 'orchard');
  state = resume(visit(state, 'grove-footpath'));
  assert.equal(state.locationId, 'grove');
});

for (const first of ['ferry', 'lift']) test(`world projects complete independently, ${first} first`, () => {
  let state = createAdventure();
  for (const id of ['canal-ferry', 'beacon-lift']) {
    const blocked = visit(state, id);
    assert.equal(blocked.locationId, 'frontier');
    assert.ok(blocked.dialogue);
  }
  state = (first === 'ferry' ? repairFerry : repairLift)(state);
  assert.equal(state.flags.wheelRepaired, first === 'ferry');
  assert.equal(state.flags.lensReturned, first === 'lift');
  assert.equal(worldProjectProgress(state).filter(project => project.complete).length, 1);
  state = (first === 'ferry' ? repairLift : repairFerry)(state);
  state = resume(state);
  assert.ok(worldProjectProgress(state).every(project => project.complete));
  assert.equal(state.flags.questStarted, false);
  assert.equal(state.flags.wispDefeated, false);
  assert.equal(state.team[0].xp, 0);
  const nested = resume(act(state, 'START_PRACTICE'));
  assert.ok(nested.returnJourney.flags.wheelRepaired && nested.returnJourney.flags.lensReturned);
});

test('project targets exist, transport endpoints preserve tiles, and both ends share the lock', () => {
  const state = createAdventure();
  for (const project of WORLD_PROJECTS) for (const stage of project.stages) {
    assert.ok(ADVENTURE_REGIONS[stage.regionId].objects.some(object => object.id === stage.objectId));
  }
  for (const region of Object.values(ADVENTURE_REGIONS)) for (const object of region.objects.filter(entry => entry.transport || entry.id.endsWith('footpath'))) {
    const local = { ...state, locationId: region.id, x: object.x, y: object.y, discoveries: [...new Set(['frontier', region.id])] };
    assert.ok(isAdventureWalkable(local, object.x, object.y));
    assert.ok(resume(local));
    assert.ok(isAdventureWalkable({ ...state, locationId: object.to }, object.entry.x, object.entry.y));
    if (object.transport) {
      assert.equal(exitLocked(state, object), true);
      assert.equal(exitLocked({ ...state, flags: { ...state.flags, [object.requiresFlag]: true } }, object), false);
    }
  }
});
