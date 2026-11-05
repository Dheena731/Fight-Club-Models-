import { REGIONS } from './world.js';
import { expandInhabitedWorld, TOWN_FLAG_IDS } from './inhabitedContent.js';

export const CHAPTER_ID = 'lantern-signal';
export const MAP_REVISION = 2;
export const STARTER_IDS = ['emberquill', 'kitewhisk', 'duplet'];
export const COMPANIONS = [
  { id: 'emberquill', name: 'Emberquill', affinity: 'Ember', role: 'Protector', color: '#d97757', description: 'A patient owl who wards the team against heavy signals.', baseHp: 36, maxEnergy: 5, moves: ['strike', 'ward', 'overcharge'] },
  { id: 'kitewhisk', name: 'Kitewhisk', affinity: 'Grove', role: 'Pathfinder', color: '#45c6a5', description: 'A quick fox who finds openings between enemy plans.', baseHp: 32, maxEnergy: 6, moves: ['strike', 'ward', 'overcharge', 'fork'] },
  { id: 'duplet', name: 'Duplet', affinity: 'Tide', role: 'Rememberer', color: '#77adff', description: 'Two small partners who recall a clue when a signal gathers.', baseHp: 34, maxEnergy: 6, moves: ['strike', 'ward', 'overcharge', 'recall'] },
  { id: 'mossback', name: 'Mossback', affinity: 'Grove', role: 'Support', color: '#9bb677', description: 'A gentle route guardian ready to share the journey.', baseHp: 40, maxEnergy: 5, moves: ['strike', 'ward', 'recall'] },
];

export const MOVES = [
  { id: 'strike', name: 'Signal Strike', cost: 0, damage: 7, guard: 0, restore: 1, description: 'A reliable hit. Restore 1 energy.' },
  { id: 'ward', name: 'Ward', cost: 0, damage: 3, guard: 13, restore: 2, description: 'Block up to 13 damage this turn. Restore 2 energy.' },
  { id: 'overcharge', name: 'Overcharge', cost: 3, damage: 16, guard: 0, restore: 0, description: 'Spend 3 energy for a stronger signal.' },
  { id: 'fork', name: 'Fork', cost: 2, damage: 10, guard: 3, restore: 0, description: 'Commit to an opening: +5 damage while the enemy gathers.' },
  { id: 'recall', name: 'Recall', cost: 2, damage: 10, guard: 5, restore: 0, description: 'Recall the Archive clue: +5 damage while a signal gathers, after reading the notes.' },
];

const intent = (id, name, damage, description) => ({ id, name, damage, description });
export const ENCOUNTERS = {
  'static-wisp': { id: 'static-wisp', name: 'Static Wisp', maxHp: 30, xp: 25, flag: 'wispDefeated', rewardIds: ['badge-static-clear'], intents: [intent('gather', 'Gathering Static', 0, 'The Wisp gathers light. Strike now; a surge follows.'), intent('surge', 'Static Surge', 12, 'A heavy surge is coming. Ward can absorb it.'), intent('spark', 'Fading Spark', 5, 'A small spark leaves an opening.')] },
  'archive-warden': { id: 'archive-warden', name: 'Archive Warden', maxHp: 64, xp: 40, flag: 'bossDefeated', rewardIds: ['badge-archive-warden'], intents: [intent('gather', 'Read the Record', 0, 'The Warden recalls its next pattern. Attack the opening.'), intent('surge', 'Sealed Verdict', 15, 'A strong verdict approaches. Ward or use a healthy teammate.'), intent('sweep', 'Shelf Sweep', 7, 'A measured sweep crosses the room.')] },
  'practice-wisp': { id: 'practice-wisp', name: 'Practice Wisp', maxHp: 30, xp: 0, rewardIds: [], intents: [intent('gather', 'Practice Wind-up', 0, 'A safe opening before the demonstration strike.'), intent('surge', 'Practice Strike', 10, 'Try Ward against this strike.')] },
  'rival-scout': { id: 'rival-scout', name: 'Ivo and Zipcat', maxHp: 32, xp: 0, rewardIds: [], intents: [intent('gather', 'Scout the Path', 0, 'Ivo pauses to plan.'), intent('dash', 'Quick Dash', 9, 'A fast dash is coming.')] },
  'rival-scholar': { id: 'rival-scholar', name: 'Neri and Latticewing', maxHp: 44, xp: 0, rewardIds: [], intents: [intent('gather', 'Study', 0, 'Neri studies your stance.'), intent('surge', 'Recall Beam', 13, 'A focused beam is coming.'), intent('sweep', 'Wingbeat', 5, 'A small wingbeat follows.')] },
  'rival-keeper': { id: 'rival-keeper', name: 'Mara and Rampart', maxHp: 56, xp: 0, rewardIds: [], intents: [intent('gather', 'Keep the Light', 0, 'Mara prepares a powerful signal.'), intent('surge', 'Lantern Burst', 15, 'Ward against the lantern burst.'), intent('sweep', 'Afterglow', 7, 'The afterglow is weaker.')] },
};
export const CIRCUIT_IDS = ['rival-scout', 'rival-scholar', 'rival-keeper'];
export const MAX_BATTLE_TURNS = 40;
export const ITEMS = [
  { id: 'potion', name: 'Field Tonic', description: 'Restore 22 HP to a living companion.', heal: 22 },
  { id: 'ether', name: 'Signal Tea', description: 'Restore 3 energy to a living companion.', energy: 3 },
  { id: 'signal-shard', name: 'Signal Shard', description: 'Quest evidence for the Archive relay.' },
  { id: 'clear-circuit', name: 'Clear Circuit', description: 'A record of clearing the Static Wisp.' },
  { id: 'lantern-emblem', name: 'Lantern Emblem', description: 'Mara’s homecoming gift.' },
  { id: 'keeper-lens', name: 'Keeper’s Lens', description: 'A weathered signal lens. Return it to Sela in Sunward Pass.' },
];
export const SUNWARD_FLAG_IDS = ['lensQuestStarted', 'windClueRead', 'lensRecovered', 'lensReturned', 'overlookFound'];
export const EXPLORATION_FLAG_IDS = ['millWheelSeen', 'waterfallFound', 'riverCacheFound', 'orchardLetterRead', 'gardenFound', 'orchardCacheFound', 'ruinsRead', 'observatoryFound', 'highlandCacheFound'];
export const FLAG_IDS = ['questStarted', 'shardFound', 'wispDefeated', 'recruited', 'noteRead', 'relayRestored', 'bossDefeated', 'questComplete', ...SUNWARD_FLAG_IDS, ...EXPLORATION_FLAG_IDS, ...TOWN_FLAG_IDS];
export const TRAVERSAL_DURATION_MS = { jump: 420, climb: 760, ledge: 320 };
export const QUESTS = [
  { id: 'signal', name: 'The Lantern Signal', flag: 'questStarted', objective: 'Find Mara by the old lantern, west of Market Street.' },
  { id: 'shard', name: 'A Lost Light', flag: 'shardFound', objective: 'Recover the Signal Shard in Moss Circuit.' },
  { id: 'static', name: 'Quiet the Circuit', flag: 'wispDefeated', objective: 'Challenge the visible Static Wisp. Read its intent and try Ward.' },
  { id: 'notes', name: 'Recall the Record', flag: 'noteRead', objective: 'Read the Relay Notes in the Forgotten Archive.' },
  { id: 'relay', name: 'Two Lamps', flag: 'relayRestored', objective: 'Apply the remembered lamp sequence at the Archive Relay.' },
  { id: 'warden', name: 'The Last Watch', flag: 'bossDefeated', objective: 'Defeat the Archive Warden beyond the restored relay.' },
  { id: 'homecoming', name: 'Lantern Keeper', flag: 'questComplete', objective: 'Return to Mara in Frontier Crossing for the homecoming.' },
];
export const LAMP_CHOICES = [{ id: 'amber', name: 'Amber' }, { id: 'cyan', name: 'Cyan' }];
export const RELAY_SEQUENCE = ['amber', 'cyan'];

