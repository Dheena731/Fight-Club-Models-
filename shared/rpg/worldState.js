import { ABILITIES, CHAPTER, HEROES, REGIONS, WORLD_SIZE } from './world.js';
import { FACTION_ITEMS, factionForHero, factionRequirementMet, selectedChoice } from './factions.js';

export const SAVE_KEY = 'ai-frontier:save:v2';
export const SAVE_VERSION = 2;
const OLD_SAVE_KEY = 'ai-frontier:save:v1';

const MAX_HP = 30;
const MAX_ENERGY = 5;

export function createGame(heroId = 'owl') {
  const hero = HEROES.find((entry) => entry.id === heroId) || HEROES[0];
  const faction = factionForHero(hero.id);
  const region = REGIONS[faction.regionId];
  return {
    version: SAVE_VERSION,
    chapterId: CHAPTER.id,
    heroId: hero.id,
    locationId: region.id,
    x: region.spawn.x,
    y: region.spawn.y,
    hp: MAX_HP,
    energy: 3,
    xp: 0,
    level: 1,
    inventory: [],
    discoveries: [region.id],
    flags: { questStarted: false, shardFound: false, wispDefeated: false, noteRead: false, relayRestored: false, questComplete: false },
    faction: { choice: null, completed: false, reputation: 0 },
    panel: 'intro',
    dialogue: null,
    combat: null,
    puzzleStep: 0,
    message: `Choose a ${faction.name} mandate to begin.`,
    transition: null,
  };
}

function within(rect, x, y) {
  return x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h;
}

export function isWalkable(state, x, y) {
  const region = REGIONS[state.locationId];
  if (!region || x < 1 || y < 1 || x >= WORLD_SIZE.width - 1 || y >= WORLD_SIZE.height - 1) return false;
  if (region.solid.some((rect) => within(rect, x, y))) return false;
  return !region.objects.some((object) => object.x === x && object.y === y && object.type !== 'pickup');
}

export function nearbyObject(state) {
  const region = REGIONS[state.locationId];
  if (!region) return null;
  return region.objects
    .filter((object) => {
      if (object.id === 'shard' && state.flags.shardFound) return false;
      if (object.id === 'static' && state.flags.wispDefeated) return false;
      return Math.abs(object.x - state.x) + Math.abs(object.y - state.y) <= 1;
    })
    .sort((a, b) => (Math.abs(a.x - state.x) + Math.abs(a.y - state.y)) - (Math.abs(b.x - state.x) + Math.abs(b.y - state.y)))[0] || null;
}

function talk(state, speaker, text) {
  return { ...state, panel: 'dialogue', dialogue: { speaker, text }, message: text };
}

function gainXp(state, amount) {
  const xp = state.xp + amount;
  const level = xp >= 50 ? 2 : 1;
  return { ...state, xp, level, hp: level > state.level ? MAX_HP : state.hp };
}

function completeFactionQuest(state, object) {
  const faction = factionForHero(state.heroId);
  if (object.id !== faction.allyId || !state.faction.choice || state.faction.completed || !factionRequirementMet(state)) return null;
  const choice = selectedChoice(state);
  const completed = gainXp({
    ...state,
    faction: { ...state.faction, completed: true, reputation: state.faction.reputation + 2 },
    inventory: [...new Set([...state.inventory, choice.item])],
    discoveries: choice.bonus.revealMap ? Object.keys(REGIONS) : state.discoveries,
  }, 10);
  return talk(completed, object.name, `${choice.name} is done. ${faction.name} trusts you more. You gained ${choice.item}; ${choice.reward}`);
}

function collectShard(state) {
  if (state.flags.shardFound) return state;
  return talk(gainXp({
    ...state,
    flags: { ...state.flags, shardFound: true },
    inventory: [...state.inventory, 'Signal Shard'],
  }, 5), 'Signal Shard', 'A small light pulses inside the crystal. The archive relay may recognize it.');
}

