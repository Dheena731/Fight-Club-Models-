import { ADVENTURE_REGIONS, CHAPTER_ID, CIRCUIT_IDS, COMPANIONS, ENCOUNTERS, FLAG_IDS, ITEMS, LAMP_CHOICES, MAP_REVISION, MAX_BATTLE_TURNS, MOVES, QUESTS, RELAY_SEQUENCE, STARTER_IDS } from './adventureContent.js';

export const ADVENTURE_VERSION = 3;
export const MODES = ['journey', 'practice', 'circuit'];
export const normalizeTrainerName = name => typeof name === 'string' ? name.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 24) || 'Trainer' : 'Trainer';

export function createCompanion(id, xp = 0) {
  const content = COMPANIONS.find(entry => entry.id === id);
  if (!content || !Number.isInteger(xp) || xp < 0 || xp > 100000) throw new Error('Invalid companion or XP.');
  const level = Math.min(10, 1 + Math.floor(xp / 25));
  const maxHp = content.baseHp + (level - 1) * 4;
  return { id, name: content.name, affinity: content.affinity, level, xp, hp: maxHp, maxHp, energy: content.maxEnergy, maxEnergy: content.maxEnergy, moves: [...content.moves] };
}

export function createAdventure({ trainerName = 'Trainer', starterId = STARTER_IDS[0], mode = 'journey' } = {}) {
  if (!STARTER_IDS.includes(starterId) || !MODES.includes(mode)) throw new Error('Choose a valid starter and adventure mode.');
  const state = {
    version: ADVENTURE_VERSION, mapRevision: MAP_REVISION, runId: globalThis.crypto?.randomUUID?.() || `run-${Date.now()}-${Math.random().toString(36).slice(2)}`, chapterId: CHAPTER_ID, mode, trainerName: normalizeTrainerName(trainerName), starterId,
    team: [createCompanion(starterId)], activeId: starterId,
    locationId: 'frontier', ...ADVENTURE_REGIONS.frontier.spawn, facing: 'down',
    flags: Object.fromEntries(FLAG_IDS.map(id => [id, false])),
    inventory: { potion: 3, ether: 2, 'signal-shard': 0, 'clear-circuit': 0, 'lantern-emblem': 0, 'keeper-lens': 0 },
    discoveries: ['frontier'], battle: null, result: null, dialogue: null,
    puzzle: null, transition: null, circuit: { index: 0, wins: 0, completed: false, bestWins: 0 },
    returnJourney: null, legacy: null, message: 'Meet Mara by the lantern. No model calls are used in this adventure.',
  };
  return mode === 'journey' ? state : beginBattle(state, mode === 'practice' ? 'practice-wisp' : CIRCUIT_IDS[0]);
}

export const activeCompanion = state => state.team.find(member => member.id === state.activeId) || null;
export const enemyIntent = (encounterId, turn) => {
  const encounter = Object.hasOwn(ENCOUNTERS, encounterId) && Number.isInteger(turn) && turn >= 0 ? ENCOUNTERS[encounterId] : null;
  return encounter ? { ...encounter.intents[turn % encounter.intents.length] } : null;
};
export const battleIntent = state => state.battle ? enemyIntent(state.battle.encounterId, state.battle.turn) : null;
export const availableMoves = state => {
  const member = activeCompanion(state);
  return member ? MOVES.filter(move => member.moves.includes(move.id)).map(move => ({ ...move, usable: Boolean(state.battle && !state.result && member.hp > 0 && member.energy >= move.cost) })) : [];
};

export function unlockedRewardIds(state) {
  if (state.mode !== 'journey') return [];
  return [
    ...(state.flags.wispDefeated ? ['badge-static-clear'] : []),
    ...(state.flags.bossDefeated ? ['badge-archive-warden'] : []),
    ...(state.flags.questComplete ? ['skin-lantern', 'badge-lantern-signal', 'title-lantern-keeper'] : []),
  ];
}

