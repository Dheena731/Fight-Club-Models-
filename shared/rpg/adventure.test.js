import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_REGIONS, CIRCUIT_IDS, COMPANIONS, ENCOUNTERS, getCompanion, getEncounter, getMove, ITEMS, MAX_BATTLE_TURNS, STARTER_IDS } from './adventureContent.js';
import { activeCompanion, adventureObjective, adventureReducer, availableMoves, battleIntent, createAdventure, isAdventureWalkable, journalEntries, lanternStatus, nearbyInteractable, questProgress, regionObjects, unlockedRewardIds } from './adventure.js';
import { fromAdventureSave, toAdventureSave } from './adventureSave.js';

const act = (state, type, extra = {}) => adventureReducer(state, { type, ...extra });
const dismiss = state => act(state, 'DISMISS_DIALOGUE');
function walkTo(state, id) {
  const object = ADVENTURE_REGIONS[state.locationId].objects.find(entry => entry.id === id);
  assert.ok(object, `${state.locationId}/${id} exists`);
  const queue = [{ x: state.x, y: state.y, path: [] }];
  const seen = new Set([`${state.x},${state.y}`]);
  for (const point of queue) {
    if (Math.abs(point.x - object.x) + Math.abs(point.y - object.y) <= 1) {
      let moved = state;
      for (const [dx, dy] of point.path) {
        const next = act(moved, 'MOVE', { dx, dy });
        assert.notEqual(next, moved, `walk to ${id} was blocked`);
        moved = next;
      }
      if (nearbyInteractable(moved)?.id === id) return moved;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = point.x + dx; const y = point.y + dy; const key = `${x},${y}`;
      if (!seen.has(key) && isAdventureWalkable(state, x, y)) { seen.add(key); queue.push({ x, y, path: [...point.path, [dx, dy]] }); }
    }
  }
  assert.fail(`No reachable interaction with ${state.locationId}/${id}`);
}
const interactAt = (state, id) => act(walkTo(state, id), 'INTERACT');
function win(state, resume = false) {
  let turns = 0;
  while (state.battle) {
    if (resume) {
      const loaded = fromAdventureSave(toAdventureSave(state));
      assert.ok(loaded, 'stable turn resumes');
      state = loaded;
    }
    const intent = battleIntent(state);
    assert.equal(typeof intent.name, 'string');
    assert.equal(typeof intent.description, 'string');
    const moveId = intent.damage >= 12 ? 'ward' : activeCompanion(state).energy >= 3 && activeCompanion(state).moves.includes('overcharge') ? 'overcharge' : 'strike';
    state = act(state, 'BATTLE_MOVE', { moveId });
    assert.ok(++turns <= MAX_BATTLE_TURNS);
  }
  assert.equal(state.result.outcome, 'won');
  return state;
}
function reachWisp(starterId) {
  let state = dismiss(interactAt(createAdventure({ trainerName: 'Ari', starterId }), 'guide'));
  state = interactAt(state, 'grove-gate');
  state = dismiss(interactAt(state, 'shard'));
  return interactAt(state, 'static');
}
function finishChapter(starterId, recruit) {
  let state = act(win(reachWisp(starterId), true), 'CONTINUE_RESULT');
  if (recruit) {
    state = dismiss(interactAt(state, 'ranger'));
    assert.equal(state.team.length, 2);
    state = dismiss(interactAt(state, 'ranger'));
    assert.equal(state.team.length, 2, 'recruit once');
    state = act(state, 'SWITCH_COMPANION', { companionId: 'mossback' });
    assert.equal(activeCompanion(state).id, 'mossback');
    state = act(state, 'SWITCH_COMPANION', { companionId: starterId });
  }
  state = interactAt(state, 'frontier-gate');
  state = interactAt(state, 'archive-gate');
  state = dismiss(interactAt(state, 'archive-note'));
  state = interactAt(state, 'relay');
  assert.deepEqual(state.puzzle, { step: 0 });
  assert.equal(act(state, 'PUZZLE_CHOICE', { lamp: 'invalid' }), state);
  state = act(state, 'PUZZLE_CHOICE', { lamp: 'cyan' });
  assert.equal(state.puzzle.step, 0);
  state = act(state, 'PUZZLE_CHOICE', { lamp: 'amber' });
  assert.equal(state.puzzle.step, 1);
  state = dismiss(act(state, 'PUZZLE_CHOICE', { lamp: 'cyan' }));
  assert.equal(state.flags.relayRestored, true);
  const xp = state.team[0].xp;
  state = dismiss(interactAt(state, 'relay'));
  assert.equal(state.team[0].xp, xp, 'relay XP only once');
  state = act(win(interactAt(state, 'guardian'), true), 'CONTINUE_RESULT');
  assert.equal(state.flags.bossDefeated, true);
  state = interactAt(state, 'frontier-gate');
  state = interactAt(state, 'guide');
  assert.equal(state.result.outcome, 'restored');
  assert.equal(state.flags.questComplete, true);
  assert.equal(lanternStatus(state), 'restored');
  const rewards = unlockedRewardIds(state);
  assert.equal(new Set(rewards).size, 5);
  assert.equal(questProgress(state).every(quest => quest.complete), true);
  assert.match(adventureObjective(state), /complete/);
  const finalXp = state.team[0].xp;
  state = act(fromAdventureSave(toAdventureSave(state)), 'CONTINUE_RESULT');
  state = dismiss(interactAt(state, 'guide'));
  assert.equal(state.team[0].xp, finalXp);
  assert.deepEqual(unlockedRewardIds(state), rewards);
  return state;
}

