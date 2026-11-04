import { ADVENTURE_REGIONS, CHAPTER_ID, CIRCUIT_IDS, ENCOUNTERS, FLAG_IDS, ITEMS, MAP_REVISION, MAX_BATTLE_TURNS, STARTER_IDS, SUNWARD_FLAG_IDS } from './adventureContent.js';
import { adventureResult, beginBattle, createAdventure, createCompanion, enemyIntent, isAdventureWalkable, MODES, normalizeTrainerName } from './adventure.js';
import { fromSave as fromLegacySave, toSave as toLegacySave } from './worldState.js';

export const ADVENTURE_SAVE_KEY = 'ai-frontier:adventure:v3';
export const CIRCUIT_SAVE_KEY = 'ai-frontier:circuit:v1';
export const LEGACY_SAVE_KEYS = ['ai-frontier:save:v2', 'ai-frontier:save:v1'];
export const LEGACY_HERO_MAP = { owl: 'emberquill', fox: 'kitewhisk', serpent: 'duplet' };
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const owns = (object, key) => Object.hasOwn(object, key);

function oldRunId(value) {
  const identity = `${value.trainerName}:${value.starterId}`;
  let hash = 2166136261;
  for (const char of identity) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return `legacy-${hash.toString(36)}`;
}

function migrateV3Map(value) {
  if (!record(value) || value.version !== 3) return value;
  const next = { ...value, runId: value.runId ?? oldRunId(value) };
  if (value.mapRevision !== undefined && value.mapRevision !== 1) return next;
  next.mapRevision = MAP_REVISION;
  const region = owns(ADVENTURE_REGIONS, value.locationId) && ADVENTURE_REGIONS[value.locationId];
  if (!region) return next;
  Object.assign(next, region.spawn);
  if (value.mode === 'journey' && value.battle) {
    const object = region.objects.find(entry => entry.encounterId === value.battle.encounterId);
    if (object) {
      const point = [[-1, 0], [1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: object.x + dx, y: object.y + dy }))
        .find(entry => isAdventureWalkable(next, entry.x, entry.y));
      if (point) Object.assign(next, point);
    }
  }
  return next;
}

function migrateSunwardFields(value) {
  if (!record(value) || !record(value.flags) || !record(value.inventory)) return value;
  // Only the complete pre-Sunward schema gets defaults; partial new records fail validation.
  if (SUNWARD_FLAG_IDS.some(id => owns(value.flags, id)) || owns(value.inventory, 'keeper-lens')) return value;
  return { ...value, flags: { ...value.flags, ...Object.fromEntries(SUNWARD_FLAG_IDS.map(id => [id, false])) }, inventory: { ...value.inventory, 'keeper-lens': 0 } };
}

function legacyHistory(value) {
  const old = fromLegacySave(value);
  return old ? { ...toLegacySave(old), version: value.version } : null;
}

function migrate(value) {
  const old = fromLegacySave(value);
  if (!old) return null;
  const state = createAdventure({ trainerName: 'Trainer', starterId: LEGACY_HERO_MAP[old.heroId] });
  const flags = { ...state.flags, ...old.flags };
  // Completed legacy chapters stay complete; new Warden content must not revoke history.
  if (flags.questComplete) flags.bossDefeated = true;
  if (flags.bossDefeated) flags.relayRestored = true;
  if (flags.relayRestored) { flags.noteRead = true; flags.wispDefeated = true; }
  if (flags.wispDefeated) flags.shardFound = true;
  if (flags.shardFound) flags.questStarted = true;
  const member = createCompanion(state.starterId, old.xp);
  member.hp = Math.min(member.maxHp, old.hp);
  member.energy = Math.min(member.maxEnergy, old.energy);
  const next = {
    ...state, locationId: old.locationId, ...ADVENTURE_REGIONS[old.locationId].spawn, flags, team: [member],
    inventory: { ...state.inventory, 'signal-shard': flags.shardFound || old.inventory.includes('Signal Shard') ? 1 : 0, 'clear-circuit': flags.wispDefeated || old.inventory.includes('Clear Circuit') ? 1 : 0, 'lantern-emblem': flags.questComplete || old.inventory.includes('Lantern Emblem') ? 1 : 0 },
    discoveries: [...new Set(['frontier', old.locationId, ...old.discoveries])], legacy: legacyHistory(value),
    message: 'Legacy Journey imported. The original save is preserved until and after you save v3.',
  };
  if (!isAdventureWalkable(next, next.x, next.y)) Object.assign(next, ADVENTURE_REGIONS[next.locationId].spawn);
  return next;
}