export const questProgress = state => QUESTS.filter((quest, index) => index === 0 || state.flags[quest.flag] || state.flags[QUESTS[index - 1].flag]).map(quest => ({ ...quest, complete: state.flags[quest.flag] }));
export function adventureObjective(state) {
  if (state.mode === 'practice') return 'Practice only: read the intent, try commands, then retry or return. No Journey XP or rewards.';
  if (state.mode === 'circuit') return state.circuit.completed ? 'Rival Circuit complete. Your local record is separate from Journey.' : `Rival Circuit ${state.circuit.index + 1}/3: ${ENCOUNTERS[CIRCUIT_IDS[state.circuit.index]].name}. Recovery follows each fight.`;
  return QUESTS.find(quest => !state.flags[quest.flag])?.objective || 'The Lantern Signal is complete. Your town is restored; open the Locker to equip your rewards.';
}
export const lanternStatus = state => state.flags.questComplete ? 'restored' : state.flags.bossDefeated ? 'lit' : 'dark';
export const journalEntries = state => questProgress(state).map(quest => ({ id: quest.id, text: quest.objective, complete: quest.complete }));
export function sideObjective(state) {
  if (state.mode !== 'journey' || !state.flags.wispDefeated) return null;
  if (state.flags.lensReturned) return state.flags.overlookFound ? null : 'Optional: follow the southern memorial road to Lantern Overlook in Sunward Pass.';
  if (state.flags.lensRecovered) return 'Optional: return the Keeper’s Lens to Sela at the western trailhead in Sunward Pass.';
  if (state.flags.windClueRead) return 'Optional: follow the northern ridge east to the old lookout and recover Sela’s lens.';
  if (state.flags.lensQuestStarted) return 'Optional: read the Wind Marker on the northern ridge of Sunward Pass.';
  if (state.locationId === 'sunward') return 'Optional: speak to Sela at the western trailhead.';
  return 'Optional: take the eastern trail from Moss Circuit to meet Sela in Sunward Pass.';
}

function visibleObject(state, object) {
  return !(object.hiddenFlag && state.flags[object.hiddenFlag]) && !(object.id === 'shard' && state.flags.shardFound) && !(object.id === 'static' && state.flags.wispDefeated) && !(object.id === 'guardian' && state.flags.bossDefeated);
}
export const regionObjects = state => (ADVENTURE_REGIONS[state.locationId]?.objects || []).filter(object => visibleObject(state, object)).map(object => object.id === 'lantern' ? { ...object, status: lanternStatus(state) } : object);
export function isAdventureWalkable(state, x, y) {
  const region = ADVENTURE_REGIONS[state.locationId];
  if (!region || !Number.isInteger(x) || !Number.isInteger(y) || x < 1 || y < 1 || x >= region.width - 1 || y >= region.height - 1) return false;
  if (region.solid.some(rect => x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h)) return false;
  return !region.objects.some(object => visibleObject(state, object) && object.x === x && object.y === y && object.type !== 'pickup' && !object.passable);
}
export function nearbyInteractable(state) {
  const facing = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[state.facing] || [0, 1];
  return regionObjects(state).filter(object => Math.abs(object.x - state.x) + Math.abs(object.y - state.y) <= 1)
    .sort((a, b) => Number(b.x === state.x + facing[0] && b.y === state.y + facing[1]) - Number(a.x === state.x + facing[0] && a.y === state.y + facing[1]))[0] || null;
}