function interact(state) {
  const object = nearbyObject(state);
  if (!object) return { ...state, message: 'Nothing nearby to interact with.' };
  const factionReward = completeFactionQuest(state, object);
  if (factionReward) return factionReward;
  switch (object.id) {
    case 'guide':
      if (state.flags.relayRestored && !state.flags.questComplete) {
        return talk(gainXp({
          ...state, flags: { ...state.flags, questComplete: true },
          inventory: [...state.inventory, 'Lantern Emblem'],
        }, 25), object.name, 'You restored the relay. The lantern burns again across the crossing. Take this emblem.');
      }
      if (!state.flags.questStarted) {
        return talk({ ...state, flags: { ...state.flags, questStarted: true } }, object.name,
          'Our relay lantern went dark. Find its lost Signal Shard in Moss Circuit, clear the static, and wake the Archive Relay.');
      }
      if (state.flags.questComplete) return talk(state, object.name, 'The lantern is shining. The next road will open when the frontier is ready.');
      return talk(state, object.name, state.flags.relayRestored
        ? 'I can see the signal from here. You did it.'
        : 'The shard lies east. The Archive Relay is south of town. The journal can guide you.');
    case 'lantern':
      return talk(state, 'Relay Lantern', state.flags.questComplete
        ? 'Amber light reaches the distant hills. The Lantern Signal is complete.'
        : 'The lantern is cold. Its signal is missing.');
    case 'arena':
      return { ...state, transition: 'arena', message: 'The Frontier Arena hosts live AI model matches. Provider calls may cost money.' };
    case 'grove-gate':
    case 'frontier-gate':
    case 'archive-gate':
      return {
        ...state,
        locationId: object.to, x: object.entry.x, y: object.entry.y,
        discoveries: [...new Set([...state.discoveries, object.to])],
        message: `Entered ${REGIONS[object.to].name}.`,
      };
    case 'ranger':
      return talk(state, object.name, state.heroId === 'fox' && !state.faction.completed
        ? `${selectedChoice(state)?.hint || 'Choose your mandate.'} A Static Wisp guards the eastern path; watch its next move.`
        : 'Follow the pale stones to the shard. A Static Wisp guards the eastern path; watch its next move before striking.');
    case 'shard':
      return collectShard(state);
    case 'static':
      return { ...state, panel: 'combat', combat: { enemyId: 'static-wisp', hp: 28, turn: 0, intent: 'strike', done: null, log: 'The Static Wisp crackles into view.' },
        energy: Math.min(MAX_ENERGY, state.energy + (state.heroId === 'fox' ? 1 : 0)), message: 'An offline RPG battle begins.' };
    case 'archive-note':
      return talk({ ...state, flags: { ...state.flags, noteRead: true } }, 'Relay Notes',
        'The old relay sequence is written in the margin: amber first, cyan second. This is fictional frontier lore.');
    case 'scholar':
      return talk(state, object.name, state.heroId === 'serpent' && !state.faction.completed
        ? `${selectedChoice(state)?.hint || 'Choose your mandate.'} The relay also needs its shard and a clear path.`
        : 'The relay needs its shard and a clear path. Read the nearby notes for the lamp sequence.');
    case 'relay':
      if (state.flags.relayRestored) return talk(state, object.name, 'The lamps glow steadily. The path home is safe.');
      if (!state.flags.shardFound || !state.flags.wispDefeated || !state.flags.noteRead) {
        return talk(state, object.name, 'The relay needs a Signal Shard, a quiet circuit, and the instructions in the nearby notes.');
      }
      return { ...state, panel: 'puzzle', puzzleStep: 0, message: 'Choose the two lamps in the order described by the notes.' };
    default:
      return state;
  }
}

export function currentObjective(state) {
  if (state.flags.questComplete) return 'The Lantern Signal is complete. Explore or visit the Frontier Arena.';
  if (!state.flags.questStarted) return CHAPTER.steps[0];
  if (!state.flags.shardFound) return CHAPTER.steps[1];
  if (!state.flags.wispDefeated) return CHAPTER.steps[2];
  if (!state.flags.relayRestored) return CHAPTER.steps[3];
  return CHAPTER.steps[4];
}

