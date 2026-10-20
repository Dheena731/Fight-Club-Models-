import { useEffect, useReducer, useRef } from 'react';
import { useGameDispatch } from '../game/GameContext';
import { ABILITIES, CHAPTER, HEROES, REGIONS, WORLD_SIZE } from '../../../shared/rpg/world.js';
import { factionForHero, factionObjective, selectedChoice } from '../../../shared/rpg/factions.js';
import { HISTORICAL_RECORDS } from '../../../shared/rpg/lore.js';
import { createGame, currentObjective, loadGame, nearbyObject, saveGame, worldReducer } from '../../../shared/rpg/worldState.js';
import WorldScene from './WorldScene';

const MOVEMENT = {
  ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
};

function Panel({ title, children, onClose }) {
  const headingRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    headingRef.current?.focus();
    return () => previous?.focus?.();
  }, []);
  return <div className="frontier-panel-backdrop">
    <section className="frontier-panel" role="dialog" aria-modal="true" aria-label={title}>
      <div className="frontier-panel-head"><h2 ref={headingRef} tabIndex={-1}>{title}</h2>{onClose && <button className="pixel-button quiet" onClick={onClose}>CLOSE</button>}</div>
      {children}
    </section>
  </div>;
}

function RegionMap({ state }) {
  const region = REGIONS[state.locationId];
  return <div className="frontier-map" role="img" aria-label={`${region.name} map with player position`}>
    {Array.from({ length: WORLD_SIZE.height * WORLD_SIZE.width }, (_, index) => {
      const x = index % WORLD_SIZE.width;
      const y = Math.floor(index / WORLD_SIZE.width);
      const object = region.objects.find((entry) => entry.x === x && entry.y === y);
      const solid = region.solid.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
      return <span key={index} className={`frontier-map-cell ${solid ? 'solid' : ''} ${object ? 'object' : ''} ${state.x === x && state.y === y ? 'player' : ''}`} />;
    })}
  </div>;
}

