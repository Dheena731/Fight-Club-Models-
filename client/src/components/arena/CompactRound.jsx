import { motion } from 'framer-motion';

function truncate(text, n = 90) {
  if (!text) return '';
  return text.length > n ? text.slice(0, n).trim() + '…' : text;
}

export default function CompactRound({ round, fighterA, fighterB, index }) {
  const margin = (round.score?.total?.a ?? 0) - (round.score?.total?.b ?? 0);
  const winner = margin > 0 ? fighterA : margin < 0 ? fighterB : null;
  const winnerColor = winner?.color ?? 'var(--c-text)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}
    >
      {/* header stripe */}
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <span className="font-display tracking-widest" style={{ fontSize: 11, color: 'var(--c-text-3)' }}>
          ROUND {round.round}
        </span>
        {winner ? (
          <span className="text-xs font-bold tracking-wider" style={{ color: winnerColor }}>
            {winner.name} wins · -{round.damage} HP
          </span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>draw</span>
        )}
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="flex gap-2 items-start">
          <div className="text-xs font-bold shrink-0 mt-0.5" style={{ color: fighterA?.color, width: 52, fontSize: 10 }}>
            {fighterA?.name}
          </div>
          <div className="text-xs leading-relaxed" style={{ color: 'var(--c-text-2)' }}>{truncate(round.a.text)}</div>
        </div>
        <div className="flex gap-2 items-start">
          <div className="text-xs font-bold shrink-0 mt-0.5" style={{ color: fighterB?.color, width: 52, fontSize: 10 }}>
            {fighterB?.name}
          </div>
          <div className="text-xs leading-relaxed" style={{ color: 'var(--c-text-2)' }}>{truncate(round.b.text)}</div>
        </div>
        {round.score?.rationale && (
          <div className="text-xs italic leading-relaxed pt-1" style={{ borderTop: '1px solid var(--c-border)', color: 'var(--c-text-3)' }}>
            {truncate(round.score.rationale, 110)}
          </div>
        )}
      </div>
    </motion.div>
  );
}