const talk = (state, speaker, text) => ({ ...state, dialogue: { speaker, text }, message: text });
const recover = state => ({ ...state, team: state.team.map(member => ({ ...member, hp: member.maxHp, energy: member.maxEnergy })) });
function gainXp(state, amount) {
  return { ...state, team: state.team.map(member => {
    const next = createCompanion(member.id, Math.min(100000, member.xp + amount));
    return { ...next, hp: Math.min(next.maxHp, member.hp + next.maxHp - member.maxHp), energy: member.energy };
  }) };
}
function grantFlag(state, flag, xp = 0) {
  return state.flags[flag] ? state : gainXp({ ...state, flags: { ...state.flags, [flag]: true } }, xp);
}
export function beginBattle(state, encounterId) {
  const enemy = ENCOUNTERS[encounterId];
  return { ...state, dialogue: null, result: null, puzzle: null,
    battle: { encounterId, enemy: { id: enemy.id, name: enemy.name, hp: enemy.maxHp, maxHp: enemy.maxHp, intent: enemyIntent(encounterId, 0) }, turn: 0, log: [`${enemy.name}. Read the next intent before choosing.`] }, message: 'A deterministic local encounter begins.' };
}
export function adventureResult(state, outcome, encounterId = null) {
  const enemy = ENCOUNTERS[encounterId];
  const headings = { won: 'Victory!', lost: 'A safe return', retreated: 'Retreated safely', restored: 'The Lantern Signal returns' };
  return { outcome, encounterId, heading: headings[outcome],
    text: outcome === 'restored' ? 'Mara lights the town lantern. You earned the Lantern identity set. Open the Locker to equip it. Local / unverified.'
      : outcome === 'won' ? `${enemy.name}: encounter cleared.${state.mode === 'journey' ? ' Check the save indicator before leaving your Journey.' : ' No Journey XP or rewards were granted.'}`
        : 'Your quest progress is safe. The team has recovered. Retry when ready; no completion was granted.',
    rewards: state.mode !== 'journey' ? [] : outcome === 'restored' ? ['skin-lantern', 'badge-lantern-signal', 'title-lantern-keeper'] : outcome === 'won' ? [...enemy.rewardIds] : [],
  };
}
function finishBattle(state, outcome) {
  const encounterId = state.battle.encounterId;
  const enemy = ENCOUNTERS[encounterId];
  let next = { ...state, battle: null };
  if (outcome === 'won' && state.mode === 'journey' && enemy.flag && !state.flags[enemy.flag]) {
    next = grantFlag(next, enemy.flag, enemy.xp);
    if (encounterId === 'static-wisp') next.inventory = { ...next.inventory, 'clear-circuit': 1 };
  }
  if (outcome === 'won' && state.mode === 'circuit') {
    const wins = state.circuit.index + 1;
    next.circuit = { ...state.circuit, wins, completed: wins === 3, bestWins: Math.max(wins, state.circuit.bestWins) };
  }
  if (outcome !== 'won' || state.mode !== 'journey') next = recover(next);
  if (outcome !== 'won' && state.mode === 'journey') next = { ...next, locationId: 'frontier', ...ADVENTURE_REGIONS.frontier.spawn };
  if (!activeCompanion(next)?.hp) next.activeId = next.team.find(member => member.hp > 0).id;
  return { ...next, result: adventureResult(next, outcome, encounterId), message: outcome === 'won' ? 'Victory! Continue when ready.' : 'The team is safe. Quest progress was preserved.' };
}

function enemyTurn(state, log, guard = 0) {
  const battle = state.battle;
  const member = activeCompanion(state);
  const damage = Math.max(0, battle.enemy.intent.damage - guard);
  const team = state.team.map(entry => entry.id === member.id ? { ...entry, hp: Math.max(0, entry.hp - damage) } : entry);
  const turn = battle.turn + 1;
  const next = { ...state, team, battle: { ...battle, turn, enemy: { ...battle.enemy, intent: enemyIntent(battle.encounterId, turn) }, log: [...battle.log, log, `${battle.enemy.intent.name}: ${damage} damage to ${member.name}.`].slice(-8) } };
  if (team.every(entry => entry.hp === 0) || turn >= MAX_BATTLE_TURNS) return finishBattle(next, 'lost');
  if (!activeCompanion(next).hp) {
    next.activeId = team.find(entry => entry.hp > 0).id;
    next.battle.log.push(`${activeCompanion(next).name} takes the lead.`);
  }
  return next;
}

