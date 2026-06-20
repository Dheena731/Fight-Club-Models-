import { motion } from 'framer-motion';
import { fighterColor } from '../lib/colors';
import PixelCreature from './creatures/PixelCreature';
import { getCreature } from './creatures/pixelData';

export default function FighterCard({ fighter, selected, onClick, hasKey = true }) {
  const color = fighterColor(fighter?.id) ?? fighter?.color ?? '#888';
  const creature = getCreature(fighter?.id ?? fighter?.provider ?? 'custom');

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative w-full text-left rounded-xl border transition-all duration-200 bg-arena-card cursor-pointer outline-none overflow-hidden"
      style={{
        borderColor: selected ? color : '#1e1e2e',
        boxShadow: selected ? `0 0 16px ${color}44` : undefined,
      }}
    >
      {/* top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color, opacity: selected ? 1 : 0.3 }} />

      <div className="flex items-center gap-3 p-3 pr-4">
        {/* pixel creature thumbnail */}
        <div
          className="shrink-0 flex items-end justify-center rounded-lg overflow-hidden"
          style={{ width: 52, height: 52, background: `${color}12` }}
        >
          <PixelCreature creature={creature} scale={selected ? 1.3 : 1.1} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm text-white leading-tight">{fighter?.name}</div>
          <div className="text-xs text-white/40 truncate mt-0.5">{fighter?.tagline}</div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {!hasKey && <span className="text-[10px] text-amber-400/80">🔑</span>}
          {selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3 h-3 rounded-full"
              style={{ background: color }}
            />
          )}
        </div>
      </div>
    </motion.button>
  );
}
