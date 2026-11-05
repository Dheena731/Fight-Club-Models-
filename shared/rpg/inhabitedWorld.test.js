import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_REGIONS } from './adventureContent.js';
import { TOWN_FLAG_IDS, TOWN_QUESTS } from './inhabitedContent.js';
import { createAdventure, adventureReducer, isAdventureWalkable, nearbyInteractable } from './adventure.js';
import { toAdventureSave, fromAdventureSave } from './adventureSave.js';

const steps = [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']];
const dismiss = state => adventureReducer(state, { type: 'DISMISS_DIALOGUE' });

test('furnished streets keep every resident and door reachable while physical props block walking', () => {
  for (const region of Object.values(ADVENTURE_REGIONS)) {
    const state = { ...createAdventure(), locationId: region.id, ...region.spawn };
    assert.ok(isAdventureWalkable(state, state.x, state.y), region.id);
    const queue = [{ x: state.x, y: state.y }]; const seen = new Set([`${state.x},${state.y}`]);
    for (const point of queue) for (const [dx, dy] of steps) {
      const x = point.x + dx; const y = point.y + dy; const key = `${x},${y}`;
      if (!seen.has(key) && isAdventureWalkable(state, x, y)) { seen.add(key); queue.push({ x, y }); }
    }
    for (const object of region.objects) {
      assert.ok(steps.some(([dx, dy]) => seen.has(`${object.x + dx},${object.y + dy}`)), `${region.id}/${object.id}`);
      if (object.type === 'exit') assert.ok(isAdventureWalkable({ ...state, locationId: object.to }, object.entry.x, object.entry.y), object.id);
    }
    for (const solid of region.solid.filter(entry => entry.kind === 'furniture')) {
      for (let y = solid.y; y < solid.y + solid.h; y++) for (let x = solid.x; x < solid.x + solid.w; x++) assert.equal(isAdventureWalkable(state, x, y), false);
    }
  }
});
function interact(state, id) {
  const object = ADVENTURE_REGIONS[state.locationId].objects.find(o => o.id === id);
  assert.ok(object, `exists ${state.locationId}/${id}`);
  const queue = [{ x: state.x, y: state.y, path: [] }];
  const seen = new Set([`${state.x},${state.y}`]);
  for (const point of queue) {
    const toward = steps.find(([dx, dy]) => point.x + dx === object.x && point.y + dy === object.y);
    if (toward) {
      let arrived = state;
      for (const [dx, dy] of point.path) {
        const next = adventureReducer(arrived, { type: 'MOVE', dx, dy });
        assert.deepEqual([next.x, next.y], [arrived.x + dx, arrived.y + dy], `walk toward ${id}`);
        arrived = next;
      }
      arrived = { ...arrived, facing: toward[2] };
      assert.equal(nearbyInteractable(arrived)?.id, id);
      return adventureReducer(arrived, { type: 'INTERACT' });
    }
    for (const [dx, dy] of steps) {
      const x = point.x + dx; const y = point.y + dy; const key = `${x},${y}`;
      if (!seen.has(key) && isAdventureWalkable(state, x, y)) { seen.add(key); queue.push({ x, y, path: [...point.path, [dx, dy]] }); }
    }
  }
  assert.fail(`No path to ${state.locationId}/${id}`);
}
function travel(state, destination) {
  const queue = [{ id: state.locationId, path: [] }];
  const seen = new Set([state.locationId]);
  for (const place of queue) {
    if (place.id === destination) {
      for (const id of place.path) state = interact(state, id);
      assert.equal(state.locationId, destination);
      return state;
    }
    for (const exit of ADVENTURE_REGIONS[place.id].objects.filter(o => o.type === 'exit')) {
      if (seen.has(exit.to) || !state.flags.wispDefeated && ['archive', 'sunward'].includes(exit.to)) continue;
      seen.add(exit.to); queue.push({ id: exit.to, path: [...place.path, exit.id] });
    }
  }
  assert.fail(`No safe route to ${destination}`);
}
function save(state) {
  const loaded = fromAdventureSave(toAdventureSave(state));
  assert.ok(loaded, `save/resume in ${state.locationId}`);
  assert.deepEqual([loaded.locationId, loaded.x, loaded.y], [state.locationId, state.x, state.y]);
  return loaded;
}

test('all ten furnished interiors can be reached on foot, saved and left before the Wisp', () => {
  let state = createAdventure();
  for (const region of Object.values(ADVENTURE_REGIONS).filter(r => r.outdoor === false)) {
    state = save(travel(state, region.id));
    for (const object of region.objects.filter(o => o.type !== 'exit' && !o.task && !o.service)) state = dismiss(interact(state, object.id));
    const exit = region.objects.find(o => o.type === 'exit');
    state = save(interact(state, exit.id));
    assert.equal(state.locationId, region.parentRegion);
    assert.equal(state.flags.wispDefeated, false);
  }
});

test('three errands enforce order, survive saves and reward once without chapter XP', () => {
  let state = createAdventure();
  const initial = { potion: state.inventory.potion, ether: state.inventory.ether, xp: state.team[0].xp };
  const stages = Object.values(ADVENTURE_REGIONS).flatMap(region => region.objects.filter(o => o.task).map(object => ({ regionId: region.id, object })));
  for (const quest of TOWN_QUESTS) {
    const final = stages.find(entry => entry.object.task.flag === quest.stages.at(-1).flag);
    state = dismiss(interact(travel(state, final.regionId), final.object.id));
    assert.equal(state.flags[final.object.task.flag], false, `${quest.id} completion cannot be skipped`);
    for (const stage of quest.stages) {
      const found = stages.find(entry => entry.object.task.flag === stage.flag);
      state = save(dismiss(interact(travel(state, found.regionId), found.object.id)));
      assert.equal(state.flags[stage.flag], true);
    }
    const inventory = { ...state.inventory };
    state = dismiss(interact(state, final.object.id));
    assert.deepEqual(state.inventory, inventory, `${quest.id} reward only once`);
  }
  assert.equal(state.inventory.potion, initial.potion + 4);
  assert.equal(state.inventory.ether, initial.ether + 3);
  assert.equal(state.team[0].xp, initial.xp);
  assert.equal(state.flags.questStarted, false);
});

test('town flags migrate only as a complete absent group, including nested Journey', () => {
  const base = createAdventure();
  const old = toAdventureSave({ ...base, x: 12, y: 11 });
  for (const flag of TOWN_FLAG_IDS) delete old.flags[flag];
  const loaded = fromAdventureSave(old);
  assert.ok(loaded);
  assert.deepEqual([loaded.x, loaded.y], [12, 11]);
  assert.ok(TOWN_FLAG_IDS.every(flag => loaded.flags[flag] === false));
  for (const mutation of [
    value => { delete value.flags.breadCollected; },
    value => { value.flags.breadDelivered = true; },
    value => { value.flags.wheelRepaired = true; },
    value => { value.flags.recipeReturned = true; },
  ]) {
    const candidate = toAdventureSave(base); mutation(candidate);
    assert.equal(fromAdventureSave(candidate), null);
  }
  const nested = toAdventureSave(adventureReducer(base, { type: 'START_PRACTICE' }));
  for (const flag of TOWN_FLAG_IDS) { delete nested.flags[flag]; delete nested.returnJourney.flags[flag]; }
  assert.ok(fromAdventureSave(nested)?.returnJourney);
});

test('recovery services restore health and energy without restocking supplies', () => {
  let state = travel(createAdventure(), 'field-clinic');
  const inventory = { ...state.inventory };
  state = { ...state, team: state.team.map(member => ({ ...member, hp: 1, energy: 0 })) };
  state = dismiss(interact(state, 'clinic-nurse'));
  assert.ok(state.team.every(member => member.hp === member.maxHp && member.energy === member.maxEnergy));
  assert.deepEqual(state.inventory, inventory);
  save(state);
});