test('metadata, selectors and trainer/companion identity follow the integration contract', () => {
  const state = createAdventure({ trainerName: '  Ari<>\n ', starterId: 'duplet' });
  assert.equal(state.trainerName, 'Ari');
  assert.equal(activeCompanion(state).name, 'Duplet');
  assert.notEqual(state.trainerName, state.activeId);
  assert.equal(getCompanion('duplet'), COMPANIONS[2]);
  assert.equal(getMove('ward').guard, 13);
  assert.equal(getEncounter('static-wisp'), ENCOUNTERS['static-wisp']);
  assert.equal(getEncounter('__proto__'), null);
  assert.equal(availableMoves(state).every(move => !move.usable), true);
  assert.equal(journalEntries(state).length, 1, 'future journal steps are not spoiled');
  assert.throws(() => createAdventure({ starterId: 'unknown' }));
  assert.throws(() => createAdventure({ mode: 'live' }));
});

test('all objects, spawns and exit entries are reachable on the distinct authored maps', () => {
  for (const region of Object.values(ADVENTURE_REGIONS)) {
    const state = { ...createAdventure(), locationId: region.id, ...region.spawn };
    assert.ok(isAdventureWalkable(state, state.x, state.y));
    const queue = [region.spawn]; const seen = new Set([`${state.x},${state.y}`]);
    for (const point of queue) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = point.x + dx; const y = point.y + dy; const key = `${x},${y}`;
      if (!seen.has(key) && isAdventureWalkable(state, x, y)) { seen.add(key); queue.push({ x, y }); }
    }
    for (const object of region.objects) {
      assert.ok(queue.some(point => Math.abs(point.x - object.x) + Math.abs(point.y - object.y) <= 1), `${region.id}/${object.id}`);
      if (object.to) assert.ok(isAdventureWalkable({ ...state, locationId: object.to }, object.entry.x, object.entry.y), `${region.id}/${object.id} entry`);
    }
    assert.ok(queue.length <= region.width * region.height);
    assert.equal(isAdventureWalkable(state, 1.5, 1), false);
  }
});

for (const starterId of STARTER_IDS) for (const recruit of [false, true]) {
  test(`complete chapter on foot, stable saves each battle turn: ${starterId}, recruit=${recruit}`, () => {
    const state = finishChapter(starterId, recruit);
    assert.equal(state.team[0].xp, 115);
    assert.equal(state.inventory['lantern-emblem'], 1);
    assert.equal(regionObjects(state).find(object => object.id === 'lantern').status, 'restored');
  });
}

test('prerequisites, malformed movement and dialogue prevent skipping story', () => {
  let state = createAdventure();
  for (const move of [{ dx: 2, dy: 0 }, { dx: 1, dy: 1 }, { dx: NaN, dy: 0 }, { dx: 0, dy: 0 }, { dx: '1', dy: 0 }]) assert.equal(act(state, 'MOVE', move), state);
  assert.equal(act(state, 'PUZZLE_CHOICE', { lamp: 'amber' }), state);
  assert.equal(act(state, 'BATTLE_MOVE', { moveId: 'strike' }), state);
  state = interactAt(state, 'archive-gate');
  assert.equal(state.locationId, 'frontier');
  assert.ok(state.dialogue);
  assert.equal(act(state, 'MOVE', { dx: 1, dy: 0 }), state);
  state = interactAt(dismiss(state), 'grove-gate');
  state = dismiss(interactAt(state, 'shard'));
  assert.equal(state.flags.shardFound, false);
  state = interactAt(state, 'static');
  assert.equal(state.battle, null);
  state = { ...createAdventure(), locationId: 'archive', x: 10, y: 4 };
  state = act(state, 'INTERACT');
  assert.equal(state.battle, null);
  assert.equal(state.flags.bossDefeated, false);
});