function validFlags(flags, mode) {
  if (!record(flags) || !FLAG_IDS.every(id => typeof flags[id] === 'boolean')) return false;
  if (mode !== 'journey') return FLAG_IDS.every(id => !flags[id]);
  return (!flags.shardFound || flags.questStarted)
    && (!flags.wispDefeated || flags.shardFound)
    && (!flags.recruited || flags.wispDefeated)
    && (!flags.relayRestored || flags.noteRead && flags.wispDefeated)
    && (!flags.bossDefeated || flags.relayRestored)
    && (!flags.questComplete || flags.bossDefeated)
    && (!flags.lensQuestStarted || flags.wispDefeated)
    && (!flags.windClueRead || flags.lensQuestStarted)
    && (!flags.lensRecovered || flags.windClueRead)
    && (!flags.lensReturned || flags.lensRecovered)
    && (!flags.overlookFound || flags.wispDefeated);
}

function readV3(value, nested = false) {
  value = migrateSunwardFields(migrateV3Map(value));
  if (!record(value) || value.version !== 3 || value.chapterId !== CHAPTER_ID || !MODES.includes(value.mode)
    || value.mapRevision !== MAP_REVISION || typeof value.runId !== 'string' || !/^[a-zA-Z0-9:-]{1,80}$/.test(value.runId)
    || !STARTER_IDS.includes(value.starterId) || typeof value.trainerName !== 'string' || normalizeTrainerName(value.trainerName) !== value.trainerName
    || !owns(ADVENTURE_REGIONS, value.locationId) || !['up', 'down', 'left', 'right'].includes(value.facing)
    || !validFlags(value.flags, value.mode) || !Array.isArray(value.team) || value.team.length < 1 || value.team.length > 2
    || !record(value.inventory) || !ITEMS.every(item => integer(value.inventory[item.id], 0, item.heal || item.energy ? 99 : 1))) return null;
  if (value.team[0].id !== value.starterId || new Set(value.team.map(member => member.id)).size !== value.team.length) return null;
  if (value.team.length === 2 && (value.team[1].id !== 'mossback' || !value.flags.recruited) || value.team.length === 1 && value.flags.recruited) return null;
  const team = [];
  for (const member of value.team) {
    if (!record(member) || !integer(member.xp, 0, 100000) || value.mode !== 'journey' && member.xp !== 0) return null;
    const canonical = createCompanion(member.id, member.xp);
    if (!integer(member.hp, 0, canonical.maxHp) || !integer(member.energy, 0, canonical.maxEnergy)) return null;
    team.push({ ...canonical, hp: member.hp, energy: member.energy });
  }
  if (!team.some(member => member.id === value.activeId && member.hp > 0)) return null;
  if (!Array.isArray(value.discoveries) || value.discoveries.length > Object.keys(ADVENTURE_REGIONS).length || !value.discoveries.includes(value.locationId) || value.discoveries.some(id => !owns(ADVENTURE_REGIONS, id))) return null;
  if (value.inventory['keeper-lens'] !== Number(value.flags.lensRecovered && !value.flags.lensReturned)
    || value.discoveries.includes('sunward') && !value.flags.wispDefeated) return null;
  const circuit = value.circuit;
  if (!record(circuit) || !integer(circuit.index, 0, 2) || !integer(circuit.wins, 0, 3) || !integer(circuit.bestWins, circuit.wins, 3)
    || typeof circuit.completed !== 'boolean' || circuit.completed !== (circuit.wins === 3)
    || circuit.wins < circuit.index || circuit.wins > circuit.index + 1) return null;
  const state = {
    ...createAdventure({ trainerName: value.trainerName, starterId: value.starterId }), mode: value.mode, runId: value.runId,
    team, activeId: value.activeId, locationId: value.locationId, x: value.x, y: value.y, facing: value.facing,
    flags: Object.fromEntries(FLAG_IDS.map(id => [id, value.flags[id]])), inventory: Object.fromEntries(ITEMS.map(item => [item.id, value.inventory[item.id]])),
    discoveries: [...new Set(value.discoveries)], circuit: { index: circuit.index, wins: circuit.wins, completed: circuit.completed, bestWins: circuit.bestWins },
    message: 'Welcome back to the Frontier.',
  };
  if (!isAdventureWalkable(state, state.x, state.y)) return null;
  if (value.legacy != null) {
    if (value.mode !== 'journey') return null;
    state.legacy = legacyHistory(value.legacy);
    if (!state.legacy) return null;
  }
  if (value.returnJourney != null) {
    if (nested || value.mode === 'journey') return null;
    const journey = readV3(value.returnJourney, true);
    if (!journey || journey.mode !== 'journey' || journey.trainerName !== state.trainerName || journey.starterId !== state.starterId || journey.battle) return null;
    state.returnJourney = journey;
  }
  const pending = value.pendingResult;
  if (value.battle != null) {
    const battle = value.battle;
    if (pending != null || !record(battle) || !owns(ENCOUNTERS, battle.encounterId) || !integer(battle.turn, 0, MAX_BATTLE_TURNS - 1)) return null;
    const encounter = ENCOUNTERS[battle.encounterId];
    if (!integer(battle.enemyHp, 1, encounter.maxHp) || battle.turn === 0 && battle.enemyHp !== encounter.maxHp) return null;
    if (value.mode === 'journey') {
      const object = ADVENTURE_REGIONS[state.locationId].objects.find(entry => entry.encounterId === battle.encounterId);
      if (!encounter.flag || state.flags[encounter.flag] || !object || Math.abs(object.x - state.x) + Math.abs(object.y - state.y) !== 1
        || battle.encounterId === 'static-wisp' && !state.flags.shardFound || battle.encounterId === 'archive-warden' && !state.flags.relayRestored) return null;
    } else if (value.mode === 'practice' ? battle.encounterId !== 'practice-wisp' : battle.encounterId !== CIRCUIT_IDS[circuit.index] || circuit.wins !== circuit.index || circuit.completed) return null;
    state.battle = beginBattle(state, battle.encounterId).battle;
    state.battle.turn = battle.turn;
    state.battle.enemy.hp = battle.enemyHp;
    state.battle.enemy.intent = enemyIntent(battle.encounterId, battle.turn);
    state.battle.log = [`${encounter.name}: resumed at turn ${battle.turn + 1}.`];
  }
  if (pending != null) {
    if (!record(pending) || !['won', 'lost', 'retreated', 'restored'].includes(pending.outcome)) return null;
    const encounter = owns(ENCOUNTERS, pending.encounterId) ? ENCOUNTERS[pending.encounterId] : null;
    if (pending.outcome === 'restored') {
      if (value.mode !== 'journey' || !state.flags.questComplete || pending.encounterId !== null) return null;
    } else {
      if (!encounter) return null;
      if (value.mode === 'journey' && (!encounter.flag || pending.outcome === 'won' && !state.flags[encounter.flag])) return null;
      if (value.mode === 'practice' && pending.encounterId !== 'practice-wisp') return null;
      if (value.mode === 'circuit' && (pending.encounterId !== CIRCUIT_IDS[circuit.index] || circuit.wins !== circuit.index + (pending.outcome === 'won' ? 1 : 0))) return null;
    }
    state.result = adventureResult(state, pending.outcome, pending.encounterId);
  }
  // A cleared circuit may rest between runs; other local modes need a battle/result.
  if (value.mode !== 'journey' && !state.battle && !state.result && !(value.mode === 'circuit' && circuit.completed)) return null;
  return state;
}

