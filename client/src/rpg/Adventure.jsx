import { useEffect, useReducer, useRef, useState } from 'react';
import { useGameDispatch, useGameState } from '../game/GameContext';
import { COMPANIONS, ADVENTURE_REGIONS, ITEMS, MOVES } from '../../../shared/rpg/adventureContent.js';
import { createAdventure, adventureReducer, activeCompanion, nearbyInteractable, adventureObjective, questProgress, unlockedRewardIds } from '../../../shared/rpg/adventure.js';
import { readAdventure, retryGameSave, writeAdventure as saveAdventure } from '../lib/adventureStorage.js';
import { loadCircuitRecord, saveCircuitRecord } from '../../../shared/rpg/adventureSave.js';
import { createProfile, loadProfile, saveProfile, syncAdventureProfile, profileSnapshot, getCosmetic } from '../../../shared/rpg/profile.js';
import AdventureScene from './AdventureScene';
import CompanionArt from './CompanionArt';
import GameDialog from './GameDialog';
import Locker from './Locker';
import FieldMap from './FieldMap';
import * as sfx from '../lib/sfx';

const MOVEMENT = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
const MOVE_LIST = Array.isArray(MOVES) ? MOVES : Object.values(MOVES);

function Meter({ value, max, label, energy = false }) {
  return <span className={`journey-meter ${energy ? 'is-energy' : ''}`}><span>{label} <b>{value}/{max}</b></span><span className="journey-meter-track" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}><i style={{ width: `${Math.max(0, Math.min(100, value / max * 100))}%` }} /></span></span>;
}

function PackContents({ state, dispatch }) {
  return <div className="journey-pack-items">{ITEMS.filter(item => item.heal || item.energy).map(item => {
    const quantity = state.inventory[item.id];
    return <article key={item.id}><h3>{item.name} × {quantity}</h3><p>{item.description}</p><div className="journey-inline-actions">{state.team.map(member => <button key={member.id} className="journey-button" disabled={quantity <= 0 || member.hp === 0 || (item.heal ? member.hp >= member.maxHp : member.energy >= member.maxEnergy)} onClick={() => dispatch({ type: 'USE_ITEM', itemId: item.id, companionId: member.id })}>{member.name} · {item.heal ? `${member.hp}/${member.maxHp} HP` : `${member.energy}/${member.maxEnergy} energy`}</button>)}</div></article>;
  })}<p className="journey-muted">{state.battle ? 'Using an item spends your turn. The opponent still acts.' : 'Using an item outside battle is free. Town rest restores the team without consuming items.'}</p></div>;
}

function IdentityPreview({ profile, onBack }) {
  const title = getCosmetic(profile.loadout.titleId);
  return <div className="journey-identity-preview"><p className="journey-muted">Local identity preview · no match or model calls</p>
    <div className="journey-versus-pair"><section><p>Your companion</p><CompanionArt id={profile.companionId} skinId={profile.loadout.skinId} /><h3>{profile.trainerName}</h3><p>{title?.name || 'Frontier Trainer'}</p><div className="journey-pinned-badges">{profile.loadout.badgeIds.map((id) => <span key={id}>{getCosmetic(id)?.name || id}</span>)}</div><small>Adventure Lv. {profile.level} · {profile.worldsCleared} world cleared · Local / unverified</small></section>
      <span className="journey-versus-word">VS</span><section><p>Example rival</p><CompanionArt id="duplet" /><h3>Practice Rival</h3><p>Not another online player</p><small>Your companion is your identity. In the Live Arena, the selected AI model produces the responses.</small></section></div>
    <button className="journey-button is-primary" onClick={onBack}>Back to the Locker</button>
  </div>;
}

