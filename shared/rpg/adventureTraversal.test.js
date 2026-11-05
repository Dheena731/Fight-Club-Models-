import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_REGIONS, EXPLORATION_FLAG_IDS, MAP_REVISION, SUNWARD_FLAG_IDS, terrainAt, TRAVERSAL_DURATION_MS } from './adventureContent.js';
import { adventureObjective, adventureReducer, availableTraversal, beginBattle, createAdventure, isAdventureWalkable, nearbyInteractable, sideObjective, unlockedRewardIds } from './adventure.js';
import { fromAdventureSave, toAdventureSave } from './adventureSave.js';

const act = (state, type, extra = {}) => adventureReducer(state, { type, ...extra });

test('Keeper’s Trail leads follow recorded memories before combat and acknowledge completion', () => {
  const initial = createAdventure();
  for (const regionId of ['riverlands', 'orchard', 'highlands']) {
    let state = { ...initial, locationId: regionId, flags: { ...initial.flags } };
    const objects = ADVENTURE_REGIONS[regionId].objects.filter(object => object.discoveryFlag);
    const prompts = new Set();
    for (const object of objects) {
      const prompt = sideObjective(state);
      assert.match(prompt, /Optional · Keeper’s Trail:/);
      assert.doesNotMatch(prompt, /\b(column|row)\b|\d+,\s*\d+/i, 'clues do not expose secret coordinates');
      prompts.add(prompt);
      state = { ...state, flags: { ...state.flags, [object.discoveryFlag]: true } };
    }
    assert.equal(prompts.size, 3, 'each memory advances the local lead');
    assert.match(sideObjective(state), /3\/9 memories/);
    assert.deepEqual(state.inventory, initial.inventory);
    assert.deepEqual(state.team, initial.team);
    const complete = { ...state, flags: { ...state.flags, ...Object.fromEntries(EXPLORATION_FLAG_IDS.map(flag => [flag, true])) } };
    assert.match(sideObjective(complete), /Keeper’s Trail complete: nine memories/);
    assert.equal(sideObjective({ ...complete, mode: 'practice' }), null);
    assert.equal(sideObjective({ ...complete, mode: 'circuit' }), null);
  }
  assert.match(sideObjective(initial), /Sunward Pass/);
  assert.match(sideObjective({ ...initial, locationId: 'sunward', flags: { ...initial.flags, wispDefeated: true } }), /speak to Sela/);
});
const afterWisp = () => {
  const state = createAdventure();
  return { ...state, flags: { ...state.flags, questStarted: true, shardFound: true, wispDefeated: true }, inventory: { ...state.inventory, 'signal-shard': 1, 'clear-circuit': 1 } };
};
function walkToObject(state, id) {
  const object = ADVENTURE_REGIONS[state.locationId].objects.find(entry => entry.id === id);
  assert.ok(object, `${state.locationId}/${id}`);
  const queue = [{ x: state.x, y: state.y, path: [] }];
  const seen = new Set([`${state.x},${state.y}`]);
  for (const point of queue) {
    if (Math.abs(point.x - object.x) + Math.abs(point.y - object.y) <= 1) {
      let next = state;
      for (const [dx, dy] of point.path) next = act(next, 'MOVE', { dx, dy });
      if (nearbyInteractable(next)?.id === id) return act(next, 'INTERACT');
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = point.x + dx; const y = point.y + dy; const key = `${x},${y}`;
      if (!seen.has(key) && isAdventureWalkable(state, x, y)) { seen.add(key); queue.push({ x, y, path: [...point.path, [dx, dy]] }); }
    }
  }
  assert.fail(`No walking route to ${state.locationId}/${id}`);
}
const inspect = (state, id) => {
  const next = walkToObject(state, id);
  assert.ok(next.dialogue, `inspect ${id}`);
  return act(next, 'DISMISS_DIALOGUE');
};
const resume = state => {
  const next = fromAdventureSave(toAdventureSave(state));
  assert.ok(next);
  return next;
};
function withoutExploration(snapshot) {
  for (const id of EXPLORATION_FLAG_IDS) delete snapshot.flags[id];
  if (snapshot.returnJourney) withoutExploration(snapshot.returnJourney);
  return snapshot;
}

test('terrain follows authored order: water blocks walking and bridge overrides make both crossings safe', () => {
  assert.equal(terrainAt('missing', 1, 1), null);
  assert.equal(terrainAt('__proto__', 1, 1), null);
  assert.equal(terrainAt('frontier', 1, 1), 'grass');
  assert.equal(terrainAt('frontier', 12, 10), 'dirt');
  assert.equal(terrainAt('archive', 13, 13), 'stone');
  const state = { ...createAdventure(), locationId: 'riverlands' };
  assert.equal(terrainAt('riverlands', 27, 20), 'water');
  assert.equal(isAdventureWalkable(state, 27, 20), false);
  for (const y of [13, 29]) for (let x = 24; x < 32; x++) {
    assert.equal(terrainAt('riverlands', x, y), 'bridge');
    assert.equal(isAdventureWalkable(state, x, y), true);
  }
});