export function worldReducer(state, action) {
  switch (action.type) {
    case 'CHOOSE_MANDATE': {
      if (state.panel !== 'intro' || state.faction.choice) return state;
      const faction = factionForHero(state.heroId);
      const choice = faction.choices.find((entry) => entry.id === action.choiceId);
      if (!choice) return state;
      return talk({ ...state, faction: { choice: choice.id, completed: false, reputation: 0 } }, faction.allyName,
        `Your mandate: ${choice.objective} I will be your ally when you return.`);
    }
    case 'MOVE': {
      if (state.panel || state.combat || state.transition) return state;
      const x = state.x + action.dx;
      const y = state.y + action.dy;
      if (!Number.isInteger(action.dx) || !Number.isInteger(action.dy)
        || Math.abs(action.dx) + Math.abs(action.dy) !== 1 || !isWalkable(state, x, y)) return state;
      const moved = { ...state, x, y, message: '' };
      return state.locationId === 'grove' && x === 13 && y === 9 ? collectShard(moved) : moved;
    }
    case 'INTERACT':
      return state.panel || state.combat ? state : interact(state);
    case 'OPEN_PANEL':
      return ['journal', 'map', 'inventory', 'lore', 'help'].includes(action.panel) && !state.panel && !state.combat
        ? { ...state, panel: action.panel } : state;
    case 'CLOSE_PANEL':
      if (state.panel === 'intro') return state;
      if (state.panel === 'combat' && state.combat && !state.combat.done) return state;
      if (state.combat?.done === 'lost') return {
        ...state, panel: null, dialogue: null, combat: null, locationId: 'frontier', x: 9, y: 7, hp: MAX_HP,
        message: 'You recovered at Frontier Crossing. Your quest progress is safe.',
      };
      return { ...state, panel: null, dialogue: null, combat: null, puzzleStep: 0 };
    case 'PUZZLE_CHOICE':
      if (state.panel !== 'puzzle') return state;
      if (state.puzzleStep === 0 && action.lamp === 'amber') return { ...state, puzzleStep: 1, message: 'Amber hums. One lamp remains.' };
      if (state.puzzleStep === 1 && action.lamp === 'cyan') {
        return talk(gainXp({ ...state, flags: { ...state.flags, relayRestored: true }, puzzleStep: 0 }, 15),
          'Archive Relay', 'The relay is alive. Return to Mara at the Frontier lantern.');
      }
      return { ...state, puzzleStep: 0, message: 'The relay resets. Recheck the notes.' };
    case 'COMBAT_ACTION': {
      const combat = state.combat;
      if (state.panel !== 'combat' || !combat || combat.done) return state;
      const ability = ABILITIES.find((entry) => entry.id === action.abilityId);
      if (!ability || state.energy < ability.cost) return { ...state, message: 'Not enough energy for that ability.' };
      const bonus = state.faction.completed ? selectedChoice(state)?.bonus || {} : {};
      const dealt = ability.damage + (bonus[ability.id] || 0) + (state.level - 1);
      const guard = ability.guard + (ability.guard ? bonus.guard || 0 : 0);
      const energy = Math.min(MAX_ENERGY, state.energy - ability.cost + (ability.cost ? 0 : 1));
      const enemyHp = Math.max(0, combat.hp - dealt);
      if (enemyHp === 0) {
        const won = gainXp({ ...state, energy, combat: { ...combat, hp: 0, done: 'won', log: `${ability.name} defeats the Static Wisp.` }, flags: { ...state.flags, wispDefeated: true }, inventory: [...state.inventory, 'Clear Circuit'] }, 25);
        return { ...won, message: 'Victory! The circuit is quiet. Return to the Archive Relay.' };
      }
      const enemyDamage = combat.turn % 2 === 0 ? 8 : 5;
      const damageTaken = Math.max(0, enemyDamage - guard);
      const hp = Math.max(0, state.hp - damageTaken);
      return {
        ...state, hp, energy,
        combat: { ...combat, hp: enemyHp, turn: combat.turn + 1, intent: combat.turn % 2 === 0 ? 'recover' : 'strike', done: hp === 0 ? 'lost' : null,
          log: `${ability.name} dealt ${dealt}. The Wisp dealt ${damageTaken}${guard ? ' through your ward' : ''}.` },
        message: hp === 0 ? 'Defeat. You can recover at the Frontier checkpoint.' : '',
      };
    }
    case 'CLEAR_TRANSITION':
      return { ...state, transition: null };
    default:
      return state;
  }
}

export function toSave(state) {
  return {
    version: SAVE_VERSION, chapterId: CHAPTER.id, heroId: state.heroId,
    locationId: state.locationId, x: state.x, y: state.y, hp: state.hp,
    energy: state.energy, xp: state.xp, level: state.level,
    inventory: state.inventory, discoveries: state.discoveries, flags: state.flags,
    faction: { choice: state.faction.choice, completed: state.faction.completed, reputation: state.faction.reputation },
  };
}

export function fromSave(value) {
  if (!value || ![1, SAVE_VERSION].includes(value.version) || value.chapterId !== CHAPTER.id
    || !HEROES.some((hero) => hero.id === value.heroId) || !REGIONS[value.locationId]
    || !Number.isInteger(value.x) || !Number.isInteger(value.y)) return null;
  const initial = createGame(value.heroId);
  const faction = factionForHero(value.heroId);
  const choice = faction.choices.some((entry) => entry.id === value.faction?.choice) ? value.faction.choice : null;
  const candidate = {
    ...initial, locationId: value.locationId, x: value.x, y: value.y,
    hp: Number.isInteger(value.hp) ? Math.max(1, Math.min(MAX_HP, value.hp)) : MAX_HP,
    energy: Number.isInteger(value.energy) ? Math.max(0, Math.min(MAX_ENERGY, value.energy)) : 3,
    xp: Number.isInteger(value.xp) ? Math.max(0, Math.min(100000, value.xp)) : 0,
    level: value.level === 2 ? 2 : 1,
    inventory: Array.isArray(value.inventory) ? [...new Set(value.inventory.filter((item) => ['Signal Shard', 'Clear Circuit', 'Lantern Emblem', ...FACTION_ITEMS].includes(item)))].slice(0, 8) : [],
    discoveries: Array.isArray(value.discoveries) ? [...new Set(value.discoveries.filter((id) => Boolean(REGIONS[id])))] : [initial.locationId],
    flags: Object.fromEntries(Object.keys(initial.flags).map((key) => [key, value.flags?.[key] === true])),
    faction: { choice, completed: Boolean(choice && value.faction?.completed), reputation: choice && value.faction?.completed ? 2 : 0 },
    panel: choice ? null : 'intro',
    message: 'Welcome back to the Frontier.',
  };
  return isWalkable(candidate, candidate.x, candidate.y) ? candidate : null;
}

export function loadGame(storage = globalThis.localStorage) {
  for (const key of [SAVE_KEY, OLD_SAVE_KEY]) {
    try {
      const saved = fromSave(JSON.parse(storage.getItem(key) || 'null'));
      if (saved) return saved;
    } catch { /* A corrupt newer snapshot must not hide an older valid save. */ }
  }
  return null;
}

export function saveGame(state, storage = globalThis.localStorage) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(toSave(state))); return true; } catch { return false; }
}
