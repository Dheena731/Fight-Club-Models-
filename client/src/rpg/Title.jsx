import { useState } from 'react';
import { useGameDispatch } from '../game/GameContext';
import PixelCreature from '../components/creatures/PixelCreature';
import { getCreature } from '../components/creatures/pixelData';
import { HEROES } from '../../../shared/rpg/world.js';
import { factionForHero } from '../../../shared/rpg/factions.js';
import { createGame, loadGame, saveGame } from '../../../shared/rpg/worldState.js';

export default function Title() {
  const dispatch = useGameDispatch();
  const [saved] = useState(() => loadGame());
  const [choosing, setChoosing] = useState(false);

  function start(heroId) {
    saveGame(createGame(heroId));
    dispatch({ type: 'ENTER_WORLD' });
  }

  return (
    <main className={`frontier-title ${choosing ? 'is-choosing' : ''}`}>
      <div className="frontier-stars" aria-hidden="true" />
      <div className="frontier-title-content">
        <p className="frontier-kicker">A PIXEL ADVENTURE THROUGH A FICTIONAL AI FRONTIER</p>
        <h1>AI <span>FRONTIER</span></h1>
        <p className="frontier-title-lead">The lanterns have gone dark. Explore the frontier, uncover the signal, and restore the light.</p>
        <div className="frontier-hero-parade" aria-hidden="true">
          {HEROES.map((hero) => <div key={hero.id}><PixelCreature creature={getCreature(hero.id)} scale={0.8} /></div>)}
        </div>

        {!choosing ? (
          <div className="frontier-title-actions">
            {saved && <button className="pixel-button primary" onClick={() => dispatch({ type: 'ENTER_WORLD' })}>CONTINUE ADVENTURE</button>}
            <button className={`pixel-button ${saved ? '' : 'primary'}`} onClick={() => setChoosing(true)}>NEW ADVENTURE</button>
            <p>Explore and fight offline. The live model arena is optional and uses your own provider credits.</p>
          </div>
        ) : (
          <section className="frontier-choice" aria-label="Choose your frontier hero">
            <h2>Choose your faction</h2>
            <p>Each traveler begins in a different region with an ally, a two-path mandate, and a distinct reward. These are original fictional identities.</p>
            {saved && <p className="frontier-warning">Starting a new adventure replaces your local save.</p>}
            <div className="frontier-choice-grid">
              {HEROES.map((hero) => (
                <button key={hero.id} className="frontier-hero-choice" onClick={() => start(hero.id)}>
                  <PixelCreature creature={getCreature(hero.id)} scale={0.48} />
                  <strong>{getCreature(hero.id).name}</strong>
                  <small>{hero.name} · {hero.faction}</small>
                  <span>{hero.style}</span>
                  <em>Start: {factionForHero(hero.id).regionId === 'frontier' ? 'Frontier Crossing' : factionForHero(hero.id).regionId === 'grove' ? 'Moss Circuit' : 'Forgotten Archive'}</em>
                </button>
              ))}
            </div>
            <button className="pixel-button quiet" onClick={() => setChoosing(false)}>BACK</button>
          </section>
        )}
      </div>
      <div className="frontier-skyline" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
    </main>
  );
}
