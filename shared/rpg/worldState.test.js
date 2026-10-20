import test from 'node:test';
import assert from 'node:assert/strict';
import { REGIONS, WORLD_SIZE } from './world.js';
import { FACTIONS, factionObjective } from './factions.js';
import { createGame, currentObjective, fromSave, isWalkable, loadGame, saveGame, toSave, worldReducer } from './worldState.js';

function act(state, type, more = {}) { return worldReducer(state, { type, ...more }); }
function readyGame(heroId = 'owl', choiceId) {
  const start = createGame(heroId);
  const choice = choiceId || FACTIONS[Object.keys(FACTIONS).find((key) => FACTIONS[key].heroId === heroId)].choices[0].id;
  return act(act(start, 'CHOOSE_MANDATE', { choiceId: choice }), 'CLOSE_PANEL');
}

test('every interactable in the first chapter is reachable from its region spawn', () => {
  for (const region of Object.values(REGIONS)) {
    const start = region.spawn;
    const state = { ...createGame(), locationId: region.id };
    const seen = new Set([`${start.x},${start.y}`]);
    const queue = [start];
    for (let i = 0; i < queue.length; i++) {
      const { x, y } = queue[i];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx; const ny = y + dy; const key = `${nx},${ny}`;
        if (!seen.has(key) && isWalkable(state, nx, ny)) { seen.add(key); queue.push({ x: nx, y: ny }); }
      }
    }
    assert.ok(queue.length < WORLD_SIZE.width * WORLD_SIZE.height);
    for (const object of region.objects) {
      assert.ok(queue.some(({ x, y }) => Math.abs(x - object.x) + Math.abs(y - object.y) <= 1), `${region.id}/${object.id} is unreachable`);
    }
  }
});

test('movement rejects walls, invalid jumps, and movement during dialogue', () => {
  const state = readyGame();
  assert.equal(act(state, 'MOVE', { dx: 2, dy: 0 }), state);
  assert.equal(act({ ...state, x: 1, y: 1 }, 'MOVE', { dx: -1, dy: 0 }).x, 1);
  const talking = { ...state, panel: 'dialogue' };
  assert.equal(act(talking, 'MOVE', { dx: 1, dy: 0 }), talking);
});

test('Lantern Signal can be completed, with puzzle order and one-time rewards', () => {
  let state = { ...readyGame('fox'), locationId: 'frontier', x: 5, y: 6 };
  state = act(state, 'INTERACT');
  assert.equal(state.flags.questStarted, true);
  state = act(state, 'CLOSE_PANEL');
  state = { ...state, locationId: 'grove', x: 13, y: 8 };
  state = act(state, 'INTERACT');
  assert.equal(state.flags.shardFound, true);
  state = act(state, 'CLOSE_PANEL');
  state = { ...state, x: 15, y: 5 };
  state = act(state, 'INTERACT');
  for (const abilityId of ['pulse', 'strike', 'strike']) state = act(state, 'COMBAT_ACTION', { abilityId });
  assert.equal(state.combat.done, 'won');
  state = act(state, 'CLOSE_PANEL');
  assert.equal(state.flags.wispDefeated, true);
  state = { ...state, locationId: 'archive', x: 7, y: 8 };
  state = act(state, 'INTERACT');
  state = act(state, 'CLOSE_PANEL');
  state = { ...state, x: 10, y: 6 };
  state = act(state, 'INTERACT');
  assert.equal(state.panel, 'puzzle');
  state = act(state, 'PUZZLE_CHOICE', { lamp: 'cyan' });
  assert.equal(state.flags.relayRestored, false);
  state = act(state, 'PUZZLE_CHOICE', { lamp: 'amber' });
  state = act(state, 'PUZZLE_CHOICE', { lamp: 'cyan' });
  assert.equal(state.flags.relayRestored, true);
  state = act(state, 'CLOSE_PANEL');
  state = { ...state, locationId: 'frontier', x: 5, y: 6 };
  state = act(state, 'INTERACT');
  assert.equal(state.flags.questComplete, true);
  assert.match(currentObjective(state), /complete/);
  const xp = state.xp;
  state = act(state, 'CLOSE_PANEL');
  state = act(state, 'INTERACT');
  assert.equal(state.xp, xp);
});