test('invalid combat, unaffordable moves, invalid quantities and items spend no turn', () => {
  let state = reachWisp('emberquill');
  for (const action of [null, {}, { type: 'BATTLE_MOVE', moveId: 'recall' }, { type: 'BATTLE_MOVE', moveId: 'missing' }, { type: 'SWITCH_COMPANION', companionId: 'unknown' }, { type: 'SWITCH_COMPANION', companionId: state.activeId }, { type: 'USE_ITEM', itemId: 'potion' }, { type: 'USE_ITEM', itemId: 'signal-shard' }, { type: 'REST' }, { type: 'INTERACT' }, { type: 'MOVE', dx: 1, dy: 0 }]) assert.equal(adventureReducer(state, action), state);
  state = { ...state, team: state.team.map(member => ({ ...member, energy: 0, hp: member.hp - 10 })) };
  assert.equal(act(state, 'BATTLE_MOVE', { moveId: 'overcharge' }), state);
  for (const quantity of [-1, 0, 0.5, 100, NaN, '2', Infinity]) {
    const invalid = { ...state, inventory: { ...state.inventory, potion: quantity } };
    assert.equal(act(invalid, 'USE_ITEM', { itemId: 'potion' }), invalid);
  }
  const used = act(state, 'USE_ITEM', { itemId: 'potion' });
  assert.equal(used.battle.turn, state.battle.turn + 1);
  assert.equal(used.inventory.potion, state.inventory.potion - 1);
  assert.equal(activeCompanion(used).hp, activeCompanion(used).maxHp);
  const tea = act(state, 'USE_ITEM', { itemId: 'ether' });
  assert.equal(activeCompanion(tea).energy, 3);
  assert.equal(tea.inventory.ether, 1);
});

test('switching consumes an enemy response; Ward, Recall and Fork apply actual rules', () => {
  let state = act(win(reachWisp('duplet')), 'CONTINUE_RESULT');
  state = dismiss(interactAt(state, 'ranger'));
  state = { ...state, locationId: 'archive', x: 10, y: 2, flags: { ...state.flags, noteRead: true, relayRestored: true } };
  state = act(state, 'INTERACT');
  const switched = act(state, 'SWITCH_COMPANION', { companionId: 'mossback' });
  assert.equal(switched.battle.turn, 1);
  assert.equal(switched.activeId, 'mossback');
  const ward = act(switched, 'BATTLE_MOVE', { moveId: 'ward' });
  assert.equal(activeCompanion(ward).hp, activeCompanion(switched).hp - 2);
  const recalled = act(state, 'BATTLE_MOVE', { moveId: 'recall' });
  assert.equal(recalled.battle.enemy.hp, state.battle.enemy.hp - (15 + activeCompanion(state).level - 1));
  let fork = createAdventure({ mode: 'practice', starterId: 'kitewhisk' });
  const hp = fork.battle.enemy.hp;
  fork = act(fork, 'BATTLE_MOVE', { moveId: 'fork' });
  assert.equal(fork.battle.enemy.hp, hp - 15);
});

test('defeat, retreat and town rest are safe, non-rewarding and preserve evidence', () => {
  const original = reachWisp('kitewhisk');
  let state = { ...original, team: original.team.map(member => ({ ...member, hp: 1 })) };
  state = act(state, 'BATTLE_MOVE', { moveId: 'strike' });
  state = act(state, 'BATTLE_MOVE', { moveId: 'strike' });
  assert.equal(state.result.outcome, 'lost');
  assert.equal(state.locationId, 'frontier');
  assert.deepEqual(state.flags, original.flags);
  assert.equal(activeCompanion(state).hp, activeCompanion(state).maxHp);
  assert.deepEqual(unlockedRewardIds(state), []);
  state = act(original, 'RETREAT');
  assert.equal(state.result.outcome, 'retreated');
  assert.equal(state.flags.wispDefeated, false);
  assert.equal(state.team[0].xp, original.team[0].xp);
  state = act(state, 'CONTINUE_RESULT');
  state = { ...state, team: state.team.map(member => ({ ...member, hp: 1, energy: 0 })) };
  const rested = act(walkTo(state, 'rest'), 'REST');
  assert.equal(activeCompanion(rested).hp, activeCompanion(rested).maxHp);
  assert.deepEqual(rested.inventory, state.inventory);
});