// Keep the authored tile/rectangle shape understood by the existing renderer.
export const ADVENTURE_REGIONS = Object.fromEntries(Object.entries(REGIONS).map(([id, region]) => [id, {
  ...region, width: 20, height: 12,
  objects: region.objects.map(object => object.id === 'static' ? { ...object, encounterId: 'static-wisp' } : { ...object }),
}]));
ADVENTURE_REGIONS.frontier.objects.push(
  { id: 'rest', type: 'rest', x: 8, y: 7, name: 'Keeper’s Rest', color: '#f3d397' },
  { id: 'signpost', type: 'sign', x: 16, y: 7, name: 'Crossing Signpost', color: '#bd936c' },
  { id: 'circuit-board', type: 'circuit', x: 14, y: 9, name: 'Rival Circuit Board', color: '#e97677' },
  { id: 'practice-board', type: 'practice', x: 15, y: 7, name: 'Practice Board', color: '#e9be7b' },
);
ADVENTURE_REGIONS.archive.objects.push({ id: 'guardian', type: 'enemy', encounterId: 'archive-warden', x: 10, y: 3, name: 'Archive Warden', color: '#bba9ef' });

// Authored space around the chapter beats, rather than recolored prototype rooms.
Object.assign(ADVENTURE_REGIONS.frontier, {
  width: 28, height: 18, spawn: { x: 12, y: 11 },
  path: [{ x: 1, y: 9, w: 26, h: 3 }, { x: 12, y: 3, w: 3, h: 14 }, { x: 4, y: 10, w: 2, h: 6 }, { x: 20, y: 6, w: 3, h: 7 }],
  solid: [{ x: 3, y: 3, w: 7, h: 4 }, { x: 20, y: 3, w: 5, h: 3 }, { x: 12, y: 14, w: 6, h: 3 }],
});
const townPositions = { guide: [10, 9], lantern: [13, 8], arena: [22, 8], 'grove-gate': [26, 10], 'archive-gate': [4, 15], rest: [9, 11], signpost: [17, 10], 'circuit-board': [20, 12], 'practice-board': [21, 10] };
ADVENTURE_REGIONS.frontier.objects = ADVENTURE_REGIONS.frontier.objects.map(object => ({ ...object, x: townPositions[object.id][0], y: townPositions[object.id][1], ...(object.id === 'grove-gate' ? { entry: { x: 2, y: 10 } } : object.id === 'archive-gate' ? { entry: { x: 23, y: 13 } } : {}) }));
Object.assign(ADVENTURE_REGIONS.grove, {
  width: 28, height: 18, spawn: { x: 2, y: 10 },
  path: [{ x: 1, y: 9, w: 25, h: 3 }, { x: 20, y: 8, w: 3, h: 8 }],
  solid: [{ x: 4, y: 3, w: 5, h: 4 }, { x: 12, y: 2, w: 4, h: 4 }, { x: 20, y: 2, w: 5, h: 3 }, { x: 4, y: 13, w: 8, h: 3 }, { x: 24, y: 12, w: 3, h: 4 }],
});
const grovePositions = { 'frontier-gate': [1, 10], ranger: [9, 9], shard: [21, 14], static: [23, 8] };
ADVENTURE_REGIONS.grove.objects = ADVENTURE_REGIONS.grove.objects.map(object => ({ ...object, x: grovePositions[object.id][0], y: grovePositions[object.id][1], ...(object.type === 'exit' ? { entry: { x: 25, y: 10 } } : {}) }));
Object.assign(ADVENTURE_REGIONS.archive, {
  width: 26, height: 18, spawn: { x: 23, y: 13 },
  path: [{ x: 2, y: 12, w: 23, h: 3 }, { x: 12, y: 4, w: 3, h: 12 }],
  solid: [{ x: 3, y: 3, w: 6, h: 5 }, { x: 18, y: 3, w: 5, h: 5 }, { x: 3, y: 10, w: 4, h: 1 }, { x: 19, y: 10, w: 4, h: 1 }],
});
const archivePositions = { 'frontier-gate': [24, 13], 'archive-note': [8, 12], relay: [13, 9], scholar: [17, 12], guardian: [13, 5] };
ADVENTURE_REGIONS.archive.objects = ADVENTURE_REGIONS.archive.objects.map(object => ({ ...object, x: archivePositions[object.id][0], y: archivePositions[object.id][1], ...(object.type === 'exit' ? { entry: { x: 5, y: 14 } } : {}) }));