function BattleScreen({ state, dispatch, profile, onExit }) {
  const companion = activeCompanion(state);
  const [command, setCommand] = useState('fight');
  const enemy = state.battle.enemy;
  const intent = typeof enemy.intent === 'object' ? enemy.intent.description || enemy.intent.name : enemy.intent;
  const enemyArtId = enemy.artId || ({ 'rival-scout': 'zipcat', 'rival-scholar': 'latticewing', 'rival-keeper': 'rampart' }[enemy.id]) || enemy.id;
  const moves = companion.moves.map((entry) => typeof entry === 'string' ? MOVE_LIST.find((move) => move.id === entry) : entry).filter(Boolean);
  return <main className="journey-battle-screen">
    <header className="journey-battle-topline"><span>{state.mode === 'journey' ? 'THE LANTERN SIGNAL' : state.mode === 'practice' ? 'PRACTICE · NO STORY REWARDS' : 'RIVAL CIRCUIT'}</span><span>Turn {state.battle.turn + 1} · Offline tactics</span></header>
    <div className={`journey-battle-scene is-${state.locationId}`}>
      <div className="journey-battle-distant" aria-hidden="true" />
      <section className="journey-combatant-info is-enemy"><div><h1>{enemy.name}</h1><span>{state.mode === 'circuit' ? 'Rival team' : 'Wild signal'}</span></div><Meter value={enemy.hp} max={enemy.maxHp} label="Opponent HP" /></section>
      <div className="journey-enemy-platform" aria-hidden="true" />
      <div key={`enemy-${state.battle.turn}`} className={`journey-enemy-art ${state.battle.turn > 0 ? 'is-hit' : ''}`}><CompanionArt id={enemyArtId} variant="front" /></div>
      <div className="journey-ally-platform" aria-hidden="true" />
      <div key={`ally-${companion.id}-${state.battle.turn}`} className={`journey-ally-art ${state.battle.turn > 0 ? 'is-acting' : ''}`}><CompanionArt id={companion.id} variant="back" skinId={profile.loadout.skinId} /></div>
      <section className="journey-combatant-info is-ally"><div><h2>{companion.name}</h2><span>Lv. {companion.level} · {companion.affinity}</span></div><Meter value={companion.hp} max={companion.maxHp} label="Companion HP" /><Meter value={companion.energy} max={companion.maxEnergy} label="Energy" energy /></section>
      <div className="journey-battle-party" aria-label="Your team">{state.team.map((member) => <span key={member.id} className={`${member.hp > 0 ? 'is-ready' : 'is-fainted'} ${member.id === state.activeId ? 'is-active' : ''}`} title={`${member.name}: ${member.hp}/${member.maxHp} HP`}>{member.id === state.activeId ? '◆' : '◇'}</span>)}</div>
    </div>
    <section className="journey-battle-console" aria-label="Battle commands">
      <div className="journey-battle-narration"><p className="journey-intent"><strong>Next intent</strong> {intent || 'Watch the signal carefully.'}</p><p aria-live="polite" aria-atomic="true">{(Array.isArray(state.battle.log) ? state.battle.log.slice(-2).join(' ') : state.battle.log) || state.message || `What will ${companion.name} do?`}</p></div>
      <div className="journey-command-area">
        <nav className="journey-command-tabs" aria-label="Command group">{[['fight', 'Fight'], ['team', 'Team'], ['pack', 'Pack'], ['retreat', 'Retreat']].map(([id, label]) => <button key={id} className={`journey-command-tab ${command === id ? 'is-selected' : ''}`} aria-pressed={command === id} onClick={() => setCommand(id)}>{label}</button>)}</nav>
        {command === 'fight' && <div className="journey-moves">{moves.map((move) => <button key={move.id} className="journey-move" disabled={companion.energy < move.cost || companion.hp <= 0} onClick={() => dispatch({ type: 'BATTLE_MOVE', moveId: move.id })}><strong>{move.name}</strong><span>{move.description}</span><small>{move.cost ? `${move.cost} energy` : 'Free · recover energy'}</small></button>)}</div>}
        {command === 'team' && <div className="journey-battle-team">{state.team.map((member) => <button key={member.id} className="journey-button" disabled={member.id === state.activeId || member.hp <= 0} onClick={() => { dispatch({ type: 'SWITCH_COMPANION', companionId: member.id }); setCommand('fight'); }}><strong>{member.name}</strong><span>{member.hp}/{member.maxHp} HP {member.id === state.activeId ? '· Active' : member.hp === 0 ? '· Resting' : '· Switch in'}</span></button>)}<p className="journey-muted">Switching during battle spends your turn. A conscious companion can take over after a faint.</p></div>}
        {command === 'pack' && <PackContents state={state} dispatch={dispatch} />}
        {command === 'retreat' && <div className="journey-pack-command"><p>Return safely without claiming a victory. Your completed quests stay with you.</p><button className="journey-button" onClick={() => dispatch({ type: 'RETREAT' })}>Retreat from encounter</button>{state.mode !== 'journey' && <button className="journey-button" onClick={onExit}>Return to title</button>}</div>}
      </div>
    </section>
  </main>;
}

