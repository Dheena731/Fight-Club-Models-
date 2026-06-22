import { motion } from 'framer-motion';
import { fighterColor } from '../lib/colors';

function TurnBlock({ fighter, text, scores, side }) {
  const color = fighterColor(fighter?.id);
  const total = scores ? Object.values(scores).reduce((a, b) => a + b, 0) : null;

  return (
    <div className={`flex gap-3 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
      {/* avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-1"
        style={{ background: `${color}22`, border: `2px solid ${color}66`, color }}
      >
        {fighter?.name?.[0]}
      </div>

      <div className={`flex-1 ${side === 'right' ? 'text-right' : ''}`}>
        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color }}>
          {fighter?.name}
        </div>
        <div
          className="rounded-xl px-4 py-3 text-sm leading-relaxed text-white/90"
          style={{ background: `${color}14`, border: `1px solid ${color}22` }}
        >
          {text}
        </div>
        {total !== null && (
          <div className="text-[11px] text-white/40 mt-1">
            Score: <span style={{ color }} className="font-bold">{total}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoundCard({ round, fighterA, fighterB, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-arena-card border border-arena-border rounded-2xl p-5 space-y-4"
    >
      {/* round header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-arena-border" />
        <span className="font-display text-xl tracking-widest text-white/30">
          ROUND {round.round}
        </span>
        <div className="h-px flex-1 bg-arena-border" />
      </div>

      <TurnBlock fighter={fighterA} text={round.a.text} scores={round.score?.a} side="left" />
      <TurnBlock fighter={fighterB} text={round.b.text} scores={round.score?.b} side="right" />

      {/* judge verdict */}
      {round.score?.rationale && (
        <div className="border-t border-arena-border pt-3">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
            Judge call — {round.damage} HP damage
          </div>
          <p className="text-xs text-white/50 italic leading-relaxed">{round.score.rationale}</p>
        </div>
      )}
    </motion.div>
  );
}