export default function World() {
  const dispatchGame = useGameDispatch();
  const [state, dispatch] = useReducer(worldReducer, null, () => loadGame() || createGame());
  const region = REGIONS[state.locationId];
  const hero = HEROES.find((entry) => entry.id === state.heroId) || HEROES[0];
  const faction = factionForHero(hero.id);
  const choice = selectedChoice(state);
  const nearby = nearbyObject(state);

  useEffect(() => {
    const timer = setTimeout(() => saveGame(state), 150);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (state.transition !== 'arena') return;
    saveGame(state);
    dispatchGame({ type: 'ENTER_ARENA' });
  }, [state, dispatchGame]);

  useEffect(() => {
    function onKey(event) {
      if (event.target instanceof HTMLElement && event.target.closest('input,textarea,select')) return;
      if (event.key === 'Escape') { dispatch({ type: 'CLOSE_PANEL' }); return; }
      if (state.panel) return;
      const movement = MOVEMENT[event.code];
      if (movement) {
        event.preventDefault();
        if (!event.repeat) dispatch({ type: 'MOVE', dx: movement[0], dy: movement[1] });
      } else if ((event.code === 'KeyE' || event.code === 'Space') && !(event.target instanceof HTMLElement && event.target.closest('button'))) {
        event.preventDefault(); dispatch({ type: 'INTERACT' });
      } else if (event.code === 'KeyJ') dispatch({ type: 'OPEN_PANEL', panel: 'journal' });
      else if (event.code === 'KeyM') dispatch({ type: 'OPEN_PANEL', panel: 'map' });
      else if (event.code === 'KeyI') dispatch({ type: 'OPEN_PANEL', panel: 'inventory' });
      else if (event.code === 'KeyL') dispatch({ type: 'OPEN_PANEL', panel: 'lore' });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.panel]);

  const move = (dx, dy) => dispatch({ type: 'MOVE', dx, dy });
  const close = () => dispatch({ type: 'CLOSE_PANEL' });
  const stepDone = [state.flags.questStarted, state.flags.shardFound, state.flags.wispDefeated,
    state.flags.relayRestored, state.flags.questComplete];

  return <main className="frontier-game">
    <header className="frontier-hud">
      <div className="frontier-hud-brand"><strong>AI FRONTIER</strong><span>{faction.name} · {region.name}</span></div>
      <div className="frontier-hud-vitals" aria-label="Player health and experience">
        <span>HP <b>{state.hp}/30</b></span><span>EN <b>{state.energy}/5</b></span><span>LV <b>{state.level}</b></span>
        <span>REP <b>{state.faction.reputation}</b></span>
      </div>
      <div className="frontier-hud-actions">
        <button onClick={() => dispatch({ type: 'OPEN_PANEL', panel: 'journal' })}>JOURNAL</button>
        <button onClick={() => dispatch({ type: 'OPEN_PANEL', panel: 'map' })}>MAP</button>
        <button onClick={() => dispatch({ type: 'OPEN_PANEL', panel: 'inventory' })}>PACK</button>
        <button onClick={() => dispatch({ type: 'OPEN_PANEL', panel: 'lore' })}>LORE</button>
        <button onClick={() => dispatch({ type: 'OPEN_PANEL', panel: 'help' })}>HELP</button>
      </div>
    </header>

    <div className="frontier-playfield">
      <WorldScene state={state} />
      <div className="frontier-region-caption"><strong>{region.name}</strong><span>{region.subtitle}</span></div>
    </div>

    <div className="frontier-bottom">
      <div className="frontier-quest-hint"><span>{state.faction.completed ? 'THE LANTERN SIGNAL' : `${faction.name.toUpperCase()} MANDATE`}</span>
        <strong>{state.faction.completed ? currentObjective(state) : factionObjective(state)}</strong>
        <small className="frontier-faction-objective">{state.faction.completed ? `${faction.name}: ${factionObjective(state)}` : `Main quest: ${currentObjective(state)}`}</small>
        <small aria-live="polite">{state.message || (nearby ? `Nearby: ${nearby.name}` : 'Explore the frontier.')}</small></div>
      <div className="frontier-controls">
        <div className="frontier-dpad" aria-label="Movement controls">
          <button aria-label="Move up" className="up" onClick={() => move(0, -1)}>▲</button>
          <button aria-label="Move left" className="left" onClick={() => move(-1, 0)}>◀</button>
          <button aria-label="Move down" className="down" onClick={() => move(0, 1)}>▼</button>
          <button aria-label="Move right" className="right" onClick={() => move(1, 0)}>▶</button>
        </div>
        <button className="pixel-button primary frontier-interact" onClick={() => dispatch({ type: 'INTERACT' })} disabled={!nearby || Boolean(state.panel)}>
          {nearby ? `INTERACT · ${nearby.name}` : 'INTERACT'}
        </button>
      </div>
    </div>

    {state.panel === 'intro' && <Panel title={`${faction.name} · Your Mandate`}>
      <p className="frontier-dialogue-text">{faction.scene}</p>
      <p className="frontier-muted">Your ally is {faction.allyName}. The Lantern Signal remains the main quest; this mandate adds a distinct faction objective and reward.</p>
      <div className="frontier-mandates">{faction.choices.map((option) => <button key={option.id} className="pixel-button" onClick={() => dispatch({ type: 'CHOOSE_MANDATE', choiceId: option.id })}>
        <strong>{option.name}</strong><span>{option.objective}</span><small>Reward: {option.reward}</small>
      </button>)}</div>
    </Panel>}
    {state.panel === 'dialogue' && <Panel title={state.dialogue?.speaker || 'Frontier'} onClose={close}>
      <p className="frontier-dialogue-text">{state.dialogue?.text}</p>
      <button className="pixel-button primary" onClick={close}>CONTINUE</button>
    </Panel>}
    {state.panel === 'journal' && <Panel title="Quest Journal" onClose={close}>
      <h3>{faction.name} mandate · {state.faction.completed ? 'COMPLETE' : 'ACTIVE'}</h3>
      <p>{factionObjective(state)}</p>
      <p className="frontier-muted">Ally: {faction.allyName} · Reputation: {state.faction.reputation}{choice && state.faction.completed ? ` · ${choice.reward}` : ''}</p>
      <h3>{CHAPTER.name}</h3><p>{currentObjective(state)}</p>
      <ol className="frontier-steps">{CHAPTER.steps.map((step, index) => <li key={step} className={stepDone[index] ? 'done' : ''}>{stepDone[index] ? '✓ ' : '· '}{step}</li>)}</ol>
      <p className="frontier-muted">Progress saves automatically on this device.</p>
    </Panel>}
    {state.panel === 'map' && <Panel title="World Map" onClose={close}>
      <RegionMap state={state} />
      <p className="frontier-muted">Bright square: you. Gold squares: places or people. Dark squares: solid ground.</p>
      <ul className="frontier-regions">{Object.values(REGIONS).map((r) => <li key={r.id}>{state.discoveries.includes(r.id) ? r.name : 'Undiscovered region'} {state.locationId === r.id ? '← HERE' : ''}</li>)}</ul>
    </Panel>}
    {state.panel === 'inventory' && <Panel title="Traveler's Pack" onClose={close}>
      <p>{hero.name} · {hero.faction} · Level {state.level} · {state.xp} XP · Reputation {state.faction.reputation}</p>
      {state.inventory.length ? <ul>{state.inventory.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="frontier-muted">Your pack is empty. Explore to discover useful things.</p>}
      {choice && <p className="frontier-muted">Mandate: {choice.name}. {state.faction.completed ? choice.reward : 'Return to your ally after the objective.'}</p>}
      <p className="frontier-muted">Character styles are fictional game identities, not model performance scores.</p>
    </Panel>}
    {state.panel === 'lore' && <Panel title="Frontier Lore Codex" onClose={close}>
      <p className="frontier-muted">Source-backed AI history is separated from the game’s invented factions and abilities.</p>
      <div className="frontier-lore-list">{HISTORICAL_RECORDS.map((record) => <article key={record.id}>
        <h3>{record.title} <small>{record.date}</small></h3>
        <p><strong>Historical record:</strong> {record.fact}</p>
        <p><strong>Fictional adaptation:</strong> {record.fiction}</p>
        <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer">READ PRIMARY SOURCE · {record.sourceTitle}</a>
      </article>)}</div>
    </Panel>}
    {state.panel === 'help' && <Panel title="Controls & Modes" onClose={close}>
      <p>Move with arrow keys or WASD. Press E/Space to interact. Open Journal (J), Map (M), Pack (I), or Lore (L). On touch devices, use the direction pad and INTERACT.</p>
      <p>Story exploration and tactical battles work offline. The Frontier Arena runs real provider models with your own credentials and may incur provider charges.</p>
      <button className="pixel-button" onClick={() => { saveGame(state); dispatchGame({ type: 'RETURN_TITLE' }); }}>SAVE & TITLE</button>
    </Panel>}
    {state.panel === 'puzzle' && <Panel title="Archive Relay" onClose={close}>
      <p>The relay has two lamps. The nearby notes describe their order.</p>
      <p className="frontier-muted">{state.puzzleStep === 1 ? 'First lamp lit: AMBER' : 'No lamps lit yet.'}</p>
      <div className="frontier-puzzle-actions"><button className="pixel-button primary" onClick={() => dispatch({ type: 'PUZZLE_CHOICE', lamp: 'amber' })}>AMBER</button><button className="pixel-button" onClick={() => dispatch({ type: 'PUZZLE_CHOICE', lamp: 'cyan' })}>CYAN</button></div>
      <p aria-live="polite">{state.message}</p>
    </Panel>}
    {state.panel === 'combat' && <Panel title="Static Wisp · Tactical Battle" onClose={close}>
      <div className="frontier-combat-head"><span>YOU {state.hp}/30 HP · {state.energy}/5 ENERGY</span><span>WISP {state.combat?.hp}/28 HP</span></div>
      <p className="frontier-combat-intent">{state.combat?.done ? state.combat.done === 'won' ? 'VICTORY' : 'DEFEAT' : `ENEMY INTENT: ${state.combat?.intent === 'strike' ? 'Heavy strike · 8 damage' : 'Weak pulse · 5 damage'}`}</p>
      <p aria-live="polite">{state.combat?.log}</p>
      {state.combat?.done ? <button className="pixel-button primary" onClick={close}>CONTINUE</button> : <div className="frontier-abilities">
        {ABILITIES.map((ability) => <button key={ability.id} className="pixel-button" disabled={state.energy < ability.cost}
          onClick={() => dispatch({ type: 'COMBAT_ACTION', abilityId: ability.id })}>
          <strong>{ability.name}</strong><small>{ability.description}</small><em>{ability.cost ? `${ability.cost} ENERGY` : 'FREE'}</em>
        </button>)}
      </div>}
    </Panel>}
  </main>;
}