function startMode(state, mode) {
  const journey = state.mode === 'journey' ? { ...state, dialogue: null, puzzle: null } : state.returnJourney;
  const next = createAdventure({ trainerName: state.trainerName, starterId: state.starterId, mode });
  return { ...next, circuit: mode === 'circuit' ? { ...next.circuit, bestWins: state.circuit.bestWins } : { ...state.circuit }, returnJourney: journey };
}
function interact(state) {
  const object = nearbyInteractable(state);
  if (!object) return state;
  if (object.type === 'exit') {
    if (object.to === 'archive' && !state.flags.wispDefeated) return talk(state, object.name, 'Clear the Static Wisp in Moss Circuit before entering the Archive.');
    if (object.to === 'sunward' && !state.flags.wispDefeated) return talk(state, object.name, 'Static is sweeping the ridge. Quiet the Wisp first; then the eastern pass is safe to explore.');
    return { ...state, locationId: object.to, ...object.entry, discoveries: [...new Set([...state.discoveries, object.to])], message: `Entered ${ADVENTURE_REGIONS[object.to].name}.` };
  }
  switch (object.id) {
    case 'guide': {
      if (!state.flags.questStarted) return talk(grantFlag(state, 'questStarted'), object.name, 'The lantern has gone dark. Follow the east road, recover the shard, and quiet the Static Wisp. Return when the Archive is safe.');
      if (state.flags.bossDefeated && !state.flags.questComplete) {
        const next = grantFlag(state, 'questComplete', 25);
        return { ...next, inventory: { ...next.inventory, 'lantern-emblem': 1 }, result: adventureResult(next, 'restored'), message: 'The town lantern shines again. Open the Locker for your Lantern rewards.' };
      }
      return talk(state, object.name, state.flags.questComplete ? 'Welcome home, Lantern Keeper. The whole crossing can see your signal.' : adventureObjective(state));
    }
    case 'shard': {
      if (!state.flags.questStarted) return talk(state, object.name, 'Ask Mara about this lost light first.');
      const next = grantFlag(state, 'shardFound', 5);
      return talk({ ...next, inventory: { ...next.inventory, 'signal-shard': 1 } }, object.name, 'A warm signal pulses inside. Clear the nearby Wisp before taking it to the Archive.');
    }
    case 'static':
      return state.flags.shardFound ? beginBattle(state, 'static-wisp') : talk(state, object.name, 'Recover the Signal Shard first; its light will make the Wisp visible.');
    case 'ranger': {
      if (state.flags.wispDefeated && !state.flags.recruited) {
        const next = grantFlag(state, 'recruited');
        return talk({ ...next, team: [...next.team, createCompanion('mossback', next.team[0].xp)] }, object.name, 'You read the Wisp’s intent. Mossback would like to join! Team can switch the lead; switching in battle spends a turn.');
      }
      return talk(state, object.name, state.flags.recruited ? 'Mossback is traveling with you. The Archive lies south of town. For an optional detour, follow this road east: Sela keeps watch over Sunward Pass.' : 'A gathering signal leaves an opening. Ward against its following surge. After the Wisp, come back to meet Mossback.');
    }
    case 'routekeeper': {
      if (!state.flags.lensQuestStarted) return talk(grantFlag(state, 'lensQuestStarted'), object.name, 'I kept the ridge beacon lit while Mara watched the town. The last surge tore its lens away. The Wind Marker on the northern ridge records where it fell. Bring it back and I can watch the road again. You can help now, or return another day.');
      if (state.flags.lensRecovered && !state.flags.lensReturned) {
        const next = grantFlag(state, 'lensReturned');
        return talk({ ...next, inventory: { ...next.inventory, 'keeper-lens': 0, potion: Math.min(99, next.inventory.potion + 2), ether: Math.min(99, next.inventory.ether + 1) } }, object.name, 'The lens is home. Take two Field Tonics and a Signal Tea for the road. My beacon will guide travelers again. The southern memorial road leads to an overlook, if you want to see what we are keeping safe.');
      }
      return talk(state, object.name, state.flags.lensReturned ? 'The ridge has its keeper again. Thank you. The southern road remembers the keepers before us; Mara is waiting back in the crossing.' : sideObjective(state));
    }
    case 'ridge-sign': return talk(state, object.name, 'North: Wind Marker and the old lookout. East, then south: Keepers’ Memorial and Lantern Overlook. West: Sela and Moss Circuit. Both roads meet at the eastern ridge.');
    case 'wind-marker':
      return state.flags.lensQuestStarted ? talk(grantFlag(state, 'windClueRead'), object.name, 'Sela’s field note: “The lens caught the morning light beyond this marker. Follow the ridge east, then turn north at the far fork. It lies below the old lookout.”') : talk(state, object.name, 'A routekeeper’s field note is pinned here. Sela at the western trailhead can explain the missing lens.');
    case 'keeper-lens': {
      if (!state.flags.windClueRead) return talk(state, object.name, 'Something glints beneath the lookout. Read Sela’s Wind Marker note before taking the beacon’s lens.');
      const next = grantFlag(state, 'lensRecovered');
      return talk({ ...next, inventory: { ...next.inventory, 'keeper-lens': 1 } }, object.name, 'The Keeper’s Lens still holds a little dawn. Return to Sela at the western trailhead; this belongs to the ridge beacon.');
    }
    case 'pass-memorial': return talk(state, object.name, '“A light is a promise someone will come home.” Names of keepers cover the stone. A narrow road continues east to Lantern Overlook.');
    case 'sunward-overlook': return talk(grantFlag(state, 'overlookFound'), object.name, state.flags.questComplete ? 'Below, Mara’s lantern shines beside the tiny roofs of Frontier Crossing. Sela’s road and the Archive are parts of the same promise. You found the hidden overlook.' : 'Below, Frontier Crossing is a cluster of tiny roofs. Its dark lantern explains why Mara never leaves her post. You found the hidden overlook; bring the signal home when you are ready.');
    case 'archive-note':
      return talk(grantFlag(state, 'noteRead'), object.name, 'Remember this sequence: amber first, cyan second. Apply the clue at the relay. Gathering enemies also leave an opening for Recall.');
    case 'relay':
      if (state.flags.relayRestored) return talk(state, object.name, 'The relay is awake. The Archive Warden waits to the north.');
      if (!state.flags.shardFound || !state.flags.wispDefeated || !state.flags.noteRead) return talk(state, object.name, 'Bring the shard, quiet the Wisp, and read the nearby notes first.');
      return { ...state, puzzle: { step: 0 }, message: 'Choose the lamps in the order you read. A wrong choice resets the sequence.' };
    case 'guardian':
      return state.flags.relayRestored ? beginBattle(state, 'archive-warden') : talk(state, object.name, 'Restore the relay using the Archive clue before this final watch.');
    case 'scholar': return talk(state, object.name, 'The notes are west of me. Recall their order at the relay, then meet the Warden beyond it.');
    case 'rest': return { ...recover(state), message: 'The team rests. HP and energy restored; items are not replenished.' };
    case 'arena': return { ...state, transition: 'arena', message: 'Live Arena is separate from Journey. Provider calls require explicit consent.' };
    case 'practice-board': return startMode(state, 'practice');
    case 'circuit-board': return startMode(state, 'circuit');
    case 'signpost': return talk(state, object.name, 'East: Moss Circuit. South: Forgotten Archive. Keeper’s Rest: beside the town square.');
    case 'lantern': return talk(state, object.name, state.flags.questComplete ? 'Amber light reaches every roof. The crossing is restored.' : 'The relay lantern is waiting for its signal.');
    default: return state;
  }
}

