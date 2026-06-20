import { motion } from 'framer-motion';
import { fighterColor } from '../lib/colors';

export default function HealthBar({ fighter, hp, maxHp = 100, flip = false }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const color = fighterColor(fighter?.id);
  const danger = pct < 30;

  return (
    <div className={`flex flex-col gap-1 ${flip ? 'items-end' : 'items-start'} w-full`}>
      <div className={`flex items-center gap-2 ${flip ? 'flex-row-reverse' : ''}`}>
        <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
          {fighter?.name}
        </span>
        <span
          className={`text-xs font-bold tabular-nums transition-colors ${danger ? 'text-red-400' : 'text-white/80'}`}
        >
          {Math.round(hp)} HP
        </span>
      </div>

      <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: danger ? '#ef4444' : color }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        />
        {/* inner shine */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full pointer-events-none" />
      </div>
    </div>
  );
}