export default function Adventure() {
  const game = useGameState(); const dispatchGame = useGameDispatch();
  const [loaded] = useState(() => readAdventure());
  const [state, dispatch] = useReducer(adventureReducer, null, () => {
    const initial = game.adventure || loaded.state || createAdventure({});
    return { ...initial, circuit: { ...initial.circuit, bestWins: Math.max(initial.circuit.bestWins, loadCircuitRecord().bestWins) } };
  });
  const [panel, setPanel] = useState(null); const [profile, setProfile] = useState(() => loadProfile() || createProfile());
  const [saveError, setSaveError] = useState(loaded.error); const [savedAt, setSavedAt] = useState('');
  const [showArenaConsent, setShowArenaConsent] = useState(false);
  const [muted, setMuted] = useState(sfx.isMuted);
  const heldRef = useRef(null); const controlsRef = useRef(null);
  const companion = activeCompanion(state); const nearby = nearbyInteractable(state); const region = ADVENTURE_REGIONS[state.locationId];

  useEffect(() => {
    if (state.mode !== 'journey') return;
    const timer = setTimeout(() => {
      const okay = saveAdventure(state);
      setSaveError(okay ? '' : 'Progress could not be saved. Storage may be unavailable, or a different Journey was started in another tab. Your current saved Journey has not been replaced.');
      if (okay) setSavedAt('Saved on this device');
      setProfile((previous) => {
        const next = syncAdventureProfile(previous, { trainerName: state.trainerName, companionId: state.activeId, level: activeCompanion(state).level, worldsCleared: state.flags.questComplete ? 1 : 0, rewardIds: unlockedRewardIds(state) });
        if (!saveProfile(next)) setSaveError('The adventure is saved, but your Locker could not be saved. Allow browser storage and retry.');
        return next;
      });
    }, 160);
    return () => clearTimeout(timer);
  }, [state]);
  useEffect(() => {
    if (state.mode === 'circuit' && (state.result || state.circuit.completed) && !saveCircuitRecord(state.circuit)) {
      setSaveError('Your Circuit record could not be saved. Keep this tab open and allow browser storage before leaving.');
    }
  }, [state.mode, state.result, state.circuit]);

  useEffect(() => {
    if (state.transition === 'arena') setShowArenaConsent(true);
  }, [state.transition]);
  useEffect(() => {
    if (['won', 'restored'].includes(state.result?.outcome)) sfx.bell();
  }, [state.result]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,dialog')) return;
      if (event.code === 'Escape') { setPanel(null); return; }
      if (panel || state.battle || state.result || state.puzzle || showArenaConsent) return;
      if (state.dialogue) { if (['Enter', 'Space', 'KeyE'].includes(event.code)) { event.preventDefault(); dispatch({ type: 'DISMISS_DIALOGUE' }); } return; }
      const movement = MOVEMENT[event.code];
      if (movement) { event.preventDefault(); dispatch({ type: 'MOVE', dx: movement[0], dy: movement[1] }); }
      else if (['KeyE', 'Space'].includes(event.code) && !event.target.closest?.('button')) { event.preventDefault(); dispatch({ type: 'INTERACT' }); }
      else if (event.code === 'KeyJ') setPanel('journal');
      else if (event.code === 'KeyT') setPanel('team');
      else if (event.code === 'KeyI') setPanel('pack');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, state.battle, state.result, state.dialogue, state.puzzle, showArenaConsent]);

  useEffect(() => () => clearInterval(heldRef.current), []);
  useEffect(() => { if (panel || state.battle || state.dialogue || state.result) clearInterval(heldRef.current); }, [panel, state.battle, state.dialogue, state.result]);

  function exit() {
    const journey = state.mode === 'journey' ? state : state.returnJourney ? adventureReducer(state, { type: 'EXIT_MODE' }) : null;
    if (journey && !saveAdventure(journey)) { setSaveError('Could not save. Stay here and retry before leaving.'); return; }
    dispatchGame({ type: 'RETURN_TITLE' });
  }
  function changeProfile(next) {
    setProfile(next);
    if (!saveProfile(next)) setSaveError('Your equipment could not be saved. Please allow browser storage and retry.');
  }
  function move(dx, dy) { dispatch({ type: 'MOVE', dx, dy }); }
  function hold(event, dx, dy) {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    clearInterval(heldRef.current); move(dx, dy); heldRef.current = setInterval(() => move(dx, dy), 150);
  }
  const stopHold = () => clearInterval(heldRef.current);
  function startMode(type) {
    if (state.mode === 'journey' && !saveAdventure(state)) { setSaveError('Could not save your Journey before changing modes. Please retry.'); return; }
    setPanel(null); dispatch({ type });
  }
  function retrySave() { if (retryGameSave(state, profile)) setSaveError(''); }
  const saveNotice = saveError && <div className="journey-save-inline" role="alert"><p>{saveError}</p><div className="journey-inline-actions"><button className="journey-button" onClick={retrySave}>Retry save</button><button className="journey-button" onClick={() => dispatchGame({ type: 'RETURN_TITLE' })}>Leave without saving</button></div></div>;
  const tasks = questProgress(state);
  const taskList = Array.isArray(tasks) ? tasks : Object.values(tasks || {});

  if (state.battle && !state.result) return <><BattleScreen state={state} dispatch={dispatch} profile={profile} onExit={exit} />{saveError && <div className="journey-save-warning" role="alert">{saveError}<button onClick={retrySave}>Retry save</button><button onClick={() => dispatchGame({ type: 'RETURN_TITLE' })}>Leave without saving</button></div>}</>;

  return <main className="journey-game">
    <header className="journey-hud"><button className="journey-brand-button" onClick={() => setPanel('menu')} aria-label="Open game menu"><span aria-hidden="true">✦</span> AI FRONTIER</button>
      <div className="journey-location"><strong>{region.name}</strong><span>{state.mode === 'journey' ? 'The Lantern Signal' : state.mode === 'practice' ? 'Practice · separate progress' : 'Rival Circuit · separate progress'}</span></div>
      <nav aria-label="Adventure menu"><button onClick={() => setPanel('team')}>Team</button><button onClick={() => setPanel('journal')}>Journal</button><button onClick={() => setPanel('locker')}>Locker</button><button aria-label="More game options" onClick={() => setPanel('menu')}>☰</button></nav>
    </header>

    <section className="journey-map-stage" aria-label="Exploration"><AdventureScene state={state} />
      <div className="journey-area-label"><span>{state.flags.questComplete ? 'THE SIGNAL SHINES' : 'CHAPTER ONE'}</span><strong>{region.name}</strong></div>
      {nearby && !state.dialogue && !state.result && <div className="journey-nearby"><kbd>E</kbd><span>{nearby.name}</span></div>}
    </section>

    <footer className="journey-explore-console"><div className="journey-companion-status"><CompanionArt id={companion.id} skinId={profile.loadout.skinId} /><div><strong>{companion.name} <small>Lv. {companion.level}</small></strong><Meter value={companion.hp} max={companion.maxHp} label="HP" /><span className="journey-save-status" role="status">{savedAt || 'Your companion is ready'}</span></div></div>
      <div className="journey-objective"><span>Next on your journey</span><p>{adventureObjective(state)}</p>{state.message && <small aria-live="polite">{state.message}</small>}</div>
      <div className="journey-explore-controls" ref={controlsRef}><div className="journey-dpad" aria-label="Movement controls">{[[0, -1, 'up', '▲'], [-1, 0, 'left', '◀'], [0, 1, 'down', '▼'], [1, 0, 'right', '▶']].map(([dx, dy, direction, symbol]) => <button key={direction} className={direction} aria-label={`Move ${direction}`} onPointerDown={(event) => hold(event, dx, dy)} onPointerUp={stopHold} onPointerCancel={stopHold} onLostPointerCapture={stopHold} onClick={(event) => { if (event.detail === 0) move(dx, dy); }}>{symbol}</button>)}</div><button className="journey-button is-primary journey-interact" disabled={!nearby || Boolean(state.dialogue || state.result)} onClick={() => dispatch({ type: 'INTERACT' })}>Interact <kbd>E</kbd></button></div>
    </footer>
    {saveError && <div className="journey-save-warning" role="alert">{saveError}<button onClick={retrySave}>Retry save</button><button onClick={() => dispatchGame({ type: 'RETURN_TITLE' })}>Leave without saving</button></div>}

    {state.dialogue && <GameDialog notice={saveNotice} title={state.dialogue.speaker} onClose={() => dispatch({ type: 'DISMISS_DIALOGUE' })} className="journey-narrative-dialog"><p className="journey-narrative-text" aria-live="polite">{state.dialogue.text}</p><button className="journey-button is-primary" onClick={() => dispatch({ type: 'DISMISS_DIALOGUE' })}>Continue ▸</button></GameDialog>}

    {state.puzzle && !state.dialogue && <GameDialog notice={saveNotice} title="Archive Relay · Recall" onClose={() => dispatch({ type: 'CANCEL_PUZZLE' })}><p>Remember the sequence in the relay notes. Which lamp comes next?</p><div className="journey-relay-lamps"><button className="journey-lamp is-amber" onClick={() => dispatch({ type: 'PUZZLE_CHOICE', lamp: 'amber' })}>Amber lamp</button><button className="journey-lamp is-cyan" onClick={() => dispatch({ type: 'PUZZLE_CHOICE', lamp: 'cyan' })}>Cyan lamp</button></div><p aria-live="polite">{state.message}</p><p className="journey-muted">Recall means applying a clue you learned earlier. No model call is needed.</p></GameDialog>}

    {state.result && <GameDialog notice={saveNotice} title={state.result.heading || (state.result.outcome === 'won' ? 'A signal cleared!' : 'A moment to recover')} className="journey-result-dialog"><div className="journey-result-display"><CompanionArt id={companion.id} /><div><p className="journey-result-outcome">{state.result.outcome === 'restored' ? 'WELCOME HOME, LANTERN KEEPER' : state.result.outcome === 'won' ? 'VICTORY' : state.result.outcome === 'lost' ? 'RECOVER & TRY AGAIN' : 'SAFE RETURN'}</p><p>{state.result.text}</p>{state.result.rewards?.length > 0 && <ul className="journey-reward-list">{state.result.rewards.map((reward, index) => <li key={typeof reward === 'string' ? reward : index}>✦ {typeof reward === 'string' ? getCosmetic(reward)?.name || reward : reward.name || reward.id}</li>)}</ul>}<p className="journey-muted">{state.mode === 'journey' ? 'Quest rewards are granted once. Progress stays with you.' : 'This mode does not grant Journey XP or cosmetics.'}</p></div></div><div className="journey-inline-actions"><button className="journey-button is-primary" onClick={() => dispatch({ type: 'CONTINUE_RESULT' })}>{state.mode === 'practice' ? 'Practice again ▸' : state.mode === 'circuit' && !state.circuit.completed ? 'Next encounter ▸' : 'Continue ▸'}</button>{state.result.outcome === 'restored' && <button className="journey-button" onClick={() => { dispatch({ type: 'CONTINUE_RESULT' }); setPanel('locker'); }}>Equip your rewards</button>}{state.mode !== 'journey' && <>{state.returnJourney && <button className="journey-button" onClick={() => dispatch({ type: 'EXIT_MODE' })}>Return to Journey</button>}<button className="journey-button" onClick={exit}>Return to title</button></>}</div></GameDialog>}

    {state.mode === 'circuit' && state.circuit.completed && !state.result && <GameDialog notice={saveNotice} title="Rival Circuit cleared"><p>You cleared all three local rivals. Your best run is {state.circuit.bestWins}/3. Journey rewards and XP are unchanged.</p><div className="journey-inline-actions">{state.returnJourney && <button className="journey-button is-primary" onClick={() => dispatch({ type: 'EXIT_MODE' })}>Return to Journey</button>}<button className="journey-button" onClick={() => dispatch({ type: 'START_CIRCUIT' })}>Run the circuit again</button><button className="journey-button" onClick={exit}>Return to title</button></div></GameDialog>}
    {panel === 'team' && <GameDialog notice={saveNotice} title="Your traveling team" onClose={() => setPanel(null)}><div className="journey-team-list">{state.team.map((member) => <article className="journey-team-member" key={member.id}><CompanionArt id={member.id} /><div><h3>{member.name} <small>Lv. {member.level}</small></h3><p>{COMPANIONS.find((entry) => entry.id === member.id)?.role} · {member.affinity}</p><Meter value={member.hp} max={member.maxHp} label="HP" /><p className="journey-muted">{member.xp} XP · {member.energy}/{member.maxEnergy} energy</p><button className="journey-button" disabled={member.id === state.activeId || member.hp === 0} onClick={() => dispatch({ type: 'SWITCH_COMPANION', companionId: member.id })}>{member.id === state.activeId ? 'Following you' : member.hp === 0 ? 'Needs a rest' : 'Make lead companion'}</button></div></article>)}</div><p className="journey-muted">Mossback can join your starter on this chapter’s route. Adventure stats never increase live-model arena power.</p></GameDialog>}
    {panel === 'journal' && <GameDialog notice={saveNotice} title="The Lantern Signal" onClose={() => setPanel(null)}><p className="journey-journal-next">{adventureObjective(state)}</p><ol className="journey-journal-quests">{taskList.map((task, index) => <li className={task.done || task.complete ? 'is-complete' : ''} key={task.id || index}><span aria-hidden="true">{task.done || task.complete ? '◆' : '◇'}</span><div><strong>{task.name || task.title || `Lead ${index + 1}`}</strong><p>{task.description || task.objective || task.text}</p></div></li>)}</ol><p className="journey-muted">Ward protects a constraint. Recall applies earlier clues. Your choices, not provider credits, drive this journey.</p></GameDialog>}
    {panel === 'pack' && <GameDialog notice={saveNotice} title="The field pack" onClose={() => setPanel(null)}><PackContents state={state} dispatch={dispatch} />{ITEMS.some(item => !item.heal && !item.energy && state.inventory[item.id]) && <p className="journey-muted">Keepsakes: {ITEMS.filter(item => !item.heal && !item.energy && state.inventory[item.id]).map(item => item.name).join(' · ')}</p>}</GameDialog>}
    {panel === 'map' && <GameDialog notice={saveNotice} title="Your field map" onClose={() => setPanel(null)}><FieldMap state={state} /></GameDialog>}
    {panel === 'locker' && <GameDialog notice={saveNotice} title="The companion Locker" onClose={() => setPanel(null)} className="journey-locker-dialog"><Locker profile={profile} onChange={changeProfile} onClose={() => setPanel(null)} /><button className="journey-button" onClick={() => setPanel('preview')}>Preview arena entrance</button></GameDialog>}
    {panel === 'preview' && <GameDialog notice={saveNotice} title="Your arena entrance" onClose={() => setPanel('locker')} className="journey-preview-dialog"><IdentityPreview profile={profile} onBack={() => setPanel('locker')} /></GameDialog>}
    {panel === 'menu' && <GameDialog notice={saveNotice} title="A moment on the road" onClose={() => setPanel(null)}>{state.circuit.bestWins > 0 && <p className="journey-muted">Rival Circuit record: {state.circuit.bestWins}/3 rivals cleared.</p>}<div className="journey-system-menu"><button className="journey-button" aria-pressed={!muted} onClick={() => setMuted(sfx.toggleMute())}>Sound effects: {muted ? 'Off' : 'On'}</button><button className="journey-button" onClick={() => setPanel('map')}>Field map</button><button className="journey-button" onClick={() => setPanel('pack')}>Open pack</button><button className="journey-button" onClick={() => startMode('START_PRACTICE')}>Practice battle</button><button className="journey-button" onClick={() => startMode('START_CIRCUIT')}>Rival Circuit</button><button className="journey-button" onClick={() => { setPanel(null); setShowArenaConsent(true); }}>Visit Live Arena</button><button className="journey-button is-primary" onClick={exit}>{state.mode === 'journey' ? 'Save & return to title' : 'Return to title'}</button></div><p className="journey-muted">Arrows / WASD: move · E: interact · J: Journal · T: Team · I: Pack. System reduced-motion settings are respected.</p></GameDialog>}
    {showArenaConsent && <GameDialog notice={saveNotice} title="Beyond the practice ring" onClose={() => { setShowArenaConsent(false); dispatch({ type: 'CLEAR_TRANSITION' }); }}><p>The Live Arena runs actual AI models using your provider credentials. Creature levels and cosmetics do not improve a model&apos;s score.</p><p>No model call happens on entry. You will choose models, connect credentials, review the call budget and explicitly start the match inside.</p><p className="journey-muted">This is a one-browser model show, not online human matchmaking. Local badges remain unverified.</p><div className="journey-inline-actions"><button className="journey-button is-primary" onClick={() => { const next = adventureReducer(state, { type: 'CLEAR_TRANSITION' }); if (state.mode === 'journey' && !saveAdventure(next)) { setSaveError('Could not save before entering the arena. Please retry.'); return; } dispatchGame({ type: 'ENTER_ARENA', adventure: next, identity: profileSnapshot(profile) }); }}>Enter model arena</button><button className="journey-button" onClick={() => { setShowArenaConsent(false); dispatch({ type: 'CLEAR_TRANSITION' }); }}>Stay on the frontier</button></div></GameDialog>}
  </main>;
}