export function adventureReducer(state, action) {
  if (!action || typeof action.type !== 'string') return state;
  switch (action.type) {
    case 'DISMISS_DIALOGUE': return state.dialogue ? { ...state, dialogue: null } : state;
    case 'CLEAR_TRANSITION': return state.transition ? { ...state, transition: null } : state;
    case 'EXIT_MODE': {
      if (state.mode === 'journey') return state;
      const journey = state.returnJourney || createAdventure({ trainerName: state.trainerName, starterId: state.starterId });
      return { ...journey, circuit: { ...state.circuit } };
    }
    case 'START_PRACTICE':
    case 'START_CIRCUIT':
      return state.battle || state.puzzle || state.transition ? state : startMode(state, action.type === 'START_PRACTICE' ? 'practice' : 'circuit');
    case 'MOVE': {
      if (state.mode !== 'journey' || state.battle || state.result || state.dialogue || state.puzzle || state.transition) return state;
      const { dx, dy } = action;
      if (!Number.isInteger(dx) || !Number.isInteger(dy) || Math.abs(dx) + Math.abs(dy) !== 1) return state;
      const facing = dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up';
      if (!isAdventureWalkable(state, state.x + dx, state.y + dy)) return facing === state.facing ? state : { ...state, facing };
      return { ...state, x: state.x + dx, y: state.y + dy, facing, message: '' };
    }
    case 'INTERACT': return state.mode !== 'journey' || state.battle || state.result || state.dialogue || state.puzzle || state.transition ? state : interact(state);
    case 'PUZZLE_CHOICE': {
      if (!state.puzzle || !LAMP_CHOICES.some(lamp => lamp.id === action.lamp)) return state;
      if (action.lamp !== RELAY_SEQUENCE[state.puzzle.step]) return { ...state, puzzle: { step: 0 }, message: 'The lamps reset. Recall the order in the notes.' };
      if (state.puzzle.step === 0) return { ...state, puzzle: { step: 1 }, message: 'Amber hums. Choose the second lamp.' };
      return talk({ ...grantFlag(state, 'relayRestored', 20), puzzle: null }, 'Archive Relay', 'Both lamps shine. The Warden waits to the north; then bring the signal home to Mara.');
    }
    case 'CANCEL_PUZZLE': return state.puzzle ? { ...state, puzzle: null } : state;
    case 'BATTLE_MOVE': {
      const member = activeCompanion(state);
      const move = MOVES.find(entry => entry.id === action.moveId);
      if (!state.battle || state.result || !member?.hp || !move || !member.moves.includes(move.id) || member.energy < move.cost) return state;
      const bonus = state.battle.enemy.intent.id === 'gather' && (move.id === 'fork' || move.id === 'recall' && state.flags.noteRead) ? 5 : 0;
      const damage = move.damage + member.level - 1 + bonus;
      const hp = Math.max(0, state.battle.enemy.hp - damage);
      const next = { ...state, team: state.team.map(entry => entry.id === member.id ? { ...entry, energy: Math.min(entry.maxEnergy, entry.energy - move.cost + move.restore) } : entry), battle: { ...state.battle, enemy: { ...state.battle.enemy, hp } } };
      if (!hp) return finishBattle(next, 'won');
      return enemyTurn(next, `${member.name}: ${move.name} dealt ${damage}.`, move.guard);
    }
    case 'SWITCH_COMPANION': {
      if (state.result || state.dialogue || state.puzzle || state.transition || state.activeId === action.companionId || !state.team.some(member => member.id === action.companionId && member.hp > 0)) return state;
      const next = { ...state, activeId: action.companionId };
      return state.battle ? enemyTurn(next, `${activeCompanion(next).name} takes the lead.`) : next;
    }
    case 'USE_ITEM': {
      if (state.result || state.dialogue || state.puzzle || state.transition) return state;
      const item = ITEMS.find(entry => entry.id === action.itemId);
      const member = state.team.find(entry => entry.id === (action.companionId === undefined ? state.activeId : action.companionId));
      const quantity = state.inventory[action.itemId];
      if (!item || !member?.hp || !Number.isInteger(quantity) || quantity < 1 || quantity > 99 || !item.heal && !item.energy || item.heal && member.hp === member.maxHp || item.energy && member.energy === member.maxEnergy) return state;
      const next = { ...state, inventory: { ...state.inventory, [item.id]: quantity - 1 }, team: state.team.map(entry => entry.id === member.id ? { ...entry, hp: Math.min(entry.maxHp, entry.hp + (item.heal || 0)), energy: Math.min(entry.maxEnergy, entry.energy + (item.energy || 0)) } : entry) };
      return state.battle ? enemyTurn(next, `${member.name} used ${item.name}.`) : { ...next, message: `${item.name} used.` };
    }
    case 'RETREAT': return state.battle ? finishBattle(state, 'retreated') : state;
    case 'REST': return !state.battle && !state.result && !state.dialogue && !state.puzzle && !state.transition && state.mode === 'journey' && state.locationId === 'frontier' && nearbyInteractable(state)?.id === 'rest' ? { ...recover(state), message: 'The team rests. HP and energy restored.' } : state;
    case 'RETRY_BATTLE': return !state.battle && state.result && state.mode !== 'journey' && (state.mode === 'practice' || state.result.outcome !== 'won') ? beginBattle(recover(state), state.mode === 'practice' ? 'practice-wisp' : CIRCUIT_IDS[state.circuit.index]) : state;
    case 'CONTINUE_RESULT': {
      if (!state.result) return state;
      if (state.mode === 'practice') return beginBattle(recover(state), 'practice-wisp');
      if (state.mode === 'circuit') {
        if (state.circuit.completed) return { ...state, result: null, message: 'Three rivals cleared. Return to Journey or start a new circuit.' };
        const index = state.result.outcome === 'won' ? state.circuit.index + 1 : state.circuit.index;
        return beginBattle(recover({ ...state, circuit: { ...state.circuit, index } }), CIRCUIT_IDS[index]);
      }
      return { ...state, result: null };
    }
    default: return state;
  }
}
