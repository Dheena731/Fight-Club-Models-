import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_REGIONS, ENCOUNTERS, FLAG_IDS, MAX_BATTLE_TURNS, STARTER_IDS } from './adventureContent.js';
import { activeCompanion, adventureReducer, battleIntent, createAdventure, unlockedRewardIds } from './adventure.js';
import { ADVENTURE_SAVE_KEY, fromAdventureSave, LEGACY_HERO_MAP, LEGACY_SAVE_KEYS, loadAdventure, saveAdventure, toAdventureSave } from './adventureSave.js';
import { createGame, toSave } from './worldState.js';

const act = (state, type, extra = {}) => adventureReducer(state, { type, ...extra });
function storage(entries = {}) {
  const data = new Map(Object.entries(entries));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
function wisp() {
  const state = createAdventure({ trainerName: 'Ari', starterId: 'duplet' });
  const enemy = ADVENTURE_REGIONS.grove.objects.find(object => object.id === 'static');
  return act({ ...state, locationId: 'grove', discoveries: ['frontier', 'grove'], x: enemy.x - 1, y: enemy.y, facing: 'right', flags: { ...state.flags, questStarted: true, shardFound: true }, inventory: { ...state.inventory, 'signal-shard': 1 } }, 'INTERACT');
}
const clone = value => JSON.parse(JSON.stringify(value));

test('v3 projection whitelists every level, excluding secrets, arbitrary panels and provider text', () => {
  const state = wisp();
  state.apiKey = 'secret-marker';
  state.panel = 'secret-marker';
  state.transition = 'arena';
  state.dialogue = { speaker: 'secret-marker', text: 'secret-marker' };
  state.message = 'secret-marker';
  state.flags.secret = 'secret-marker';
  state.inventory.secret = 'secret-marker';
  state.team[0].name = 'secret-marker';
  state.team[0].provider = 'secret-marker';
  state.battle.log = ['secret-marker'];
  state.battle.enemy.name = 'secret-marker';
  state.battle.enemy.intent.description = 'secret-marker';
  const saved = toAdventureSave(state);
  assert.equal(JSON.stringify(saved).includes('secret-marker'), false);
  for (const key of ['apiKey', 'panel', 'transition', 'dialogue', 'message', 'puzzle']) assert.equal(saved[key], undefined);
  const loaded = fromAdventureSave(saved);
  assert.equal(loaded.dialogue, null);
  assert.equal(loaded.puzzle, null);
  assert.equal(loaded.transition, null);
  assert.equal(loaded.battle.enemy.name, 'Static Wisp');
  assert.equal(activeCompanion(loaded).name, 'Duplet');
  assert.deepEqual(battleIntent(loaded), ENCOUNTERS['static-wisp'].intents[0]);
});

test('saved battles resume identical deterministic next turns without storing logs or intent', () => {
  let uninterrupted = wisp();
  uninterrupted = act(uninterrupted, 'BATTLE_MOVE', { moveId: 'strike' });
  const saved = toAdventureSave(uninterrupted);
  assert.deepEqual(Object.keys(saved.battle).sort(), ['encounterId', 'enemyHp', 'turn']);
  let resumed = fromAdventureSave(saved);
  assert.equal(resumed.battle.turn, 1);
  assert.deepEqual(resumed.battle.enemy.intent, uninterrupted.battle.enemy.intent);
  const compare = state => ({ team: state.team, inventory: state.inventory, flags: state.flags, battle: state.battle && { ...state.battle, log: null }, result: state.result });
  for (const moveId of ['ward', 'strike', 'strike', 'ward', 'strike', 'strike']) {
    uninterrupted = act(uninterrupted, 'BATTLE_MOVE', { moveId });
    resumed = act(resumed, 'BATTLE_MOVE', { moveId });
    assert.deepEqual(compare(resumed), compare(uninterrupted));
  }
  assert.equal(resumed.result.outcome, 'won');
  assert.equal(resumed.team[0].xp, 25);
  const won = fromAdventureSave(toAdventureSave(resumed));
  const xp = won.team[0].xp;
  assert.equal(act(won, 'BATTLE_MOVE', { moveId: 'overcharge' }), won);
  assert.equal(act(act(won, 'CONTINUE_RESULT'), 'CONTINUE_RESULT').team[0].xp, xp);
});

test('corrupt/unknown schema, flags, positions, quantities, teams and record values fail closed', () => {
  const good = toAdventureSave(createAdventure());
  const cases = [
    value => { value.version = 4; }, value => { value.chapterId = 'unknown'; },
    value => { value.mode = 'ranked'; }, value => { value.starterId = 'owl'; },
    value => { value.trainerName = 'x'.repeat(25); }, value => { value.trainerName = '<script>'; },
    value => { value.locationId = '__proto__'; }, value => { value.locationId = 'unknown'; },
    value => { value.x = -1; }, value => { value.y = 0; }, value => { value.x = 2.5; },
    value => { value.x = ADVENTURE_REGIONS.frontier.solid[0].x; value.y = ADVENTURE_REGIONS.frontier.solid[0].y; }, value => { value.facing = 'northwest'; },
    value => { value.inventory.potion = -1; }, value => { value.inventory.potion = 0.5; },
    value => { value.inventory.potion = '2'; }, value => { value.inventory.potion = 100; },
    value => { value.inventory['signal-shard'] = 2; }, value => { delete value.inventory.ether; },
    value => { value.team = []; }, value => { value.team.push({ ...value.team[0] }); },
    value => { value.team[0].hp = 0; }, value => { value.team[0].hp = 10000; },
    value => { value.team[0].xp = -1; }, value => { value.team[0].energy = 6; },
    value => { value.activeId = 'mossback'; }, value => { value.flags.questStarted = 'true'; },
    value => { value.flags.questComplete = true; }, value => { value.flags.recruited = true; },
    value => { value.discoveries = ['unknown']; }, value => { value.circuit.wins = 3; },
    value => { value.circuit.bestWins = 4; }, value => { value.returnJourney = good; },
    value => { value.legacy = { version: 1 }; },
  ];
  for (const mutate of cases) {
    const invalid = clone(good); mutate(invalid);
    assert.equal(fromAdventureSave(invalid), null, mutate.toString());
  }
  for (const value of [null, undefined, true, 'saved', [], { version: 3 }]) assert.equal(fromAdventureSave(value), null);
  assert.throws(() => toAdventureSave({}), /invalid state/);
});

test('combat saves reject impossible stable turns, enemy/mode mismatches and result overlaps', () => {
  const good = toAdventureSave(wisp());
  const cases = [
    value => { value.battle.turn = -1; }, value => { value.battle.turn = 0.5; },
    value => { value.battle.turn = MAX_BATTLE_TURNS; }, value => { value.battle.encounterId = 'unknown'; },
    value => { value.battle.enemyHp = 0; }, value => { value.battle.enemyHp = 31; },
    value => { value.battle.enemyHp = 20; }, value => { value.flags.wispDefeated = true; },
    value => { value.battle.encounterId = 'archive-warden'; }, value => { value.battle.encounterId = 'practice-wisp'; },
    value => { value.pendingResult = { outcome: 'lost', encounterId: 'static-wisp' }; },
    value => { value.x = 2; }, value => { value.team[0].hp = 0; },
  ];
  for (const mutate of cases) { const invalid = clone(good); mutate(invalid); assert.equal(fromAdventureSave(invalid), null, mutate.toString()); }
  const practice = toAdventureSave(createAdventure({ mode: 'practice' }));
  assert.ok(fromAdventureSave(practice));
  for (const mutate of [value => { value.battle.encounterId = 'static-wisp'; }, value => { value.flags.questStarted = true; }, value => { value.team[0].xp = 10; }, value => { value.battle = null; }]) {
    const invalid = clone(practice); mutate(invalid); assert.equal(fromAdventureSave(invalid), null);
  }
  const circuit = toAdventureSave(createAdventure({ mode: 'circuit' }));
  circuit.battle.encounterId = 'rival-keeper';
  assert.equal(fromAdventureSave(circuit), null);
});

for (const [heroId, starterId] of Object.entries(LEGACY_HERO_MAP)) for (const version of [1, 2]) {
  test(`legacy v${version} ${heroId} imports to ${starterId}, preserving quest/inventory/faction history`, () => {
    const old = toSave(createGame(heroId));
    old.version = version;
    old.flags.questComplete = true;
    old.xp = 55;
    old.inventory = ['Signal Shard', 'Lantern Emblem', 'Warden Seal', 'secret-marker'];
    old.faction = heroId === 'owl' ? { choice: 'safeguard', completed: true, reputation: 2 } : old.faction;
    old.apiKey = 'secret-marker';
    const loaded = fromAdventureSave(old);
    assert.ok(loaded);
    assert.equal(loaded.starterId, starterId);
    assert.equal(loaded.flags.questComplete, true);
    assert.equal(loaded.flags.bossDefeated, true);
    assert.equal(loaded.team[0].xp, 55);
    assert.equal(loaded.inventory['lantern-emblem'], 1);
    assert.equal(loaded.legacy.version, version);
    assert.ok(loaded.legacy.inventory.includes('Warden Seal'));
    if (heroId === 'owl') assert.equal(loaded.legacy.faction.completed, true);
    assert.equal(JSON.stringify(toAdventureSave(loaded)).includes('secret-marker'), false);
    const store = storage({ [LEGACY_SAVE_KEYS[version === 2 ? 0 : 1]]: JSON.stringify(old) });
    const original = new Map(store.data);
    assert.equal(loadAdventure(store).starterId, starterId);
    assert.equal(store.data.size, 1, 'loading never writes');
    assert.equal(saveAdventure(loaded, store), true);
    for (const [key, value] of original) assert.equal(store.data.get(key), value, 'legacy key preserved byte-for-byte');
    assert.equal(loadAdventure(store).flags.questComplete, true);
    assert.equal(unlockedRewardIds(loaded).length, 5);
  });
}

test('partial legacy progress is retained without fabricating new boss completion', () => {
  const old = toSave(createGame('fox'));
  old.flags.shardFound = true;
  old.inventory = ['Signal Shard', 'Survey Lens'];
  old.flags.noteRead = true;
  const state = fromAdventureSave(old);
  assert.equal(state.flags.questStarted, true);
  assert.equal(state.flags.shardFound, true);
  assert.equal(state.flags.noteRead, true);
  assert.equal(state.flags.bossDefeated, false);
  assert.deepEqual(state.legacy.flags, old.flags);
  assert.ok(state.legacy.inventory.includes('Survey Lens'));
  assert.ok(fromAdventureSave(toAdventureSave(state)));
});

test('new v3 wins, corrupt newer saves fall back visibly, and no originals are removed', () => {
  const old = { ...toSave(createGame('fox')), version: 1 };
  const entries = { [ADVENTURE_SAVE_KEY]: '{bad json', [LEGACY_SAVE_KEYS[0]]: JSON.stringify({ version: 2 }), [LEGACY_SAVE_KEYS[1]]: JSON.stringify(old) };
  const store = storage(entries);
  const migrated = loadAdventure(store);
  assert.equal(migrated.starterId, 'kitewhisk');
  assert.match(migrated.saveWarning, /newer save/);
  assert.equal(store.data.get(ADVENTURE_SAVE_KEY), '{bad json');
  assert.equal(saveAdventure(migrated, store), true);
  assert.equal(loadAdventure(store).starterId, 'kitewhisk');
  for (const key of LEGACY_SAVE_KEYS) assert.equal(store.data.get(key), entries[key]);
  saveAdventure(createAdventure({ starterId: 'duplet' }), store);
  assert.equal(loadAdventure(store).starterId, 'duplet');
});

test('storage and corruption errors remain visible; failed migration does not remove old saves', () => {
  assert.equal(loadAdventure(storage()), null);
  assert.throws(() => loadAdventure(storage({ [ADVENTURE_SAVE_KEY]: '{broken' })), /Invalid adventure save/);
  assert.throws(() => loadAdventure({ getItem() { throw new Error('blocked'); } }), /Could not read/);
  assert.throws(() => saveAdventure(createAdventure(), { getItem() { return null; }, setItem() { throw new Error('full'); } }), /could not be saved/);
  assert.throws(() => saveAdventure(createAdventure(), { getItem() { return null; }, setItem() {} }), /could not be saved/);
  const old = JSON.stringify({ ...toSave(createGame('serpent')), version: 1 });
  const store = storage({ [LEGACY_SAVE_KEYS[1]]: old });
  store.setItem = () => { throw new Error('quota'); };
  assert.throws(() => saveAdventure(loadAdventure(store), store), /older saves/);
  assert.equal(store.getItem(LEGACY_SAVE_KEYS[1]), old);
});

test('Practice/Circuit nested Journey survives save/refresh/exit with no transient or secret fields', () => {
  for (const type of ['START_PRACTICE', 'START_CIRCUIT']) {
    const journey = createAdventure({ trainerName: 'Ari', starterId: 'kitewhisk' });
    journey.flags.questStarted = true;
    journey.apiKey = 'secret-marker';
    journey.dialogue = { text: 'secret-marker', speaker: 'Mara' };
    const local = act(journey, type);
    const snapshot = toAdventureSave(local);
    assert.equal(JSON.stringify(snapshot).includes('secret-marker'), false);
    const loaded = fromAdventureSave(snapshot);
    assert.ok(loaded);
    const returned = act(loaded, 'EXIT_MODE');
    assert.equal(returned.mode, 'journey');
    assert.equal(returned.flags.questStarted, true);
    assert.equal(returned.team[0].xp, journey.team[0].xp);
    assert.equal(returned.battle, null);
    assert.equal(returned.dialogue, null);
    assert.deepEqual(returned.inventory, journey.inventory);
    snapshot.returnJourney.returnJourney = toAdventureSave(createAdventure());
    assert.equal(fromAdventureSave(snapshot), null, 'nested nesting rejected');
  }
});

test('puzzle progress is transient, but solved relay evidence and XP persist once', () => {
  let state = createAdventure();
  const relay = ADVENTURE_REGIONS.archive.objects.find(object => object.id === 'relay');
  state = { ...state, locationId: 'archive', discoveries: ['frontier', 'archive'], x: relay.x, y: relay.y + 1,
    flags: { ...state.flags, questStarted: true, shardFound: true, wispDefeated: true, noteRead: true },
    inventory: { ...state.inventory, 'signal-shard': 1, 'clear-circuit': 1 } };
  state = act(act(state, 'INTERACT'), 'PUZZLE_CHOICE', { lamp: 'amber' });
  assert.equal(state.puzzle.step, 1);
  const resumed = fromAdventureSave(toAdventureSave(state));
  assert.equal(resumed.puzzle, null);
  assert.equal(resumed.flags.relayRestored, false);
  state = act(state, 'PUZZLE_CHOICE', { lamp: 'cyan' });
  const solved = fromAdventureSave(toAdventureSave(state));
  assert.equal(solved.flags.relayRestored, true);
  assert.equal(solved.team[0].xp, 20);
  assert.equal(act(solved, 'PUZZLE_CHOICE', { lamp: 'cyan' }), solved);
});

test('corruption sweep never throws or resurrects missing team members', () => {
  const saved = toAdventureSave(createAdventure());
  for (const key of Object.keys(saved)) for (const bad of [null, [], {}, false, -1, 'corrupt']) {
    const candidate = { ...saved, [key]: bad };
    assert.doesNotThrow(() => fromAdventureSave(candidate));
  }
  assert.equal(FLAG_IDS.length, 8);
  assert.equal(STARTER_IDS.length, 3);
  assert.equal(Object.keys(ADVENTURE_REGIONS).length, 3);
});
