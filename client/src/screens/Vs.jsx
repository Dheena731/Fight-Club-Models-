import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameState, useGameDispatch } from '../game/GameContext';
import { getCreature } from '../components/creatures/pixelData';
import PixelCreature from '../components/creatures/PixelCreature';
import * as sfx from '../lib/sfx';

const VS_MIN_MS = 1200;
const SKIP_AFTER_MS = 650;

/**
 * VS splash. Provider credentials are already checked at the Coin Slot,
 * so this beat is purely theatrical and never spends an extra model call.
 */
export default function Vs() {
  const { loadout } = useGameState();
  const dispatch = useGameDispatch();
  const [skippable, setSkippable] = useState(false);
  const doneRef = useRef(false);

  const a = loadout?.fighters?.a;
  const b = loadout?.fighters?.b;
  const colorA = a?.color ?? '#FFB627';
  const colorB = b?.color ?? '#10A37F';

  function finish() {
    if (!skippable || doneRef.current) return;
    doneRef.current = true;
    dispatch({ type: 'VS_DONE' });
  }

  useEffect(() => {
    if (!loadout) {
      dispatch({ type: 'EXIT_TO_SELECT' });
      return undefined;
    }

    sfx.bell();
    const skipTimer = setTimeout(() => setSkippable(true), SKIP_AFTER_MS);
    const finishTimer = setTimeout(() => {
      doneRef.current = true;
      dispatch({ type: 'VS_DONE' });
    }, VS_MIN_MS);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(finishTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!skippable) return undefined;
    const onKey = (event) => {
      if (event.key === 'Enter' || event.key === ' ') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skippable]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loadout) return null;

  return (
    <div
      className="h-svh w-full overflow-hidden flex flex-col items-center justify-center"
      style={{ background: '#0a0a0f' }}
      onClick={finish}
      role="button"
      tabIndex={0}
      aria-label={skippable ? 'Fighters locked. Continue to the corner.' : 'Fighters entering the arena.'}
    >
      <div className="relative w-full max-w-4xl px-6 grid items-center gap-4" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ x: '-120%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <PixelCreature creature={getCreature(a?.id)} scale={2.2} />
          <div className="font-display text-3xl sm:text-5xl tracking-widest text-center" style={{ color: colorA }}>
            {(a?.name ?? '???').toUpperCase()}
          </div>
        </motion.div>

        <motion.div
          className="font-display text-5xl sm:text-7xl tracking-widest"
          style={{ color: '#EF4444', textShadow: '0 0 40px rgba(239,68,68,0.5)' }}
          initial={{ scale: 2.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.15 }}
        >
          VS
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ x: '120%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <div style={{ transform: 'scaleX(-1)' }}>
            <PixelCreature creature={getCreature(b?.id)} scale={2.2} />
          </div>
          <div className="font-display text-3xl sm:text-5xl tracking-widest text-center" style={{ color: colorB }}>
            {(b?.name ?? '???').toUpperCase()}
          </div>
        </motion.div>
      </div>

      <p className="absolute bottom-8 inset-x-0 text-center px-4 font-display text-xs tracking-[0.35em] text-white/40">
        {skippable ? 'FIGHTERS LOCKED - TAP TO CONTINUE' : 'FIGHTERS ENTERING'}
      </p>
    </div>
  );
}
