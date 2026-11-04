import { REGIONS } from './world.js';

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
export const FLAG_IDS = ['questStarted', 'shardFound', 'wispDefeated', 'recruited', 'noteRead', 'relayRestored', 'bossDefeated', 'questComplete', ...SUNWARD_FLAG_IDS];
export const QUESTS = [
  { id: 'signal', name: 'The Lantern Signal', flag: 'questStarted', objective: 'Ask Mara about the dark relay lantern.' },
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
