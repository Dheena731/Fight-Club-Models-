import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdventure, adventureReducer, beginBattle } from './adventure.js';
import { ADVENTURE_REGIONS, MAP_REVISION } from './adventureContent.js';
import { ADVENTURE_SAVE_KEY, fromAdventureSave, toAdventureSave, saveAdventure, loadAdventure, saveCircuitRecord, loadCircuitRecord } from './adventureSave.js';

function storage() {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
}

test('pre-expansion v3 coordinates migrate to a safe checkpoint without losing progress', () => {
  const old = toAdventureSave(createAdventure({ trainerName: 'Original' }));
  delete old.mapRevision; delete old.runId;
  old.x = 9; old.y = 6;
  const migrated = fromAdventureSave(old);
  assert.ok(migrated);
  assert.equal(migrated.mapRevision, MAP_REVISION);
  assert.equal(migrated.trainerName, 'Original');
  assert.equal(migrated.x, ADVENTURE_REGIONS.frontier.spawn.x);
  assert.equal(migrated.y, ADVENTURE_REGIONS.frontier.spawn.y);
  assert.equal(fromAdventureSave(old).runId, migrated.runId, 'legacy run identity is stable');
});

test('old v3 active encounters migrate their adjacency while preserving turn, HP and energy', () => {
  const state = createAdventure({ starterId: 'kitewhisk' });
  const enemy = ADVENTURE_REGIONS.grove.objects.find(object => object.id === 'static');
  let battle = beginBattle({ ...state, locationId: 'grove', x: enemy.x - 1, y: enemy.y, discoveries: ['frontier', 'grove'], flags: { ...state.flags, questStarted: true, shardFound: true }, inventory: { ...state.inventory, 'signal-shard': 1 } }, 'static-wisp');
  battle = adventureReducer(battle, { type: 'BATTLE_MOVE', moveId: 'overcharge' });
  const old = toAdventureSave(battle);
  delete old.mapRevision; delete old.runId; old.x = 15; old.y = 5;
  const migrated = fromAdventureSave(old);
  assert.ok(migrated);
  assert.equal(Math.abs(migrated.x - enemy.x) + Math.abs(migrated.y - enemy.y), 1);
  assert.equal(migrated.battle.turn, battle.battle.turn);
  assert.equal(migrated.battle.enemy.hp, battle.battle.enemy.hp);
  assert.deepEqual(migrated.team, battle.team);
});

test('stale Journey/mode exits cannot overwrite a replacement confirmed in another tab', () => {
  const store = storage();
  const first = createAdventure({ trainerName: 'First' });
  saveAdventure(first, store);
  const practice = adventureReducer(first, { type: 'START_PRACTICE' });
  const second = createAdventure({ trainerName: 'Second' });
  assert.notEqual(first.runId, second.runId);
  assert.throws(() => saveAdventure(second, store), /different Journey/);
  saveAdventure(second, store, { replace: true });
  const unchanged = store.getItem(ADVENTURE_SAVE_KEY);
  const oldReturn = adventureReducer(practice, { type: 'EXIT_MODE' });
  assert.throws(() => saveAdventure(oldReturn, store), { code: 'STALE_JOURNEY' });
  assert.equal(store.getItem(ADVENTURE_SAVE_KEY), unchanged);
  assert.equal(loadAdventure(store).trainerName, 'Second');
  assert.equal(saveAdventure(loadAdventure(store), store), true);
});

test('Circuit records survive refresh independently and never replace the Journey snapshot', () => {
  const store = storage();
  saveAdventure(createAdventure({ trainerName: 'Protected' }), store);
  const unchanged = store.getItem(ADVENTURE_SAVE_KEY);
  for (const bestWins of [1, 2, 3]) assert.equal(saveCircuitRecord({ bestWins }, store), true);
  assert.deepEqual(loadCircuitRecord(store), { version: 1, bestWins: 3 });
  assert.equal(saveCircuitRecord({ bestWins: 1 }, store), true);
  assert.equal(loadCircuitRecord(store).bestWins, 3);
  assert.equal(store.getItem(ADVENTURE_SAVE_KEY), unchanged);
  assert.equal(saveCircuitRecord({ bestWins: 4 }, store), false);
});