// A passable trailhead preserves every valid position in existing revision-2 saves.
ADVENTURE_REGIONS.grove.objects.push({ id: 'sunward-gate', type: 'exit', passable: true, x: 25, y: 10, name: 'Sunward Pass', to: 'sunward', entry: { x: 3, y: 16 }, color: '#d3ad64' });
ADVENTURE_REGIONS.sunward = {
  id: 'sunward', name: 'Sunward Pass', subtitle: 'Two ridge roads above the sleeping relay', biome: 'sunward',
  width: 36, height: 24, spawn: { x: 3, y: 16 },
  fieldPalette: { grass: '#adb66c', grass2: '#bdc77a', path: '#d2b27b', dark: '#5b6546', light: '#f5d98f' },
  path: [
    { x: 2, y: 15, w: 30, h: 3 }, { x: 8, y: 6, w: 3, h: 12 },
    { x: 9, y: 6, w: 22, h: 3 }, { x: 28, y: 4, w: 3, h: 17 },
    { x: 16, y: 18, w: 15, h: 3 }, { x: 16, y: 16, w: 3, h: 5 },
  ],
  solid: [
    { x: 3, y: 3, w: 4, h: 10, kind: 'trees' }, { x: 11, y: 2, w: 5, h: 3 },
    { x: 18, y: 1, w: 8, h: 4 }, { x: 12, y: 10, w: 4, h: 5 },
    { x: 18, y: 10, w: 8, h: 4 }, { x: 32, y: 3, w: 3, h: 11 },
    { x: 4, y: 20, w: 10, h: 3 }, { x: 20, y: 21, w: 7, h: 2 },
    { x: 32, y: 18, w: 3, h: 5 },
  ],
  objects: [
    { id: 'grove-gate', type: 'exit', x: 2, y: 16, name: 'Moss Circuit', to: 'grove', entry: { x: 24, y: 10 }, color: '#74c9a9' },
    { id: 'routekeeper', type: 'npc', x: 7, y: 16, name: 'Sela the Routekeeper', color: '#c78e63' },
    { id: 'ridge-sign', type: 'sign', x: 9, y: 14, name: 'Ridge Fork', color: '#bd936c' },
    { id: 'wind-marker', type: 'lore', x: 18, y: 7, name: 'Wind Marker', color: '#e2c17d' },
    { id: 'keeper-lens', type: 'pickup', x: 29, y: 5, name: 'Keeper’s Lens', hiddenFlag: 'lensRecovered', color: '#f7df9c' },
    { id: 'pass-memorial', type: 'sign', x: 18, y: 18, name: 'Keepers’ Memorial', color: '#b9a58c' },
    { id: 'sunward-overlook', type: 'lore', x: 29, y: 19, name: 'Lantern Overlook', color: '#eed990' },
  ],
};

export const getMove = id => MOVES.find(move => move.id === id) || null;
export const getEncounter = id => Object.hasOwn(ENCOUNTERS, id) ? ENCOUNTERS[id] : null;
export const getCompanion = id => COMPANIONS.find(companion => companion.id === id) || null;

// New gateways remain passable so revision-2 saves keep their exact coordinates.
ADVENTURE_REGIONS.frontier.path.push({ x: 20, y: 12, w: 3, h: 4 }, { x: 20, y: 14, w: 7, h: 2 });
ADVENTURE_REGIONS.sunward.path.push({ x: 31, y: 15, w: 4, h: 3 });
ADVENTURE_REGIONS.frontier.objects.push({ id: 'riverlands-gate', type: 'exit', passable: true, x: 25, y: 15, name: 'Amber Riverlands', to: 'riverlands', entry: { x: 3, y: 29 }, color: '#91c5bc' });
ADVENTURE_REGIONS.sunward.objects.push({ id: 'highlands-gate', type: 'exit', passable: true, x: 33, y: 16, name: 'Starfall Highlands', to: 'highlands', entry: { x: 47, y: 32 }, color: '#b3b1c7' });