test('the entire seven-region loop is walkable and nine discoveries preserve chapter progress and balance', () => {
  let state = afterWisp();
  const objective = adventureObjective(state); const xp = state.team[0].xp; const inventory = { ...state.inventory }; const rewards = unlockedRewardIds(state);
  state = walkToObject(state, 'riverlands-gate');
  assert.equal(state.locationId, 'riverlands');
  for (const id of ['river-waystone', 'river-mailbox', 'mill-wheel', 'waterfall-view', 'river-cache']) state = resume(inspect(state, id));
  state = walkToObject(state, 'orchard-gate');
  assert.equal(state.locationId, 'orchard');
  for (const id of ['cottage-mailbox', 'upper-mailbox', 'kitchen-garden', 'orchard-cache']) state = resume(inspect(state, id));
  state = walkToObject(state, 'highlands-gate');
  assert.equal(state.locationId, 'highlands');
  for (const id of ['ruins-tablet', 'observatory-telescope', 'highland-cache']) state = resume(inspect(state, id));
  assert.ok(EXPLORATION_FLAG_IDS.every(id => state.flags[id]));
  state = walkToObject(state, 'sunward-gate');
  assert.equal(state.locationId, 'sunward');
  state = walkToObject(state, 'grove-gate');
  state = walkToObject(state, 'frontier-gate');
  state = walkToObject(state, 'archive-gate');
  state = resume(state);
  assert.equal(state.discoveries.length, 7);
  assert.equal(adventureObjective(state), objective);
  assert.equal(state.team[0].xp, xp);
  assert.deepEqual(state.inventory, inventory);
  assert.deepEqual(unlockedRewardIds(state), rewards);
  assert.equal(state.flags.bossDefeated, false);
});

test('the river route reaches Sunward before story combat', () => {
  let state = walkToObject(createAdventure(), 'riverlands-gate');
  state = inspect(state, 'river-cache');
  state = walkToObject(state, 'orchard-gate');
  state = inspect(state, 'cottage-mailbox');
  state = walkToObject(state, 'highlands-gate');
  state = inspect(state, 'observatory-telescope');
  state = walkToObject(state, 'sunward-gate');
  assert.equal(state.locationId, 'sunward');
  assert.equal(state.dialogue, null);
  assert.ok(resume(state));
  assert.equal(state.flags.questStarted, false);
});

test('the directed traversal graph reaches each shortcut and crosses real obstructions', () => {
  for (const region of Object.values(ADVENTURE_REGIONS)) {
    if (!region.traversals) continue;
    const state = { ...afterWisp(), locationId: region.id, ...region.spawn };
    const queue = [region.spawn]; const seen = new Set([`${state.x},${state.y}`]);
    for (const point of queue) {
      const destinations = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: point.x + dx, y: point.y + dy }));
      for (const link of region.traversals) if (link.from.x === point.x && link.from.y === point.y) destinations.push(link.to);
      for (const next of destinations) {
        const key = `${next.x},${next.y}`;
        if (!seen.has(key) && isAdventureWalkable(state, next.x, next.y)) { seen.add(key); queue.push(next); }
      }
    }
    for (const link of region.traversals) {
      assert.ok(seen.has(`${link.from.x},${link.from.y}`), link.id);
      assert.ok(seen.has(`${link.to.x},${link.to.y}`), link.id);
      const dx = Math.sign(link.to.x - link.from.x); const dy = Math.sign(link.to.y - link.from.y);
      let blocked = false;
      for (let x = link.from.x + dx, y = link.from.y + dy; x !== link.to.x || y !== link.to.y; x += dx, y += dy) blocked ||= !isAdventureWalkable(state, x, y);
      assert.ok(blocked, `${link.id} crosses water or a cliff`);
      const source = { ...state, ...link.from, facing: link.facing };
      assert.equal(availableTraversal(source)?.id, link.id);
      const moved = act(source, 'TRAVERSE', { id: link.id, to: { x: 500, y: 500 } });
      assert.deepEqual([moved.x, moved.y], [link.to.x, link.to.y], 'only authored destination is used');
      assert.deepEqual(moved.traversal, { id: link.id, kind: link.kind, from: link.from, to: link.to });
      assert.ok(TRAVERSAL_DURATION_MS[link.kind] > 0);
      assert.equal(act(moved, 'END_TRAVERSAL', { id: 'wrong' }), moved);
      assert.equal(act(moved, 'END_TRAVERSAL', { id: link.id }).traversal, null);
    }
  }
});

