import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameDispatch } from '../game/GameContext';
import { decodeReplayFromHash } from '../lib/replay';
import { clearKeys } from '../lib/keys';

/**
 * BOOT — short power-on. Pixi initializes only on entering a playable scene.
 * Shared result links still open their recap directly.
 */
export default function Boot() {
  const dispatch = useGameDispatch();
  const [lineDone, setLineDone] = useState(false);
  const replayRef = useRef(null);

  useEffect(() => {
    // Retire old browser-stored keys without reading or copying them.
    clearKeys();
    replayRef.current = decodeReplayFromHash();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setLineDone(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (lineDone) {
      const t = setTimeout(() => {
        if (replayRef.current) {
          dispatch({ type: 'SHOW_REPLAY', result: replayRef.current });
        } else {
          dispatch({ type: 'BOOT_DONE' });
        }
      }, 200);
      return () => clearTimeout(t);
    }
  }, [lineDone, dispatch]);

  return (
    <div
      className="h-svh w-full flex items-center justify-center overflow-hidden"
      style={{ background: '#000' }}
      role="status"
      aria-label="Loading AI Frontier"
    >
      <motion.div
        className="relative w-full max-w-3xl mx-8"
        style={{ height: 4, background: '#1e1e2e' }}
        initial={{ scaleX: 0.02, opacity: 0.4 }}
        animate={{ scaleX: 1, opacity: 1, height: lineDone ? 'min(70vh, 540px)' : 4 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ background: '#0a0a0f', opacity: lineDone ? 1 : 0, transition: 'opacity 0.3s' }}
        >
          <div
            className="font-display tracking-[0.4em] text-2xl sm:text-4xl"
            style={{ color: '#FFB627', textShadow: '0 0 24px rgba(255,182,39,0.4)' }}
          >
            AI FRONTIER
          </div>
          <div className="font-display text-xs tracking-[0.35em] text-white/30">
            {lineDone ? 'READY' : 'POWER ON…'}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
