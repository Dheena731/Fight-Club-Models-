import { useState } from 'react';
import { useGameDispatch } from '../game/gameHooks';
import { COMPANIONS, STARTER_IDS, ADVENTURE_REGIONS } from '../../../shared/rpg/adventureContent.js';
import { createAdventure } from '../../../shared/rpg/adventure.js';
import { readAdventure, writeAdventure as saveAdventure } from '../lib/adventureStorage.js';
import CompanionArt from './CompanionArt';
import GameDialog from './GameDialog';

export default function JourneyTitle() {
  const dispatch = useGameDispatch();
  const [loaded] = useState(() => readAdventure());
  const [saved, setSaved] = useState(loaded.state);
  const [screen, setScreen] = useState('menu');
  const [trainerName, setTrainerName] = useState('');
  const [starterId, setStarterId] = useState('emberquill');
  const [error, setError] = useState(loaded.error);
  const [replace, setReplace] = useState(false);
  const companion = COMPANIONS.find((entry) => entry.id === starterId);
  const starters = STARTER_IDS.map((id) => COMPANIONS.find((entry) => entry.id === id));

  function begin() {
    const next = createAdventure({ trainerName: trainerName.trim() || 'Traveler', starterId, mode: 'journey' });
    if (!saveAdventure(next, undefined, { replace: true })) {
      setError('This browser could not save the adventure. Allow site storage, then try again. Your previous save has not been removed.');
      return;
    }
    setSaved(next);
    dispatch({ type: 'ENTER_WORLD', adventure: next });
  }

  return <main className="journey-title">
    <img className="journey-title-panorama" src="/assets/frontier/title-panorama.webp" alt="A trainer and three companions overlook a sunlit river town and distant observatory." />
    <div className="journey-title-shade" aria-hidden="true" />
    <header className="journey-title-brand"><img className="journey-brand-star" src="/cogimon-icon.svg" alt="" /><h1>Cogimon</h1><p>An AI creature adventure</p></header>
    <section className="journey-title-menu" aria-label="Game menu">
      <p className="journey-menu-note">A signal is calling. Bring a friend.</p>
      {saved && <button className="journey-menu-option" onClick={() => dispatch({ type: 'ENTER_WORLD', adventure: saved })}>
        <span className="journey-cursor" aria-hidden="true">▸</span><span>Continue<small>{saved.trainerName} · {ADVENTURE_REGIONS[saved.locationId]?.name || 'The Lantern Signal'}</small></span>
      </button>}
      <button className="journey-menu-option" onClick={() => { setReplace(Boolean(saved || loaded.error)); setScreen(saved || loaded.error ? 'replace' : 'trainer'); }}><span className="journey-cursor" aria-hidden="true">▸</span><span>Begin Journey</span></button>
      <button className="journey-menu-option" onClick={() => dispatch({ type: 'ENTER_WORLD', adventure: createAdventure({ mode: 'practice', starterId: saved?.starterId || 'emberquill', trainerName: saved?.trainerName || 'Traveler' }) })}><span className="journey-cursor" aria-hidden="true">▸</span><span>Practice<small>A quick battle. No key needed.</small></span></button>
      <button className="journey-menu-option" onClick={() => setScreen('settings')}><span className="journey-cursor" aria-hidden="true">▸</span><span>Field Guide</span></button>
      <p className="journey-title-footnote">Journey is keyless. Real AI lives in the optional arena.</p>
      {error && <p className="journey-error journey-title-footnote" role="alert">{error} Original saves have not been removed.</p>}
    </section>
    <footer className="journey-title-caption"><span>THE LANTERN SIGNAL</span><span>Original companions. A world to restore.</span></footer>

    {screen === 'replace' && <GameDialog title="A new beginning?" onClose={() => setScreen('menu')}>
      <p>Beginning a new Journey replaces {saved ? `${saved.trainerName}’s current adventure` : 'the unreadable adventure snapshot'} on this device. The previous-generation save is kept separately.</p>
      <div className="journey-inline-actions"><button className="journey-button is-primary" onClick={() => setScreen('trainer')}>Choose a new companion</button><button className="journey-button" onClick={() => setScreen('menu')}>Keep my journey</button></div>
    </GameDialog>}
    {screen === 'trainer' && <GameDialog title="What should we call you?" onClose={() => setScreen('menu')}>
      <div className="journey-trainer-setup"><CompanionArt id="trainer" /><form onSubmit={(event) => { event.preventDefault(); setScreen('starter'); }}>
        <p>Mara is waiting at Frontier Crossing. Your first companion is waiting too.</p>
        <label htmlFor="trainer-name">Trainer name</label><input id="trainer-name" value={trainerName} maxLength={20} placeholder="Traveler" autoComplete="off" onChange={(event) => setTrainerName(event.target.value)} autoFocus />
        <p className="journey-muted">Your name is stored only on this device.</p><button className="journey-button is-primary" type="submit">Meet the companions ▸</button>
      </form></div>
    </GameDialog>}
    {screen === 'starter' && <GameDialog title="Every journey starts with a friend" onClose={() => setScreen('trainer')} className="journey-starter-dialog">
      <div className="journey-starter-layout"><div className="journey-starter-portrait"><CompanionArt id={starterId} /><span>{companion.affinity}</span></div>
        <div className="journey-starter-details"><p className="journey-muted">Your first companion</p><h3>{companion.name}</h3><p>{companion.description}</p><p><strong>{companion.role}</strong></p>
          <div className="journey-starter-picks" aria-label="Inspect a starter">{starters.map((entry) => <button key={entry.id} className={`journey-starter-pick ${starterId === entry.id ? 'is-selected' : ''}`} aria-pressed={starterId === entry.id} onClick={() => setStarterId(entry.id)}><CompanionArt id={entry.id} /><span>{entry.name}</span></button>)}</div>
          <button className="journey-button is-primary" onClick={begin}>Journey with {companion.name} ▸</button><p className="journey-muted">Every starter can finish the chapter. Choose the one you like.</p>
          {replace && <p className="journey-muted">This confirms replacement of the current Journey.</p>}{error && <p role="alert" className="journey-error">{error}</p>}
        </div></div>
    </GameDialog>}
    {screen === 'settings' && <GameDialog title="The field guide" onClose={() => setScreen('menu')}>
      <h3>Three ways to play</h3><p><strong>Journey:</strong> explore, build a team and restore the Lantern Signal. Saves automatically on this device.</p><p><strong>Practice:</strong> learn combat without changing your adventure.</p><p><strong>Rival Circuit:</strong> a local three-encounter challenge, entered from the town board.</p>
      <p><strong>Live Arena:</strong> optional real-model shows. Requires your own provider credentials and may incur charges. It is not two-player matchmaking.</p>
      <h3>Controls</h3><p>Arrow keys or WASD to move. E or Space to interact. J for Journal, T for Team, I for Pack. Escape returns from menus. Touch controls are always available.</p>
      <p>Standard gamepad: left stick or D-pad to move and choose, A to confirm or interact, B to go back, X to run, and Start for the game menu.</p>
      <p className="journey-muted">System reduced-motion settings are respected. Audio stays off until you enable it during play. All creatures, world abilities and prestige levels are game fiction, not model benchmarks.</p>
    </GameDialog>}
  </main>;
}