ADVENTURE_REGIONS.riverlands = {
  id: 'riverlands', name: 'Amber Riverlands', subtitle: 'The mill road follows a river down from the falls', biome: 'riverlands', width: 56, height: 40,
  routeHint: 'The lower bridge passes the watermill; the upper bridge reaches the orchard road in the northeast. Follow the western riverbank north to Amber Falls. The stream jump is a shortcut beside the reedbank.',
  spawn: { x: 3, y: 29 }, fieldPalette: { grass: '#93b97b', grass2: '#a7c48a', path: '#c9b17c', dark: '#465c4c', light: '#e2ddad' },
  path: [
    { x: 2, y: 28, w: 50, h: 3 }, { x: 13, y: 12, w: 3, h: 19 },
    { x: 13, y: 12, w: 38, h: 3 }, { x: 48, y: 12, w: 3, h: 19 },
    { x: 20, y: 5, w: 3, h: 9 }, { x: 7, y: 20, w: 14, h: 3 },
    { x: 35, y: 32, w: 3, h: 5 }, { x: 35, y: 34, w: 13, h: 3 },
  ],
  terrain: [
    { kind: 'sand', x: 23, y: 1, w: 10, h: 38 },
    { kind: 'water', x: 25, y: 1, w: 6, h: 38 },
    { kind: 'water', x: 12, y: 17, w: 2, h: 8 },
    { kind: 'mud', x: 31, y: 23, w: 3, h: 9 },
    { kind: 'stone', x: 19, y: 4, w: 6, h: 4 },
    { kind: 'bridge', x: 24, y: 12, w: 8, h: 3 },
    { kind: 'bridge', x: 24, y: 28, w: 8, h: 3 },
    { kind: 'stone', x: 32, y: 29, w: 10, h: 3 },
  ],
  solid: [
    { kind: 'trees', x: 3, y: 3, w: 8, h: 8 }, { kind: 'trees', x: 3, y: 33, w: 10, h: 5 },
    { kind: 'trees', x: 16, y: 3, w: 3, h: 6 }, { kind: 'rock', x: 16, y: 17, w: 6, h: 2 },
    { kind: 'rock', x: 19, y: 34, w: 5, h: 4 }, { kind: 'mill', x: 34, y: 23, w: 8, h: 6 },
    { kind: 'house', x: 39, y: 5, w: 7, h: 5 }, { kind: 'trees', x: 33, y: 16, w: 12, h: 3 },
    { kind: 'trees', x: 51, y: 20, w: 4, h: 8 }, { kind: 'rock', x: 43, y: 37, w: 8, h: 2 },
    { kind: 'rock', x: 26, y: 1, w: 4, h: 3 },
  ],
  decorations: [
    { kind: 'waterfall', x: 26, y: 3, w: 4, h: 5 },
    { kind: 'pebble', x: 5, y: 28, w: 6 }, { kind: 'pebble', x: 17, y: 29, w: 5 },
    { kind: 'flowers', x: 5, y: 14, w: 5, h: 3 }, { kind: 'reeds', x: 23, y: 17, h: 7 },
    { kind: 'reeds', x: 31, y: 32, h: 5 }, { kind: 'stump', x: 9, y: 31 },
    { kind: 'crate', x: 42, y: 26 }, { kind: 'crate', x: 41, y: 30 },
    { kind: 'flowers', x: 45, y: 7, w: 3, h: 3 }, { kind: 'pebble', x: 21, y: 8, w: 3 },
    { kind: 'fence', x: 33, y: 16, w: 12 }, { kind: 'reeds', x: 11, y: 18, h: 3 },
  ],
  objects: [
    { id: 'frontier-gate', type: 'exit', x: 2, y: 29, name: 'Frontier Crossing', to: 'frontier', entry: { x: 24, y: 15 }, color: '#d2b273' },
    { id: 'orchard-gate', type: 'exit', x: 53, y: 13, name: 'Hearthbloom Orchard', to: 'orchard', entry: { x: 3, y: 26 }, color: '#c2b47e' },
    { id: 'river-waystone', type: 'sign', appearance: 'waystone', x: 7, y: 27, name: 'Two Bridges Waystone', text: 'The north bridge reaches the orchard cottages. The south bridge passes the watermill. Both cross the Amber River; follow the western bank north to find the falls.', color: '#d4bd8a' },
    { id: 'miller', type: 'npc', x: 33, y: 31, name: 'Toma the Miller', text: 'The river turns my wheel before it carries our flour home. You can cross at either bridge. There is a narrow side stream west of here: a marked jump saves a long walk around its bank.', color: '#b88c68' },
    { id: 'mill-wheel', type: 'lore', appearance: 'waystone', x: 33, y: 27, name: 'Amber Watermill', discoveryFlag: 'millWheelSeen', text: 'The wheel taps out a patient rhythm. Someone has carved the keeper’s promise into the millstone: a light, a loaf, a road home.', color: '#c3a06b' },
    { id: 'river-mailbox', type: 'lore', appearance: 'mailbox', x: 42, y: 11, name: 'Miller’s Mailbox', text: 'A flour-dusted letter: “Toma — the orchard bridge is clear. Bring the sacks by the upper road; we have left room in the cottage store.”', color: '#aa705c' },
    { id: 'waterfall-view', type: 'lore', appearance: 'bench', x: 22, y: 4, name: 'Amber Falls', discoveryFlag: 'waterfallFound', text: 'Cold spray hangs over the cliff. Far below, two bridges stitch the riverbanks together. The river begins here; the crossing’s everyday work begins with it.', color: '#b4d7cd' },
    { id: 'river-cache', type: 'lore', appearance: 'cache', x: 8, y: 20, name: 'Reedbank Field Tin', discoveryFlag: 'riverCacheFound', secret: true, text: 'Under the reeds, a surveyor’s tin holds a tiny map of the river bend. “Take the bridges when the water rises. The short jump is only for the narrow stream.” Discovery recorded; the tin stays for the next walker.', color: '#bcb786' },
    { id: 'mill-bench', type: 'lore', appearance: 'bench', x: 45, y: 35, name: 'Millpond Bench', text: 'The cottages of Hearthbloom sit above the northern road. From here you can hear the wheel, the water and almost nothing else.', color: '#b69573' },
    { id: 'stream-jump-sign', type: 'sign', appearance: 'waystone', x: 10, y: 23, name: 'Narrow Stream Crossing', text: 'Marked jump: stand at the pale stone on the west bank, face east and Jump. The far bank has a return jump. You can also walk around the stream to the north or south.', color: '#d4c99b' },
  ],
  traversals: [
    { id: 'reedbank-jump-east', kind: 'jump', from: { x: 11, y: 21 }, to: { x: 14, y: 21 }, facing: 'right', label: 'Jump the stream' },
    { id: 'reedbank-jump-west', kind: 'jump', from: { x: 14, y: 21 }, to: { x: 11, y: 21 }, facing: 'left', label: 'Jump the stream' },
  ],
};

