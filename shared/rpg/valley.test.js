import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_REGIONS } from './adventureContent.js';
import { adventureReducer, beginBattle, createAdventure, isAdventureWalkable, unlockedRewardIds, valleyProgress } from './adventure.js';
import { fromAdventureSave, toAdventureSave } from './adventureSave.js';
import { adventureRoute, mapLandmarks } from './adventureNavigation.js';
import { VALLEY_FLAG_IDS, VALLEY_PROJECTS, VALLEY_PUZZLES } from './valleyContent.js';

const act = (state, type, extra = {}) => adventureReducer(state, { type, ...extra });
function visit(state, regionId, objectId) {
  const object = ADVENTURE_REGIONS[regionId].objects.find(entry => entry.id === objectId);
  state = { ...state, locationId: regionId, x: object.x - 1, y: object.y, facing: 'right', discoveries: [...new Set([...state.discoveries, regionId])], dialogue: null, result: null };
  return act(state, 'INTERACT');
}
function solve(state, id) {
  for (const choice of VALLEY_PUZZLES[id].sequence) state = act(state, 'VALLEY_CHOICE', { choice });
  return state;
}
function win(state) {
  while (state.battle) state = act(state, 'BATTLE_MOVE', { moveId: state.battle.enemy.intent.id === 'surge' ? 'ward' : 'strike' });
  assert.equal(state.result.outcome, 'won');
  return state;
}
test('fieldworks, guarded battles, finale and rewards are ordered and one-time', () => {
  let s = createAdventure();
  s = visit(s, 'grove', 'bramble-sentinel'); assert.equal(s.battle, null);
  s = visit(s, 'grove', 'grove-inscription'); s = visit(s, 'grove', 'grove-dial');
  s = act(s, 'VALLEY_CHOICE', { choice: 'leaf' }); assert.equal(s.puzzle.step, 0);
  s = solve(s, 'grove'); s = visit(s, 'grove', 'bramble-sentinel');
  assert.ok(fromAdventureSave(toAdventureSave(s)).battle);
  const sameTile = { ...s, x: s.x + 1 };
  assert.ok(fromAdventureSave(toAdventureSave(sameTile)).battle);
  const invalidBattle = toAdventureSave(s); invalidBattle.flags.groveDial = false;
  assert.equal(fromAdventureSave(invalidBattle), null);
  s = act(s, 'RETREAT'); assert.equal(s.flags.groveStamp, false);
  s = visit(s, 'grove', 'bramble-sentinel'); s = win(s); assert.ok(fromAdventureSave(toAdventureSave(s)).result);
  s = visit(s, 'sunward', 'dawn-etching'); s = visit(s, 'sunward', 'heliograph'); s = solve(s, 'sunward');
  s = visit(s, 'riverlands', 'sluice-ledger'); s = visit(s, 'riverlands', 'upstream-gate'); s = visit(s, 'riverlands', 'downstream-gate'); s = visit(s, 'riverlands', 'tideglass-crab'); s = win(s);
  s = visit(s, 'orchard', 'orchard-beehive'); s = visit(s, 'orchard', 'blossom-bed'); s = visit(s, 'orchard', 'orchard-beehive');
  s = visit(s, 'highlands', 'star-chart'); s = visit(s, 'highlands', 'star-crater'); s = solve(s, 'highlands'); s = visit(s, 'highlands', 'starfall-ram'); s = win(s);
  assert.equal(valleyProgress(s).filter(p => p.complete).length, 5);
  s = visit(s, 'frontier', 'festival-lantern'); assert.equal(s.flags.valleyComplete, false);
  s.flags = { ...s.flags, questStarted: true, shardFound: true, wispDefeated: true, noteRead: true, relayRestored: true, bossDefeated: true, questComplete: true };
  s = visit(s, 'frontier', 'festival-lantern'); assert.equal(s.flags.valleyComplete, true);
  assert.deepEqual(fromAdventureSave(toAdventureSave(s)).result.rewards, ['badge-valley-almanac', 'title-valley-keeper']);
  const xp = s.team[0].xp; s = visit(s, 'frontier', 'festival-lantern'); assert.equal(s.team[0].xp, xp);
  assert.deepEqual(unlockedRewardIds(s).slice(-2), ['badge-valley-almanac', 'title-valley-keeper']);
  assert.ok(fromAdventureSave(toAdventureSave(s)));
  s = act({ ...s, dialogue: null }, 'START_PRACTICE');
  const resumed = fromAdventureSave(toAdventureSave(s));
  assert.equal(resumed.returnJourney.flags.valleyComplete, true);
  assert.equal(act(resumed, 'EXIT_MODE').flags.valleyComplete, true);
});
test('migration rejects partial and impossible fields; malformed choices do nothing', () => {
  let s = createAdventure(); const save = toAdventureSave(s);
  for (const id of VALLEY_FLAG_IDS) delete save.flags[id];
  assert.ok(fromAdventureSave(save));
  save.flags.groveStamp = true; assert.equal(fromAdventureSave(save), null);
  const bad = toAdventureSave(s); bad.flags.groveStamp = true; assert.equal(fromAdventureSave(bad), null);
  s = visit(s, 'sunward', 'dawn-etching'); s = visit(s, 'sunward', 'heliograph');
  assert.equal(act(s, 'VALLEY_CHOICE', { choice: '__proto__' }), s);
  assert.equal(act(s, 'PUZZLE_CHOICE', { lamp: 'amber' }), s);
  assert.equal(act(s, 'CANCEL_PUZZLE').puzzle, null);
});
test('new objects occupy distinct reachable walkable tiles', () => {
  for (const regionId of ['frontier', ...VALLEY_PROJECTS.map(p => p.regionId)]) {
    const region = ADVENTURE_REGIONS[regionId], state = { ...createAdventure(), locationId: regionId };
    const queue = [region.spawn], seen = new Set([`${region.spawn.x},${region.spawn.y}`]);
    for (let i = 0; i < queue.length; i++) for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const x = queue[i].x + dx, y = queue[i].y + dy, key = `${x},${y}`;
      if (!seen.has(key) && isAdventureWalkable(state, x, y)) { seen.add(key); queue.push({ x, y }); }
    }
    const ids = regionId === 'frontier' ? ['almanac-board', 'festival-lantern'] : [...new Set(VALLEY_PROJECTS.find(p => p.regionId === regionId).steps.map(s => s.objectId))];
    for (const id of ids) {
      const object = region.objects.find(o => o.id === id), key = `${object.x},${object.y}`;
      assert.equal(region.objects.filter(o => o.x === object.x && o.y === object.y).length, 1, `${regionId}:${id} overlaps`);
      assert.ok(isAdventureWalkable(state, object.x, object.y), `${regionId}:${id} blocked`);
      assert.ok(seen.has(key), `${regionId}:${id} unreachable`);
    }
  }
});
test('each level-one starter can defeat each guardian by reading its intents', () => {
  for (const starterId of ['emberquill', 'kitewhisk', 'duplet']) for (const encounterId of ['bramble-sentinel', 'tideglass-crab', 'starfall-ram']) {
    let state = beginBattle(createAdventure({ starterId }), encounterId);
    const inventory = { ...state.inventory };
    while (state.battle) state = act(state, 'BATTLE_MOVE', { moveId: state.battle.enemy.intent.damage > 7 ? 'ward' : 'strike' });
    assert.equal(state.result.outcome, 'won', `${starterId} against ${encounterId}`);
    assert.deepEqual(state.inventory, inventory);
  }
});
test('orchard and highlands can be completed independently before the chapter', () => {
  let s = createAdventure();
  s = visit(s, 'orchard', 'orchard-beehive'); s = visit(s, 'orchard', 'blossom-bed'); s = visit(s, 'orchard', 'orchard-beehive');
  s = visit(s, 'highlands', 'star-chart'); s = visit(s, 'highlands', 'star-crater'); s = solve(s, 'highlands'); s = visit(s, 'highlands', 'starfall-ram'); s = win(s);
  assert.ok(s.flags.orchardStamp && s.flags.highlandsStamp);
  assert.equal(s.flags.questStarted, false);
  assert.ok(fromAdventureSave(toAdventureSave(s)));
});
test('every current fieldwork lead and chapter stage is publicly routable', () => {
  for (const project of VALLEY_PROJECTS) for (let index = 0; index < project.steps.length; index++) {
    const state = createAdventure();
    for (const prior of project.steps.slice(0, index)) state.flags[prior.flag] = true;
    const lead = valleyProgress(state).find(p => p.id === project.id);
    assert.equal(lead.objectId, project.steps[index].objectId);
    assert.ok(mapLandmarks(state, lead.targetRegionId).some(o => o.id === lead.objectId));
    assert.equal(adventureRoute(state, { regionId: lead.targetRegionId, objectId: lead.objectId })?.blocked, false);
  }
  const state = createAdventure();
  for (const stage of valleyProgress(state).find(p => p.id === 'archive').steps) {
    const lead = valleyProgress(state).find(p => p.id === 'archive');
    assert.equal(lead.regionId, 'archive');
    assert.equal(lead.targetRegionId, stage.regionId);
    assert.ok(mapLandmarks(state, lead.targetRegionId).some(o => o.id === lead.objectId));
    assert.equal(adventureRoute(state, { regionId: lead.targetRegionId, objectId: lead.objectId })?.blocked, false);
    state.flags[stage.flag] = true;
  }
  assert.ok(mapLandmarks(state, 'frontier').some(o => o.id === 'festival-lantern'));
  assert.equal(adventureRoute(state, { regionId: 'frontier', objectId: 'festival-lantern' })?.blocked, false);
});