test('fainted lead is replaced and the exact turn bound produces safe defeat', () => {
  let state = act(win(reachWisp('emberquill')), 'CONTINUE_RESULT');
  state = dismiss(interactAt(state, 'ranger'));
  state = { ...state, locationId: 'archive', x: 10, y: 2, flags: { ...state.flags, noteRead: true, relayRestored: true } };
  state = act(state, 'INTERACT');
  state = { ...state, team: state.team.map(member => ({ ...member, hp: member.id === state.activeId ? 1 : member.hp })) };
  state = act(act(state, 'BATTLE_MOVE', { moveId: 'strike' }), 'BATTLE_MOVE', { moveId: 'strike' });
  assert.equal(state.activeId, 'mossback');
  state = { ...state, battle: { ...state.battle, turn: MAX_BATTLE_TURNS - 1, enemy: { ...state.battle.enemy, intent: ENCOUNTERS['archive-warden'].intents[(MAX_BATTLE_TURNS - 1) % 3] } } };
  state = act(state, 'BATTLE_MOVE', { moveId: 'ward' });
  assert.equal(state.battle, null);
  assert.equal(state.result.outcome, 'lost');
  assert.equal(state.locationId, 'frontier');
  assert.equal(activeCompanion(state).hp, activeCompanion(state).maxHp);
});

for (const starterId of STARTER_IDS) test(`Practice and all three Circuit fights isolate Journey: ${starterId}`, () => {
  const journey = act(win(reachWisp(starterId)), 'CONTINUE_RESULT');
  const unchanged = state => ({ team: state.team, flags: state.flags, inventory: state.inventory, locationId: state.locationId, x: state.x, y: state.y });
  let practice = act(journey, 'START_PRACTICE');
  practice = win(practice, true);
  assert.deepEqual(unlockedRewardIds(practice), []);
  assert.equal(practice.team[0].xp, 0);
  assert.deepEqual(practice.result.rewards, []);
  practice = act(practice, 'CONTINUE_RESULT');
  assert.equal(practice.battle.encounterId, 'practice-wisp');
  assert.deepEqual(unchanged(act(practice, 'EXIT_MODE')), unchanged(journey));
  let circuit = act(journey, 'START_CIRCUIT');
  circuit = act(circuit, 'RETREAT');
  assert.equal(circuit.circuit.wins, 0);
  circuit = act(circuit, 'RETRY_BATTLE');
  for (let i = 0; i < 3; i++) {
    assert.equal(circuit.battle.encounterId, CIRCUIT_IDS[i]);
    circuit = win(circuit, true);
    assert.equal(circuit.circuit.wins, i + 1);
    assert.equal(circuit.team[0].xp, 0);
    assert.deepEqual(unlockedRewardIds(circuit), []);
    assert.equal(act(circuit, 'RETRY_BATTLE'), circuit, 'winning cannot replay the same Circuit result');
    circuit = fromAdventureSave(toAdventureSave(circuit));
    assert.ok(circuit);
    circuit = act(circuit, 'CONTINUE_RESULT');
  }
  assert.equal(circuit.circuit.completed, true);
  assert.equal(circuit.circuit.bestWins, 3);
  assert.equal(circuit.battle, null);
  const returned = act(circuit, 'EXIT_MODE');
  assert.deepEqual(unchanged(returned), unchanged(journey));
  assert.equal(returned.circuit.bestWins, 3);
  assert.equal(act(returned, 'START_CIRCUIT').circuit.bestWins, 3);
});

test('arena transition is explicit, separate from Practice and never a provider call', () => {
  let state = interactAt(createAdventure(), 'arena');
  assert.equal(state.transition, 'arena');
  assert.equal(state.mode, 'journey');
  assert.equal(state.battle, null);
  assert.equal(act(state, 'MOVE', { dx: 1, dy: 0 }), state);
  state = act(state, 'CLEAR_TRANSITION');
  state = interactAt(state, 'practice-board');
  assert.equal(state.mode, 'practice');
  assert.equal(state.battle.encounterId, 'practice-wisp');
});

test('reducers never mutate their input or exported content', () => {
  const freeze = value => { if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
  const contentBefore = JSON.stringify({ ADVENTURE_REGIONS, COMPANIONS, ENCOUNTERS, ITEMS });
  const state = freeze(reachWisp('kitewhisk'));
  const snapshot = JSON.stringify(state);
  act(state, 'BATTLE_MOVE', { moveId: 'strike' });
  act(state, 'RETREAT');
  assert.equal(JSON.stringify(state), snapshot);
  assert.equal(JSON.stringify({ ADVENTURE_REGIONS, COMPANIONS, ENCOUNTERS, ITEMS }), contentBefore);
});