ADVENTURE_REGIONS.orchard = {
  id: 'orchard', name: 'Hearthbloom Orchard', subtitle: 'Cottage gardens climb the warm terraces', biome: 'orchard', width: 48, height: 36,
  routeHint: 'The central lane and western climbing holds reach the cottage terrace. Follow its stone road east, then north to the highlands. The garden bridges loop through the eastern fields.',
  spawn: { x: 3, y: 26 }, fieldPalette: { grass: '#a9be7c', grass2: '#bbcd8e', path: '#ceb184', dark: '#5d6247', light: '#f0d5a1' },
  path: [
    { x: 2, y: 25, w: 41, h: 3 }, { x: 21, y: 9, w: 3, h: 19 },
    { x: 7, y: 10, w: 34, h: 3 }, { x: 39, y: 10, w: 3, h: 18 },
    { x: 8, y: 10, w: 3, h: 16 }, { x: 28, y: 20, w: 14, h: 3 },
    { x: 28, y: 20, w: 3, h: 12 }, { x: 28, y: 29, w: 15, h: 3 },
    { x: 39, y: 6, w: 3, h: 7 }, { x: 39, y: 6, w: 7, h: 3 },
  ],
  terrain: [
    { kind: 'stone', x: 7, y: 9, w: 35, h: 4 }, { kind: 'dirt', x: 12, y: 17, w: 7, h: 6 },
    { kind: 'dirt', x: 26, y: 16, w: 6, h: 7 }, { kind: 'mud', x: 33, y: 18, w: 4, h: 13 },
    { kind: 'water', x: 34, y: 18, w: 2, h: 13 },
    { kind: 'bridge', x: 33, y: 20, w: 4, h: 3 }, { kind: 'bridge', x: 33, y: 27, w: 4, h: 3 },
    { kind: 'stone', x: 7, y: 14, w: 5, h: 4 }, { kind: 'sand', x: 40, y: 3, w: 5, h: 3 },
  ],
  solid: [
    { kind: 'house', x: 12, y: 4, w: 7, h: 5 }, { kind: 'house', x: 27, y: 4, w: 7, h: 5 },
    { kind: 'house', x: 5, y: 28, w: 8, h: 5 }, { kind: 'rock', x: 4, y: 13, w: 16, h: 3 },
    { kind: 'rock', x: 25, y: 13, w: 14, h: 3 },
    { kind: 'trees', x: 3, y: 3, w: 5, h: 5 }, { kind: 'trees', x: 14, y: 29, w: 10, h: 5 },
    { kind: 'trees', x: 42, y: 14, w: 5, h: 9 }, { kind: 'trees', x: 2, y: 18, w: 4, h: 5 },
    { kind: 'rock', x: 40, y: 33, w: 6, h: 2 },
  ],
  decorations: [
    { kind: 'flowers', x: 13, y: 17, w: 5, h: 5 }, { kind: 'flowers', x: 27, y: 17, w: 4, h: 5 },
    { kind: 'flowers', x: 15, y: 9, w: 4 }, { kind: 'flowers', x: 28, y: 9, w: 5 },
    { kind: 'fence', x: 4, y: 13, w: 16 }, { kind: 'fence', x: 25, y: 13, w: 14 },
    { kind: 'crate', x: 25, y: 26 }, { kind: 'crate', x: 26, y: 26 }, { kind: 'stump', x: 7, y: 23 },
    { kind: 'pebble', x: 22, y: 16, h: 6 }, { kind: 'reeds', x: 36, y: 23, h: 4 },
    { kind: 'flowers', x: 42, y: 4, w: 2, h: 2 }, { kind: 'pebble', x: 40, y: 7, w: 4 },
  ],
  objects: [
    { id: 'riverlands-gate', type: 'exit', x: 2, y: 26, name: 'Amber Riverlands', to: 'riverlands', entry: { x: 52, y: 13 }, color: '#a3c8b2' },
    { id: 'highlands-gate', type: 'exit', x: 45, y: 7, name: 'Starfall Highlands', to: 'highlands', entry: { x: 3, y: 32 }, color: '#bcb8d4' },
    { id: 'orchard-waystone', type: 'sign', appearance: 'waystone', x: 20, y: 24, name: 'Terrace Waystone', text: 'North: cottages and the highland road. East: kitchen garden and irrigation bridges. A ladder in the western terrace shortens the climb; the central path stays open.', color: '#cbbb8c' },
    { id: 'orchard-keeper', type: 'npc', x: 24, y: 11, name: 'Bela the Gardener', text: 'The lower gardens grow food; the upper terraces grow the trees that shelter it. Follow the stone road east for the highlands. Leave the gates as you find them, and have a look in the mailboxes if you want the news.', color: '#bc8b73' },
    { id: 'cottage-mailbox', type: 'lore', appearance: 'mailbox', x: 17, y: 10, name: 'Blue Cottage Mailbox', discoveryFlag: 'orchardLetterRead', text: 'A letter from the crossing: “The keeper is still at her lantern. Send apples when the river road clears. The new trainer has a companion and a look of determination.”', color: '#83a7b4' },
    { id: 'upper-mailbox', type: 'lore', appearance: 'mailbox', x: 31, y: 10, name: 'Orchard Cottage Mailbox', text: 'A folded note: “The observatory path is open. Take the switchbacks if you have heavy bags; the old climbing holds are only a shortcut.”', color: '#b77e68' },
    { id: 'kitchen-garden', type: 'lore', appearance: 'bench', x: 30, y: 23, name: 'Hearthbloom Kitchen Garden', discoveryFlag: 'gardenFound', secret: true, text: 'Beans climb their poles; marigolds keep watch between the rows. A gardener’s sign asks visitors to take a memory and leave the harvest for the cottages.', color: '#d4b86e' },
    { id: 'orchard-cache', type: 'lore', appearance: 'cache', x: 43, y: 4, name: 'Terrace Keepsake Box', discoveryFlag: 'orchardCacheFound', secret: true, text: 'Behind the upper cottage lane sits a box of pressed leaves and hand-drawn stars. Someone has been walking between the orchard and the observatory for years. Discovery recorded; the keepsakes stay here.', color: '#c8b87a' },
    { id: 'orchard-bench', type: 'lore', appearance: 'bench', x: 39, y: 31, name: 'Irrigation Bench', text: 'The little channels carry the same water that turns Toma’s mill. From this bridge, the whole route begins to feel like one place.', color: '#a88c69' },
    { id: 'terrace-ladder-sign', type: 'sign', appearance: 'waystone', x: 9, y: 18, name: 'Western Terrace Ladder', text: 'Climbing holds: stand on the stone below the western terrace, face north and Climb. Use the same holds to climb down. The central lane offers a walking route.', color: '#d6c797' },
  ],
  traversals: [
    { id: 'orchard-terrace-up', kind: 'climb', from: { x: 10, y: 16 }, to: { x: 10, y: 12 }, facing: 'up', label: 'Climb the terrace' },
    { id: 'orchard-terrace-down', kind: 'climb', from: { x: 10, y: 12 }, to: { x: 10, y: 16 }, facing: 'down', label: 'Climb down' },
  ],
};

