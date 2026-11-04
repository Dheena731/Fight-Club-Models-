import { REGIONS } from './world.js';

export const CHAPTER_ID = 'lantern-signal';
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
];
export const FLAG_IDS = ['questStarted', 'shardFound', 'wispDefeated', 'recruited', 'noteRead', 'relayRestored', 'bossDefeated', 'questComplete'];
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

export const getMove = id => MOVES.find(move => move.id === id) || null;
export const getEncounter = id => Object.hasOwn(ENCOUNTERS, id) ? ENCOUNTERS[id] : null;
export const getCompanion = id => COMPANIONS.find(companion => companion.id === id) || null;