export function fromAdventureSave(value) {
  try {
    if (!record(value)) return null;
    return [1, 2].includes(value.version) ? migrate(value) : readV3(value);
  } catch { return null; }
}

function project(state, nested = false) {
  return {
    version: 3, mapRevision: MAP_REVISION, runId: state.runId, chapterId: CHAPTER_ID, mode: state.mode, trainerName: state.trainerName, starterId: state.starterId,
    team: state.team.map(member => ({ id: member.id, xp: member.xp, hp: member.hp, energy: member.energy })), activeId: state.activeId,
    locationId: state.locationId, x: state.x, y: state.y, facing: state.facing,
    flags: Object.fromEntries(FLAG_IDS.map(id => [id, state.flags[id]])), inventory: Object.fromEntries(ITEMS.map(item => [item.id, state.inventory[item.id]])), discoveries: state.discoveries.filter(id => owns(ADVENTURE_REGIONS, id)),
    circuit: { index: state.circuit.index, wins: state.circuit.wins, completed: state.circuit.completed, bestWins: state.circuit.bestWins },
    battle: state.battle ? { encounterId: state.battle.encounterId, enemyHp: state.battle.enemy.hp, turn: state.battle.turn } : null,
    pendingResult: state.result ? { outcome: state.result.outcome, encounterId: state.result.encounterId } : null,
    returnJourney: !nested && state.returnJourney ? project(state.returnJourney, true) : null,
    legacy: state.legacy ? legacyHistory(state.legacy) : null,
  };
}

