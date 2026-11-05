import { Component, lazy, Suspense, useEffect } from 'react';
import { ThemeProvider } from './lib/theme';
import { GameProvider } from './game/GameContext';
import { useGameState } from './game/gameHooks';
import { PHASE } from './game/gameReducer';
import { StageProvider } from './stage/StageContext';
import { useStage } from './stage/stageHooks';
import Boot from './screens/Boot';
import Home from './screens/Home';
import Vs from './screens/Vs';
import Battle from './screens/Battle';
import Result from './screens/Result';
import { installGamepadControls } from './lib/gamepadControls';
import './rpg/frontier.css';
import './rpg/journey.css';

const Title = lazy(() => import('./rpg/JourneyTitle'));
const World = lazy(() => import('./rpg/Adventure'));

class GameBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="journey-scene-loading" role="alert"><section>
      <h1>The journey was interrupted</h1>
      <p>Reload to retry. You can continue from your last successful save.</p>
      <button className="journey-button" onClick={() => window.location.reload()}>Reload Cogimon</button>
    </section></main>;
    return this.props.children;
  }
}

function ArenaReady({ phase }) {
  const { init, ready, error } = useStage();
  useEffect(() => { init(); }, [init]);
  if (!ready) return <div className="frontier-loading h-svh"><div role="status">{error || 'Lighting the Cogimon Arena…'}</div>{error && <button className="pixel-button" onClick={init}>RETRY</button>}</div>;
  if (phase === PHASE.SELECT) return <Home />;
  if (phase === PHASE.VS) return <Vs />;
  return <Battle />;
}

function GameShell() {
  const { phase } = useGameState();

  return (
    <Suspense fallback={<div className="journey-scene-loading" role="status">Opening the frontier…</div>}><div className="h-svh overflow-hidden">
      {phase === PHASE.BOOT && <Boot />}
      {phase === PHASE.TITLE && <Title />}
      {phase === PHASE.WORLD && <World />}
      {[PHASE.SELECT, PHASE.VS, PHASE.FIGHT].includes(phase) && <ArenaReady phase={phase} />}
      {phase === PHASE.RESULT && <Result />}
    </div></Suspense>
  );
}

export default function App() {
  useEffect(() => installGamepadControls(), []);
  return (
    <ThemeProvider>
      <GameProvider>
        <StageProvider>
          <GameBoundary><GameShell /></GameBoundary>
        </StageProvider>
      </GameProvider>
    </ThemeProvider>
  );
}
