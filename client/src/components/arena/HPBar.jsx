import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PixelCreature from '../creatures/PixelCreature';
import { getCreature } from '../creatures/pixelData';

// Classic SF2-style HP bar with a fighting-game "ghost" lag bar:
// the colored fill snaps down on impact, a white segment lingers and
// drains a beat later so the eye reads how big the hit was.
// flip=true → bar fills right-to-left (fighter B).
export default function HPBar({ fighter, hp, maxHp = 100, flip = false }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const color = pct > 50 ? (fighter?.color ?? '#fff') : pct > 25 ? '#FACC15' : '#EF4444';
  const danger = pct <= 25;
  const creature = getCreature(fighter?.id ?? fighter?.provider);
  const name = (fighter?.name ?? '???').toUpperCase();

  // Ghost bar trails the real HP after a delay.
  const [ghost, setGhost] = useState(pct);
  useEffect(() => {
    if (pct < ghost) {
      const t = setTimeout(() => setGhost(pct), 450);
      return () => clearTimeout(t);
    }
    setGhost(pct);
  }, [pct, ghost]);

  return (
    <div className={`flex items-center gap-2 ${flip ? 'flex-row-reverse' : ''}`}>
      {/* portrait */}
      <div
        className="shrink-0 rounded flex items-end justify-center overflow-hidden"
        style={{ width: 36, height: 36, background: `${fighter?.color ?? '#888'}18`, border: `1px solid ${fighter?.color ?? '#888'}44` }}
      >
        <PixelCreature creature={creature} scale={1} />
      </div>

      <div className={`flex flex-col gap-1 flex-1 ${flip ? 'items-end' : 'items-start'}`}>
        <span className="font-display text-xs tracking-widest" style={{ color: fighter?.color ?? '#fff', fontSize: 10 }}>
          {name}
        </span>

        {/* bar track */}
        <div className="relative w-full h-3 rounded-sm overflow-hidden" style={{ background: '#0a0a0f', border: '1px solid #1e1e2e' }}>
          {/* danger pulse */}
          {danger && (
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{ background: '#EF4444' }}
            />
          )}

          {/* ghost lag bar — white, drains after the hit */}
          <motion.div
            className="absolute top-0 h-full"
            style={{ [flip ? 'right' : 'left']: 0, background: 'rgba(255,255,255,0.85)' }}
            animate={{ width: `${Math.max(ghost, pct)}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* real HP — snaps down on impact */}
          <motion.div
            className="absolute top-0 h-full rounded-sm"
            style={{ [flip ? 'right' : 'left']: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="w-full h-full" style={{ background: color }} />
            {/* shine */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10" />
          </motion.div>
        </div>

        <span className={`text-xs tabular-nums font-bold ${danger ? 'text-red-400' : 'text-white/50'}`} style={{ fontSize: 9 }}>
          {Math.round(hp)} HP
        </span>
      </div>
    </div>
  );
}
