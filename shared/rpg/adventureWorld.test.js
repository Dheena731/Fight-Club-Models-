import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_REGIONS, MAP_REVISION, STARTER_IDS, SUNWARD_FLAG_IDS } from './adventureContent.js';
import { activeCompanion, adventureObjective, adventureReducer, battleIntent, createAdventure, isAdventureWalkable, nearbyInteractable, regionObjects, sideObjective, unlockedRewardIds } from './adventure.js';
import { fromAdventureSave, toAdventureSave } from './adventureSave.js';

const act = (state, type, extra = {}) => adventureReducer(state, { type, ...extra });
const dismiss = state => act(state, 'DISMISS_DIALOGUE');
const resume = state => {
  const saved = fromAdventureSave(toAdventureSave(state));
  assert.ok(saved, 'the current world progress can be saved and resumed');
  return saved;
};
function visit(state, id) {
  const object = ADVENTURE_REGIONS[state.locationId].objects.find(entry => entry.id === id);
  assert.ok(object);
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
  assert.fail(`No reachable interaction: ${state.locationId}/${id}`);
}
function clearWisp(starterId = 'emberquill') {
  let state = dismiss(visit(createAdventure({ starterId }), 'guide'));
  state = visit(state, 'grove-gate');
  state = dismiss(visit(state, 'shard'));
  state = visit(state, 'static');
  while (state.battle) {
    const member = activeCompanion(state);
    state = act(state, 'BATTLE_MOVE', { moveId: battleIntent(state).damage >= 12 ? 'ward' : member.energy >= 3 ? 'overcharge' : 'strike' });
  }
  assert.equal(state.result.outcome, 'won');
  return act(state, 'CONTINUE_RESULT');
}
function stripSunwardFields(snapshot) {
  for (const id of SUNWARD_FLAG_IDS) delete snapshot.flags[id];
  delete snapshot.inventory['keeper-lens'];
  if (snapshot.returnJourney) stripSunwardFields(snapshot.returnJourney);
  return snapshot;
}

test('the optional trail opens after the Wisp and does not change the main objective', () => {
  let state = visit(createAdventure(), 'grove-gate');
  assert.equal(sideObjective(state), null);
  state = visit(state, 'sunward-gate');
  assert.equal(state.locationId, 'grove');
  assert.match(state.dialogue.text, /Quiet the Wisp/);
  state = clearWisp();
  const objective = adventureObjective(state);
  state = visit(state, 'sunward-gate');
  assert.equal(state.locationId, 'sunward');
  assert.equal(adventureObjective(state), objective);
  assert.equal(sideObjective(state), 'Optional: speak to Sela at the western trailhead.');
  state = dismiss(visit(state, 'keeper-lens'));
  assert.equal(state.flags.lensRecovered, false, 'the clue cannot be skipped');
});

for (const starterId of STARTER_IDS) test(`Sunward clue, loop, discovery and one-time useful reward: ${starterId}`, () => {
  let state = visit(clearWisp(starterId), 'sunward-gate');
  const before = { ...state.inventory }; const xp = state.team[0].xp; const rewards = unlockedRewardIds(state);
  state = resume(dismiss(visit(state, 'routekeeper')));
  assert.match(sideObjective(state), /Wind Marker/);
  state = resume(dismiss(visit(state, 'wind-marker')));
  assert.match(sideObjective(state), /northern ridge east/);
  state = resume(dismiss(visit(state, 'keeper-lens')));
  assert.equal(state.inventory['keeper-lens'], 1);
  assert.equal(regionObjects(state).some(object => object.id === 'keeper-lens'), false);
  assert.match(sideObjective(state), /return/);
  state = resume(dismiss(visit(state, 'routekeeper')));
  assert.equal(state.flags.lensReturned, true);
  assert.equal(state.inventory['keeper-lens'], 0);
  assert.equal(state.inventory.potion, before.potion + 2);
  assert.equal(state.inventory.ether, before.ether + 1);
  const rewarded = { ...state.inventory };
  state = dismiss(visit(state, 'routekeeper'));
  assert.deepEqual(state.inventory, rewarded);
  state = dismiss(visit(state, 'pass-memorial'));
  state = resume(dismiss(visit(state, 'sunward-overlook')));
  assert.equal(state.flags.overlookFound, true);
  assert.equal(sideObjective(state), null);
  assert.equal(state.team[0].xp, xp, 'the detour leaves chapter XP balance intact');
  assert.deepEqual(unlockedRewardIds(state), rewards, 'no fabricated cosmetic unlocks');
  state = visit(state, 'grove-gate');
  state = visit(state, 'frontier-gate');
  state = resume(visit(state, 'archive-gate'));
  assert.equal(state.discoveries.length, 4);
  assert.equal(state.flags.lensReturned, true);
  assert.equal(state.flags.questComplete, false);
  state = dismiss(visit(state, 'archive-note'));
  assert.equal(state.flags.noteRead, true, 'the detour rejoins the existing chapter');
});