export function toAdventureSave(state) {
  let snapshot;
  try { snapshot = project(state); } catch { throw new Error('This adventure cannot be saved: invalid state.'); }
  const validated = fromAdventureSave(snapshot);
  if (!validated) throw new Error('This adventure cannot be saved: invalid state.');
  return project(validated);
}

// State/null and true on success; callers display the explicit error on failure.
export function loadAdventure(storage) {
  try { storage ??= globalThis.localStorage; } catch { throw new Error('Adventure storage is unavailable.'); }
  if (!storage || typeof storage.getItem !== 'function') throw new Error('Adventure storage is unavailable.');
  const errors = [];
  for (const key of [ADVENTURE_SAVE_KEY, ...LEGACY_SAVE_KEYS]) {
    let raw;
    try { raw = storage.getItem(key); } catch { errors.push(`Could not read ${key}.`); continue; }
    if (raw == null) continue;
    try {
      const saved = fromAdventureSave(JSON.parse(raw));
      if (!saved) throw new Error('invalid');
      if (errors.length) {
        saved.saveWarning = 'A newer save could not be loaded. Recovered an older valid Journey; all original keys are preserved.';
        saved.message = saved.saveWarning;
      }
      return saved;
    } catch { errors.push(`Invalid adventure save at ${key}.`); }
  }
  if (errors.length) throw new Error(errors.join(' '));
  return null;
}

export function saveAdventure(state, storage, { replace = false } = {}) {
  const snapshot = toAdventureSave(state);
  try {
    storage ??= globalThis.localStorage;
    if (!storage || typeof storage.setItem !== 'function' || typeof storage.getItem !== 'function') throw new Error('unavailable');
    const raw = storage.getItem(ADVENTURE_SAVE_KEY);
    let existing;
    try { existing = raw ? fromAdventureSave(JSON.parse(raw)) : null; } catch { /* Explicit replacement may recover a corrupt entry. */ }
    if (!replace && existing && existing.runId !== snapshot.runId) {
      const error = new Error('A different Journey was started in another tab. This older Journey was not saved over it. Return to the title and Continue the current Journey.');
      error.code = 'STALE_JOURNEY';
      throw error;
    }
    const text = JSON.stringify(snapshot);
    storage.setItem(ADVENTURE_SAVE_KEY, text);
    if (storage.getItem(ADVENTURE_SAVE_KEY) !== text) throw new Error('verification failed');
    return true;
  } catch (error) {
    if (error.code === 'STALE_JOURNEY') throw error;
    throw new Error('Adventure could not be saved. Storage may be full or unavailable; your older saves have not been removed.');
  }
}

export function loadCircuitRecord(storage) {
  try {
    const value = JSON.parse((storage ?? globalThis.localStorage).getItem(CIRCUIT_SAVE_KEY) || 'null');
    return record(value) && value.version === 1 && integer(value.bestWins, 0, 3) ? { version: 1, bestWins: value.bestWins } : { version: 1, bestWins: 0 };
  } catch { return { version: 1, bestWins: 0 }; }
}

export function saveCircuitRecord(circuit, storage) {
  if (!record(circuit) || !integer(circuit.bestWins, 0, 3)) return false;
  try {
    storage ??= globalThis.localStorage;
    const bestWins = Math.max(loadCircuitRecord(storage).bestWins, circuit.bestWins);
    storage.setItem(CIRCUIT_SAVE_KEY, JSON.stringify({ version: 1, bestWins }));
    return loadCircuitRecord(storage).bestWins === bestWins;
  } catch { return false; }
}
