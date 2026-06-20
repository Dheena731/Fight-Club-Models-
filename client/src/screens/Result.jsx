import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fighterColor } from '../lib/colors';
import { getCreature } from '../components/creatures/pixelData';
import CompactRound from '../components/arena/CompactRound';
import FighterSprite from '../components/FighterSprite';
import ThemeToggle from '../components/ThemeToggle';

function ShareCard({ result }) {
  const winner = result.winnerId
    ? (result.winnerId === result.fighters?.a?.id ? result.fighters.a : result.fighters.b)
    : null;

  const text = winner
    ? `${winner.name} just won ${result.ko ? 'by K.O.' : 'on points'} in AI Battle Arena!`
    : `The AI Battle Arena ended in a DRAW!`;

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: 'AI Battle Arena', text, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${shareUrl}`)
        .then(() => alert('Copied to clipboard!'));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl p-5 text-center space-y-3"
      style={{ background: 'var(--c-raised)', border: '1px solid var(--c-border)' }}
    >
      <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>{text}</p>
      <button
        onClick={handleShare}
        className="px-6 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
        style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-accent)' }}
      >
        Share Result ↗
      </button>
    </motion.div>
  );
}

function HPSummaryBar({ fighter, hp }) {
  const color = fighter?.color ?? '#888';
  const pct = Math.max(0, Math.min(100, hp));

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold w-20 shrink-0" style={{ color }}>{fighter?.name}</span>
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--c-raised)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs tabular-nums font-bold w-10 text-right" style={{ color }}>{hp} HP</span>
    </div>
  );
}

export default function Result() {
  const { state: result } = useLocation();
  const navigate = useNavigate();

  if (!result) { navigate('/'); return null; }

  const { fighters, rounds, finalHp, winnerId, ko } = result;
  const winner = winnerId
    ? (winnerId === fighters?.a?.id ? fighters.a : fighters.b)
    : null;
  const loser = winner
    ? (winner.id === fighters?.a?.id ? fighters.b : fighters.a)
    : null;
  const winnerColor = winner ? (winner.color || fighterColor(winner.id)) : '#fff';
  const winnerIsA = winner?.id === fighters?.a?.id;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-bg)' }}>

      {/* ── WINNER REVEAL (always dark/dramatic) ── */}
      <div
        className="relative overflow-hidden arena-dark scanlines"
        style={{
          background: `linear-gradient(to bottom, #0a0a0f 0%, ${winnerColor}0A 60%, var(--c-bg) 100%)`,
        }}
      >
        {/* theme toggle */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        {/* confetti */}
        {winner && Array.from({ length: 16 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{ background: winnerColor, left: `${5 + i * 5.8}%`, top: '8%' }}
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{ y: 90 + (i % 3) * 25, opacity: 0, scale: 0.5 + (i % 4) * 0.2 }}
            transition={{ delay: i * 0.05 + 0.2, duration: 1.4, ease: 'easeOut' }}
          />
        ))}

        <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col items-center gap-6">

          {/* winner creature — big */}
          {winner && (
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
            >
              <FighterSprite
                fighter={{ ...winner, id: winner.id }}
                state="win"
                flip={!winnerIsA}
                scale={4}
              />
            </motion.div>
          )}

          {/* loser creature — small, K.O. */}
          {loser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute opacity-40"
              style={{ right: '8%', bottom: 40 }}
            >
              <FighterSprite
                fighter={{ ...loser, id: loser.id }}
                state="ko"
                flip={winnerIsA}
                scale={1.8}
              />
            </motion.div>
          )}

          {/* result text */}
          <motion.div
            className="text-center"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.3 }}
          >
            {winner ? (
              <>
                <div
                  className="font-display tracking-widest leading-none"
                  style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', color: winnerColor, textShadow: `0 0 60px ${winnerColor}66` }}
                >
                  {winner.name}
                </div>
                <div className="font-display text-2xl tracking-widest text-white/50 mt-2">
                  {ko ? 'WINS BY K.O.' : 'WINS ON POINTS'}
                </div>
                {loser && (
                  <div className="text-sm mt-2 text-white/30">
                    {loser.name} — {finalHp?.[loser.id === fighters.a.id ? 'a' : 'b']} HP left
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="font-display text-7xl tracking-widest text-white/50">DRAW</div>
                <div className="text-white/30 text-sm mt-2">Both fighters matched evenly</div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-3xl mx-auto w-full px-4 py-8 space-y-6">

        {/* Final HP */}
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
          <h3 className="font-display text-lg tracking-wider" style={{ color: 'var(--c-text-3)' }}>FINAL SCORE</h3>
          <HPSummaryBar
            fighter={{ ...fighters?.a, color: fighters?.a?.color || fighterColor(fighters?.a?.id) }}
            hp={finalHp?.a ?? 0}
          />
          <HPSummaryBar
            fighter={{ ...fighters?.b, color: fighters?.b?.color || fighterColor(fighters?.b?.id) }}
            hp={finalHp?.b ?? 0}
          />
        </div>

        {/* Share */}
        <ShareCard result={result} />

        {/* Round Recap */}
        <div className="space-y-3">
          <h3 className="font-display text-xl tracking-wider" style={{ color: 'var(--c-text-3)' }}>FIGHT RECAP</h3>
          {rounds?.map((r, i) => (
            <CompactRound
              key={r.round}
              round={r}
              fighterA={{ ...fighters?.a, color: fighters?.a?.color || fighterColor(fighters?.a?.id) }}
              fighterB={{ ...fighters?.b, color: fighters?.b?.color || fighterColor(fighters?.b?.id) }}
              index={i}
            />
          ))}
        </div>

        {/* Play again */}
        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-display text-2xl tracking-widest transition-all duration-200 outline-none"
          style={{ background: 'var(--c-raised)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}
        >
          FIGHT AGAIN
        </motion.button>
      </main>
    </div>
  );
}