ADVENTURE_REGIONS.highlands = {
  id: 'highlands', name: 'Starfall Highlands', subtitle: 'Old switchbacks lead to the keeper of the distant stars', biome: 'highlands', width: 52, height: 40,
  routeHint: 'The west and east switchbacks reach the old ruins and observatory. Climbing holds cross the middle cliff; the south ledge is a one-way shortcut down. The southeast road continues freely to Sunward Pass; its beacon lift is a second way home once Sela’s lens is returned.',
  spawn: { x: 3, y: 32 }, fieldPalette: { grass: '#a0af94', grass2: '#b7c2a7', path: '#bfb39b', dark: '#5b5d65', light: '#dfd6c2' },
  path: [
    { x: 2, y: 31, w: 46, h: 3 }, { x: 8, y: 17, w: 3, h: 17 },
    { x: 8, y: 17, w: 36, h: 3 }, { x: 41, y: 10, w: 3, h: 23 },
    { x: 20, y: 10, w: 24, h: 3 }, { x: 20, y: 6, w: 3, h: 7 },
    { x: 15, y: 24, w: 4, h: 9 }, { x: 16, y: 20, w: 21, h: 2 },
    { x: 32, y: 25, w: 4, h: 8 }, { x: 29, y: 5, w: 15, h: 3 },
  ],
  terrain: [
    { kind: 'stone', x: 7, y: 16, w: 38, h: 6 }, { kind: 'stone', x: 18, y: 4, w: 15, h: 9 },
    { kind: 'sand', x: 3, y: 25, w: 4, h: 5 }, { kind: 'stone', x: 32, y: 24, w: 5, h: 4 },
    { kind: 'stone', x: 15, y: 24, w: 4, h: 4 }, { kind: 'dirt', x: 38, y: 5, w: 7, h: 4 },
    { kind: 'mud', x: 23, y: 34, w: 7, h: 3 },
  ],
  solid: [
    { kind: 'rock', x: 13, y: 22, w: 28, h: 3 }, { kind: 'rock', x: 3, y: 11, w: 4, h: 12 },
    { kind: 'rock', x: 12, y: 12, w: 8, h: 3 }, { kind: 'rock', x: 26, y: 13, w: 12, h: 3 },
    { kind: 'observatory', x: 22, y: 3, w: 9, h: 6 }, { kind: 'ruins', x: 12, y: 4, w: 6, h: 5 },
    { kind: 'ruins', x: 32, y: 27, w: 5, h: 3 }, { kind: 'rock', x: 45, y: 4, w: 6, h: 14 },
    { kind: 'trees', x: 3, y: 35, w: 10, h: 4 }, { kind: 'trees', x: 17, y: 34, w: 5, h: 5 },
    { kind: 'rock', x: 36, y: 35, w: 11, h: 4 }, { kind: 'rock', x: 31, y: 1, w: 12, h: 3 },
  ],
  decorations: [
    { kind: 'pebble', x: 8, y: 27, h: 4 }, { kind: 'pebble', x: 17, y: 18, w: 9 },
    { kind: 'pebble', x: 39, y: 12, w: 4 }, { kind: 'flowers', x: 3, y: 25, w: 3, h: 4 },
    { kind: 'stump', x: 13, y: 33 }, { kind: 'crate', x: 20, y: 7 },
    { kind: 'pebble', x: 39, y: 6, w: 4 }, { kind: 'flowers', x: 31, y: 10, w: 4 },
    { kind: 'fence', x: 13, y: 22, w: 28 }, { kind: 'pebble', x: 43, y: 30, w: 3 },
  ],
  objects: [
    { id: 'orchard-gate', type: 'exit', x: 2, y: 32, name: 'Hearthbloom Orchard', to: 'orchard', entry: { x: 44, y: 7 }, color: '#c2b47e' },
    { id: 'sunward-gate', type: 'exit', x: 48, y: 32, name: 'Sunward Pass', to: 'sunward', entry: { x: 32, y: 16 }, color: '#d3b57b' },
    { id: 'highland-waystone', type: 'sign', appearance: 'waystone', x: 8, y: 30, name: 'Switchback Waystone', text: 'North: old ruins and the observatory. East: Sunward Pass and the crossing beyond it. Keep to the switchbacks for a steady walk; marked holds and ledges offer shortcuts.', color: '#b5b0a1' },
    { id: 'ruins-tablet', type: 'lore', appearance: 'waystone', x: 15, y: 10, name: 'First Keepers’ Tablet', discoveryFlag: 'ruinsRead', text: '“We built a chain of lights so no traveler would have to read the stars alone.” The first keeper’s route ran from the river to the orchard, then over this ridge.', color: '#bab7ae' },
    { id: 'star-keeper', type: 'npc', x: 21, y: 9, name: 'Orrin the Star Keeper', text: 'The observatory keeps the long record; Mara keeps tonight’s light. Both matter. Look through the telescope if you want to see the road you walked. The switchbacks will always bring you back safely.', color: '#9d98b0' },
    { id: 'observatory-telescope', type: 'lore', appearance: 'telescope', x: 32, y: 7, name: 'Starfall Observatory', discoveryFlag: 'observatoryFound', text: 'Through the old telescope, the river flashes between the orchard roofs. The crossing and Sunward ridge share one horizon. A route that felt enormous becomes a line of places you know.', color: '#bac2ce' },
    { id: 'highland-cache', type: 'lore', appearance: 'cache', x: 42, y: 5, name: 'Astronomer’s Field Box', discoveryFlag: 'highlandCacheFound', secret: true, text: 'A field box beneath the far crag holds sketches of a tiny companion carrying a lantern. The last page reads: “A good route has somewhere worth returning to.” Discovery recorded; the sketches stay beside their stars.', color: '#b8ae94' },
    { id: 'ledge-marker', type: 'sign', appearance: 'waystone', x: 35, y: 20, name: 'South Ledge Marker', text: 'One-way ledge: from the pale stone, face south to drop to the lower trail. You cannot climb this face. Return by the eastern switchback or the western climbing holds.', color: '#c4bdac' },
    { id: 'cliff-holds-sign', type: 'sign', appearance: 'waystone', x: 16, y: 27, name: 'Old Climbing Holds', text: 'Stand below the cut holds, face north and Climb. The return holds face south. The western switchback reaches the same terrace on foot.', color: '#b7b2a3' },
    { id: 'ridge-bench', type: 'lore', appearance: 'bench', x: 45, y: 29, name: 'Sunward Ridge Bench', text: 'Warm air rises from Sunward Pass. The road continues to Sela’s beacon, Moss Circuit and the lantern town. The ridge road is open. Restore Sela’s beacon to reopen the lift directly to Market Street.', color: '#aa9d84' },
  ],
  traversals: [
    { id: 'highland-holds-up', kind: 'climb', from: { x: 17, y: 25 }, to: { x: 17, y: 21 }, facing: 'up', label: 'Climb the old holds' },
    { id: 'highland-holds-down', kind: 'climb', from: { x: 17, y: 21 }, to: { x: 17, y: 25 }, facing: 'down', label: 'Climb down' },
    { id: 'highland-south-ledge', kind: 'ledge', from: { x: 34, y: 21 }, to: { x: 34, y: 25 }, facing: 'down', label: 'Drop from the ledge' },
  ],
};

