import { useEffect } from 'react';
import { ThemeProvider } from './lib/theme';
import { GameProvider, useGameState, PHASE } from './game/GameContext';
import { StageProvider } from './stage/StageContext';
import { useStage } from './stage/StageContext';
import Boot from './screens/Boot';
import Home from './screens/Home';
import Vs from './screens/Vs';
import Battle from './screens/Battle';
import Result from './screens/Result';
import Title from './rpg/Title';
import World from './rpg/World';
import './rpg/frontier.css';

function ArenaReady({ phase }) {
  const { init, ready, error } = useStage();
  useEffect(() => { init(); }, [init]);
  if (!ready) return <div className="frontier-loading h-svh"><div role="status">{error || 'Lighting the Frontier Arena…'}</div>{error && <button className="pixel-button" onClick={init}>RETRY</button>}</div>;
  if (phase === PHASE.SELECT) return <Home />;
  if (phase === PHASE.VS) return <Vs />;
  return <Battle />;
}

function GameShell() {
  const { phase } = useGameState();

  return (
    <div className="h-svh overflow-hidden">
      {phase === PHASE.BOOT && <Boot />}
      {phase === PHASE.TITLE && <Title />}
      {phase === PHASE.WORLD && <World />}
      {[PHASE.SELECT, PHASE.VS, PHASE.FIGHT].includes(phase) && <ArenaReady phase={phase} />}
      {phase === PHASE.RESULT && <Result />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <GameProvider>
        <StageProvider>
          <GameShell />
        </StageProvider>
      </GameProvider>
    </ThemeProvider>
  );
}