test('traversal rejects free leaps, wrong facing, unknown IDs, overlays and blocked canonical landings', () => {
  const link = ADVENTURE_REGIONS.orchard.traversals[0];
  const state = { ...afterWisp(), locationId: 'orchard', ...link.from, facing: link.facing };
  assert.equal(act(state, 'TRAVERSE', { id: 'invented-jump' }), state);
  for (const changed of [
    { x: state.x + 1 }, { facing: 'down' }, { mode: 'practice' }, { dialogue: {} }, { battle: {} }, { result: {} }, { puzzle: {} }, { transition: 'arena' },
  ]) {
    const blocked = { ...state, ...changed };
    assert.equal(availableTraversal(blocked), null);
    assert.equal(act(blocked, 'TRAVERSE'), blocked);
  }
  const landingBlocker = { id: 'test-landing-blocker', type: 'sign', ...link.to };
  ADVENTURE_REGIONS.orchard.objects.push(landingBlocker);
  try { assert.equal(act(state, 'TRAVERSE'), state); } finally { ADVENTURE_REGIONS.orchard.objects.pop(); }
  const ledge = ADVENTURE_REGIONS.highlands.traversals.find(entry => entry.kind === 'ledge');
  const below = { ...afterWisp(), locationId: 'highlands', ...ledge.to, facing: 'up' };
  assert.equal(availableTraversal(below), null, 'a one-way ledge cannot become an invented climb');
});

test('an active traversal blocks controls and saves its canonical destination without transient animation data', () => {
  const link = ADVENTURE_REGIONS.riverlands.traversals[0];
  const state = { ...afterWisp(), locationId: 'riverlands', discoveries: ['frontier', 'riverlands'], ...link.from, facing: link.facing };
  const moved = act(state, 'TRAVERSE');
  for (const action of [
    { type: 'MOVE', dx: 1, dy: 0 }, { type: 'INTERACT' }, { type: 'START_PRACTICE' }, { type: 'START_CIRCUIT' }, { type: 'EXIT_MODE' }, { type: 'USE_ITEM', itemId: 'potion' }, { type: 'TRAVERSE' },
  ]) assert.equal(adventureReducer(moved, action), moved);
  const snapshot = toAdventureSave(moved);
  assert.equal(Object.hasOwn(snapshot, 'traversal'), false);
  const resumed = fromAdventureSave(snapshot);
  assert.deepEqual([resumed.x, resumed.y], [link.to.x, link.to.y]);
  assert.equal(resumed.traversal, null);
  assert.notEqual(act(resumed, 'MOVE', { dx: 1, dy: 0 }), resumed);
});

test('old revision-2 and nested saves add only the complete discovery flag group, preserving run and battle state', () => {
  for (const [locationId, x, y] of [['frontier', 25, 15], ['sunward', 33, 16]]) {
    const state = { ...afterWisp(), locationId, x, y, discoveries: ['frontier', ...(locationId === 'frontier' ? [] : [locationId])] };
    const loaded = fromAdventureSave(withoutExploration(toAdventureSave(state)));
    assert.ok(loaded);
    assert.equal(loaded.mapRevision, MAP_REVISION);
    assert.equal(loaded.runId, state.runId);
    assert.deepEqual([loaded.x, loaded.y], [x, y]);
    assert.equal(terrainAt(locationId, x, y), 'dirt', 'the new gate lies on its connected road');
    assert.equal(terrainAt(locationId, x - 1, y), 'dirt', 'the approach to the new gate follows the road');
    assert.ok(EXPLORATION_FLAG_IDS.every(id => loaded.flags[id] === false));
  }
  const nested = act(afterWisp(), 'START_CIRCUIT');
  const restored = fromAdventureSave(withoutExploration(toAdventureSave(nested)));
  assert.equal(restored.returnJourney.runId, nested.returnJourney.runId);
  assert.deepEqual(restored.returnJourney.flags, nested.returnJourney.flags);
  let battling = { ...createAdventure(), locationId: 'grove', discoveries: ['frontier', 'grove'], x: 22, y: 8 };
  battling.flags = { ...battling.flags, questStarted: true, shardFound: true };
  battling.inventory['signal-shard'] = 1;
  battling = act(beginBattle(battling, 'static-wisp'), 'BATTLE_MOVE', { moveId: 'strike' });
  const resumed = fromAdventureSave(withoutExploration(toAdventureSave(battling)));
  assert.equal(resumed.battle.turn, battling.battle.turn);
  assert.equal(resumed.battle.enemy.hp, battling.battle.enemy.hp);
  assert.deepEqual(resumed.team, battling.team);
  const preSunward = withoutExploration(toAdventureSave(createAdventure()));
  for (const id of SUNWARD_FLAG_IDS) delete preSunward.flags[id];
  delete preSunward.inventory['keeper-lens'];
  assert.ok(fromAdventureSave(preSunward), 'both historical extension groups migrate together');
});

test('partially missing discovery flags and missing old required fields fail closed', () => {
  const saved = toAdventureSave(createAdventure());
  for (const mutate of [
    value => { delete value.flags.millWheelSeen; },
    value => { value.flags.gardenFound = 'yes'; },
    value => { delete value.flags.questStarted; },
    value => { delete value.inventory.ether; },
  ]) { const copy = structuredClone(saved); mutate(copy); assert.equal(fromAdventureSave(copy), null); }
  const old = withoutExploration(structuredClone(saved)); delete old.flags.shardFound;
  assert.equal(fromAdventureSave(old), null);
});