expandInhabitedWorld(ADVENTURE_REGIONS);

export const WORLD_PROJECTS = [
  { id: 'canal-ferry', name: 'Reopen the Canal Ferry', flag: 'wheelRepaired', benefit: 'A two-way ferry connects the town dock directly to Amber Watermill.', stages: [
    { flag: 'wheelRequested', regionId: 'amber-mill', objectId: 'mill-maintenance', objective: 'Read the maintenance ledger inside Amber Watermill.' },
    { flag: 'bearingReady', regionId: 'lantern-workshop', objectId: 'workshop-smith', objective: 'Collect the fitted bearing from Rusk in Lantern Workshop.' },
    { flag: 'wheelRepaired', regionId: 'amber-mill', objectId: 'mill-inspection-hatch', objective: 'Fit the bearing at the mill inspection hatch to power the ferry winch.' },
  ] },
  { id: 'beacon-lift', name: 'Restore the Beacon Lift', flag: 'lensReturned', benefit: 'A two-way lift connects Market Street to the Sunward overlook.', stages: [
    { flag: 'lensQuestStarted', regionId: 'sunward', objectId: 'routekeeper', objective: 'Meet Sela at the western entrance to Sunward Pass.' },
    { flag: 'windClueRead', regionId: 'sunward', objectId: 'wind-marker', objective: 'Read Sela’s Wind Marker on the northern ridge.' },
    { flag: 'lensRecovered', regionId: 'sunward', objectId: 'keeper-lens', objective: 'Recover the Keeper’s Lens at the old lookout.' },
    { flag: 'lensReturned', regionId: 'sunward', objectId: 'routekeeper', objective: 'Return the lens to Sela so the lift operator can read the beacon.' },
  ] },
];