test('pre-Sunward revision-2 saves keep coordinates, run identity, battle and nested Journey', () => {
  const state = { ...createAdventure(), locationId: 'grove', x: 25, y: 10, discoveries: ['frontier', 'grove'] };
  const old = stripSunwardFields(toAdventureSave(state));
  const loaded = fromAdventureSave(old);
  assert.ok(loaded);
  assert.equal(loaded.mapRevision, MAP_REVISION);
  assert.equal(loaded.runId, state.runId);
  assert.deepEqual([loaded.x, loaded.y], [25, 10], 'the new passable trailhead never resets an old position');
  assert.ok(SUNWARD_FLAG_IDS.every(id => loaded.flags[id] === false));
  const practice = act(clearWisp(), 'START_PRACTICE');
  const nested = fromAdventureSave(stripSunwardFields(toAdventureSave(practice)));
  assert.ok(nested?.battle);
  assert.deepEqual([nested.returnJourney.x, nested.returnJourney.y], [practice.returnJourney.x, practice.returnJourney.y]);
  assert.equal(nested.returnJourney.runId, practice.returnJourney.runId);
  const original = dismiss(visit(createAdventure(), 'guide'));
  let fighting = visit(original, 'grove-gate');
  fighting = visit(dismiss(visit(fighting, 'shard')), 'static');
  fighting = act(fighting, 'BATTLE_MOVE', { moveId: 'strike' });
  const battle = fromAdventureSave(stripSunwardFields(toAdventureSave(fighting)));
  assert.equal(battle.battle.turn, fighting.battle.turn);
  assert.equal(battle.battle.enemy.hp, fighting.battle.enemy.hp);
  assert.deepEqual([battle.x, battle.y], [fighting.x, fighting.y]);
});

test('Sunward save defaults never repair partial/corrupt new or old required fields', () => {
  const original = toAdventureSave(createAdventure());
  for (const mutate of [
    value => { delete value.flags.questStarted; },
    value => { delete value.inventory.ether; },
    value => { delete value.flags.windClueRead; },
    value => { delete value.inventory['keeper-lens']; },
    value => { value.flags.lensReturned = true; },
    value => { value.inventory['keeper-lens'] = 1; },
    value => { value.flags.overlookFound = true; },
  ]) {
    const candidate = structuredClone(original); mutate(candidate);
    assert.equal(fromAdventureSave(candidate), null);
  }
  const old = stripSunwardFields(structuredClone(original)); delete old.flags.shardFound;
  assert.equal(fromAdventureSave(old), null);
});

test('blocked movement turns toward a landmark without crossing terrain or the field border', () => {
  const state = { ...createAdventure(), x: 1, y: 10, facing: 'right' };
  const turned = act(state, 'MOVE', { dx: -1, dy: 0 });
  assert.deepEqual([turned.x, turned.y], [1, 10]);
  assert.equal(turned.facing, 'left');
  assert.equal(act(turned, 'MOVE', { dx: -1, dy: 0 }), turned);
});