test('save validation preserves progress and excludes transient or sensitive fields', () => {
  const state = { ...createGame(), apiKey: 'secret', panel: 'dialogue', dialogue: { text: 'Hi' } };
  const saved = toSave(state);
  assert.equal(JSON.stringify(saved).includes('secret'), false);
  assert.equal(saved.panel, undefined);
  assert.equal(fromSave(saved).heroId, 'owl');
  assert.equal(fromSave({ ...saved, locationId: 'unknown' }), null);
  assert.equal(fromSave({ ...saved, x: -99 }), null);
  const store = { value: '', setItem(_key, value) { this.value = value; } };
  assert.equal(saveGame(state, store), true);
  assert.equal(store.value.includes('secret'), false);
});

test('three factions begin in distinct scenes and require a mandate choice', () => {
  const starts = Object.values(FACTIONS).map((faction) => {
    const state = createGame(faction.heroId);
    assert.equal(state.locationId, faction.regionId);
    assert.equal(state.panel, 'intro');
    assert.equal(act(state, 'CLOSE_PANEL'), state);
    assert.equal(act(state, 'MOVE', { dx: 1, dy: 0 }), state);
    assert.match(factionObjective(state), /Choose/);
    const chosen = act(state, 'CHOOSE_MANDATE', { choiceId: faction.choices[1].id });
    assert.equal(chosen.faction.choice, faction.choices[1].id);
    return state.locationId;
  });
  assert.equal(new Set(starts).size, 3);
});

test('each faction mandate rewards once at its ally and persists reputation', () => {
  const allyPosition = { wardens: ['frontier', 5, 6], guild: ['grove', 6, 6], observatory: ['archive', 12, 7] };
  for (const faction of Object.values(FACTIONS)) {
    for (const choice of faction.choices) {
      let state = readyGame(faction.heroId, choice.id);
      state = {
        ...state,
        flags: { ...state.flags, noteRead: true, shardFound: true, wispDefeated: true },
        discoveries: ['frontier', 'grove', 'archive'],
        locationId: allyPosition[faction.id][0], x: allyPosition[faction.id][1], y: allyPosition[faction.id][2],
      };
      state = act(state, 'INTERACT');
      assert.equal(state.faction.completed, true, `${faction.id}/${choice.id}`);
      assert.equal(state.faction.reputation, 2);
      assert.ok(state.inventory.includes(choice.item));
      const saved = fromSave(toSave(state));
      assert.equal(saved.faction.choice, choice.id);
      assert.equal(saved.faction.reputation, 2);
      state = act(state, 'CLOSE_PANEL');
      const xp = state.xp;
      state = act(state, 'INTERACT');
      assert.equal(state.xp, xp, `${faction.id}/${choice.id} reward duplicated`);
    }
  }
});

test('old version-one save migrates without erasing completed chapter progress', () => {
  const old = { ...toSave(readyGame('fox')), version: 1, faction: undefined,
    flags: { ...createGame('fox').flags, questComplete: true } };
  const store = { getItem(key) { return key.endsWith(':v1') ? JSON.stringify(old) : null; } };
  const migrated = loadGame(store);
  assert.equal(migrated.heroId, 'fox');
  assert.equal(migrated.flags.questComplete, true);
  assert.equal(migrated.panel, 'intro');
  assert.equal(migrated.faction.reputation, 0);
  const corruptNewerStore = { getItem(key) { return key.endsWith(':v2') ? '{bad json' : JSON.stringify(old); } };
  assert.equal(loadGame(corruptNewerStore).flags.questComplete, true);
});

test('mandate rewards require evidence and change the named combat action', () => {
  let state = readyGame('owl', 'safeguard');
  state = { ...state, x: 5, y: 6 };
  state = act(state, 'INTERACT');
  assert.equal(state.faction.completed, false);
  state = act(state, 'CLOSE_PANEL');
  state = { ...state, flags: { ...state.flags, noteRead: true } };
  state = act(state, 'INTERACT');
  assert.equal(state.faction.completed, true);
  state = act(state, 'CLOSE_PANEL');
  const beforeFight = { ...state, locationId: 'grove', x: 15, y: 5 };
  const fighting = act(beforeFight, 'INTERACT');
  const guarded = act(fighting, 'COMBAT_ACTION', { abilityId: 'guard' });
  assert.equal(guarded.hp, fighting.hp - 0, 'Warden Seal should absorb the Wisp strike');
});