// Added gateways never occupy a formerly walkable tile with a blocking object.
ADVENTURE_REGIONS.grove.objects.push({ id: 'orchard-footpath', type: 'exit', passable: true, x: 26, y: 16, name: 'Orchard Footpath', to: 'orchard', entry: { x: 3, y: 11 }, color: '#b8bc7e' });
ADVENTURE_REGIONS.orchard.objects.push({ id: 'grove-footpath', type: 'exit', passable: true, x: 2, y: 11, name: 'Moss Circuit Footpath', to: 'grove', entry: { x: 25, y: 16 }, color: '#74c9a9' });
ADVENTURE_REGIONS.frontier.objects.push(
  { id: 'canal-ferry', type: 'exit', transport: 'ferry', berth: { x: 49, y: 40, w: 2, h: 2 }, passable: true, x: 48, y: 41, name: 'Canal Ferry · Watermill', to: 'riverlands', entry: { x: 32, y: 30 }, requiresFlag: 'wheelRepaired', lockedText: 'The ferry winch depends on the mill wheel. Read Toma’s maintenance ledger inside Amber Watermill, then ask Rusk in Lantern Workshop for the bearing.', color: '#91c5bc' },
  { id: 'beacon-lift', type: 'exit', transport: 'lift', passable: true, x: 61, y: 17, name: 'Beacon Lift · Sunward Pass', to: 'sunward', entry: { x: 30, y: 19 }, requiresFlag: 'lensReturned', lockedText: 'The lift operator cannot see the ridge signal. Reach Sunward Pass by Moss Circuit or the highlands and help Sela recover her beacon lens.', color: '#e1bd72' },
);
ADVENTURE_REGIONS.riverlands.objects.push({ id: 'canal-ferry', type: 'exit', transport: 'ferry', berth: { x: 29, y: 31, w: 2, h: 2 }, passable: true, x: 32, y: 31, name: 'Canal Ferry · Frontier Dock', to: 'frontier', entry: { x: 47, y: 41 }, requiresFlag: 'wheelRepaired', lockedText: 'The ferry winch is idle. Repair the mill bearing at the inspection hatch inside Amber Watermill to reopen this crossing.', color: '#91c5bc' });
ADVENTURE_REGIONS.sunward.objects.push({ id: 'beacon-lift', type: 'exit', transport: 'lift', passable: true, x: 31, y: 19, name: 'Beacon Lift · Market Street', to: 'frontier', entry: { x: 60, y: 17 }, requiresFlag: 'lensReturned', lockedText: 'The lift operator needs Sela’s beacon to guide the carriage. Return the Keeper’s Lens to Sela at the western trailhead.', color: '#e1bd72' });
ADVENTURE_REGIONS.grove.path.push({ x: 20, y: 15, w: 7, h: 2 });
ADVENTURE_REGIONS.orchard.path.push({ x: 2, y: 10, w: 7, h: 3 });



export function terrainAt(regionId, x, y) {
  const region = Object.hasOwn(ADVENTURE_REGIONS, regionId) ? ADVENTURE_REGIONS[regionId] : null;
  if (!region) return null;
  let kind = region.outdoor === false ? region.flooring || 'wood' : region.path.some(rect => x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h) ? regionId === 'archive' ? 'stone' : 'dirt' : 'grass';
  for (const rect of region.terrain || []) if (x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h) kind = rect.kind;
  return kind;
}
