import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { streamBattle } from '../lib/api';
import FighterSprite from '../components/FighterSprite';
import HPBar from '../components/arena/HPBar';
import SpeechBubble from '../components/arena/SpeechBubble';
import DamageFloat from '../components/arena/DamageFloat';
import RoundAnnouncer from '../components/arena/RoundAnnouncer';
import CompactRound from '../components/arena/CompactRound';

const START_HP = 100;

export default function Battle() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // HP
  const [hp, setHp] = useState({ a: START_HP, b: START_HP });

  // Speech bubbles – each has { text, key } or null
  const [bubbleA, setBubbleA] = useState(null);
  const [bubbleB, setBubbleB] = useState(null);

  // Creature animation states
  const [spriteA, setSpriteA] = useState('idle');
  const [spriteB, setSpriteB] = useState('idle');

  // Floating damage numbers
  const [damagesA, setDamagesA] = useState([]); // { id, value }
  const [damagesB, setDamagesB] = useState([]);

  // Round announcer overlay
  const [announcer, setAnnouncer] = useState(null); // { label, sub }

  // Screen flash for KO
  const [koFlash, setKoFlash] = useState(false);

  // Compact round log below stage
  const [rounds, setRounds] = useState([]);
  const [phase, setPhase] = useState('fighting'); // 'fighting' | 'ko' | 'error'
  const [error, setError] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [totalRounds] = useState(state?.rounds ?? 3);

  const logRef = useRef(null);
  const stopRef = useRef(null);
  const dmgIdRef = useRef(0);

  const fighterA = state?.fighters?.a;
  const fighterB = state?.fighters?.b;
  const colorA = fighterA?.color ?? '#D97757';
  const colorB = fighterB?.color ?? '#10A37F';

  function addDamage(side, value) {
    const id = dmgIdRef.current++;
    const setter = side === 'a' ? setDamagesA : setDamagesB;
    setter(d => [...d, { id, value }]);
    setTimeout(() => setter(d => d.filter(x => x.id !== id)), 1300);
  }

  function showAnnouncer(label, sub, duration = 1400) {
    setAnnouncer({ label, sub });
    setTimeout(() => setAnnouncer(null), duration);
  }

  // Sequence: A speaks → attacks → B hurt → pause → B speaks → attacks → A hurt → HP update
  const playRound = useCallback((round) => {
    const margin = (round.score?.total?.a ?? 0) - (round.score?.total?.b ?? 0);
    const aWon = margin > 0;
    const bWon = margin < 0;

    // Show speech bubbles immediately
    setBubbleA({ text: round.a.text, key: round.round });
    setBubbleB({ text: round.b.text, key: round.round });

    // Winner attacks first
    if (aWon) {
      setSpriteA('attack');
      setTimeout(() => { setSpriteA('idle'); setSpriteB('hurt'); addDamage('b', round.damage); }, 380);
      setTimeout(() => setSpriteB('idle'), 780);
    } else if (bWon) {
      setSpriteB('attack');
      setTimeout(() => { setSpriteB('idle'); setSpriteA('hurt'); addDamage('a', round.damage); }, 380);
      setTimeout(() => setSpriteA('idle'), 780);
    }

    // Update HP + add compact round card after animations settle
    setTimeout(() => {
      setHp({ ...round.hp });
      setRounds(rs => [...rs, round]);
      setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }), 80);
    }, 900);

    // Clear bubbles after a while
    setTimeout(() => { setBubbleA(null); setBubbleB(null); }, 5000);
  }, []);

  useEffect(() => {
    if (!state) { navigate('/'); return; }

    // Show round 1 announcer on start
    showAnnouncer('ROUND 1', 'FIGHT!');

    stopRef.current = streamBattle(state, {
      onRound(round) {
        setCurrentRound(round.round);
        // Show round announcer only for rounds 2+
        if (round.round > 1) {
          showAnnouncer(`ROUND ${round.round}`, 'FIGHT!');
          setTimeout(() => playRound(round), 1000);
        } else {
          // Round 1: play immediately after the intro announcer
          setTimeout(() => playRound(round), 1500);
        }
      },
      onEnd(result) {
        const winnerId = result.winnerId;
        setTimeout(() => {
          setKoFlash(true);
          setTimeout(() => setKoFlash(false), 180);
          showAnnouncer('K.O.', null, 2000);
          if (winnerId === fighterA?.id) { setSpriteA('win'); setSpriteB('ko'); }
          else if (winnerId === fighterB?.id) { setSpriteB('win'); setSpriteA('ko'); }
          setPhase('ko');
          setTimeout(() => navigate('/result', { state: result }), 2400);
        }, 400);
      },
      onError(msg) { setError(msg); setPhase('error'); },
    });

    return () => stopRef.current?.();
  }, []);

  const modeLabel = { roast: 'ROAST BATTLE', injection: 'PROMPT INJECTION', impersonation: 'IMPERSONATION' };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0a0a0f' }}>

      {/* ── ARENA STAGE (fixed, never scrolls) ── */}
      <div className="relative flex-shrink-0" style={{ height: 'min(380px, 45svh)', '--arena-h': 'min(380px, 45svh)' }}>

        {/* KO flash */}
        <AnimatePresence>
          {koFlash && (
            <motion.div className="absolute inset-0 z-50 pointer-events-none bg-white"
              initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.18 }} />
          )}
        </AnimatePresence>

        {/* Fighter A ambient glow (left) */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 50% 80% at 15% 80%, ${colorA}1A, transparent 70%)` }} />

        {/* Fighter B ambient glow (right) */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 50% 80% at 85% 80%, ${colorB}1A, transparent 70%)` }} />

        {/* Subtle stage shade */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.025), transparent 34%, rgba(0,0,0,0.22))',
        }} />

        {/* ── HP BARS ── */}
        <div className="relative z-10 grid gap-2 px-4 pt-3 pb-2"
          style={{ gridTemplateColumns: '1fr auto 1fr', borderBottom: '1px solid #1e1e2e', background: 'rgba(0,0,0,0.6)' }}>
          <HPBar fighter={fighterA} hp={hp.a} flip={false} />

          {/* round counter */}
          <div className="flex flex-col items-center justify-center px-3 gap-0.5">
            <span className="font-display tracking-widest text-white/20" style={{ fontSize: 9 }}>
              {modeLabel[state?.mode] ?? '⚔ BATTLE'}
            </span>
            <span className="font-display tracking-widest text-white/50" style={{ fontSize: 14 }}>
              {currentRound ?? '—'} <span className="text-white/20">/</span> {totalRounds}
            </span>
          </div>

          <HPBar fighter={fighterB} hp={hp.b} flip={true} />
        </div>

        {/* ── FIGHTING STAGE ── */}
        <div className="relative flex-1" style={{ height: 'calc(var(--arena-h, 380px) - 72px - 40px)' }}>

          {/* Round / KO announcer */}
          <RoundAnnouncer label={announcer?.label} sub={announcer?.sub} visible={!!announcer} />

          {/* Fighters */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'flex-end', padding: '0 40px 0' }}>

            {/* Fighter A */}
            <div className="relative flex flex-col items-center justify-end pb-2">
              <SpeechBubble text={bubbleA?.text} side="left" visible={!!bubbleA} />
              <div className="relative">
                {damagesA.map(d => <DamageFloat key={d.id} id={d.id} value={d.value} />)}
                <FighterSprite fighter={fighterA} state={spriteA} flip={false} scale={2.5} />
              </div>
            </div>

            {/* Fighter B (mirrored) */}
            <div className="relative flex flex-col items-center justify-end pb-2">
              <SpeechBubble text={bubbleB?.text} side="right" visible={!!bubbleB} />
              <div className="relative">
                {damagesB.map(d => <DamageFloat key={d.id} id={d.id} value={d.value} />)}
                <FighterSprite fighter={fighterB} state={spriteB} flip={true} scale={2.5} />
              </div>
            </div>
          </div>
        </div>

        {/* ── STAGE FLOOR ── */}
        <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, height: 4, background: '#1e1e2e' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(to right, ${colorA}66, #ffffff22, ${colorB}66)` }} />
        </div>

        {/* ── STATUS BAR ── */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4"
          style={{ height: 40, background: 'rgba(0,0,0,0.8)', borderTop: '1px solid #1e1e2e' }}>

          {phase === 'fighting' && (
            <div className="flex items-center gap-2">
              <motion.span
                className="inline-block w-2 h-2 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs text-white/40 tracking-widest uppercase">Live</span>
            </div>
          )}
          {phase === 'ko' && (
            <span className="text-xs font-bold tracking-widest text-red-400 uppercase">Fight over</span>
          )}
          {phase === 'error' && (
            <span className="text-xs text-red-400">{error}</span>
          )}

          <button onClick={() => navigate('/')} className="text-xs text-white/25 hover:text-white/50 transition-colors tracking-wider min-w-[44px] min-h-[44px] flex items-center justify-end">
            EXIT
          </button>
        </div>
      </div>

      {/* ── ROUND LOG (scrollable below stage) ── */}
      <div ref={logRef} className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3" style={{ background: '#0a0a0f', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>

        {rounds.length === 0 && phase === 'fighting' && (
          <div className="flex items-center justify-center gap-3 py-12 text-white/25 text-sm">
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            Waiting for round 1…
          </div>
        )}

        {rounds.map((r, i) => (
          <CompactRound
            key={r.round}
            round={r}
            fighterA={{ ...fighterA, color: colorA }}
            fighterB={{ ...fighterB, color: colorB }}
            index={i}
          />
        ))}

        {/* thinking between rounds */}
        {phase === 'fighting' && rounds.length > 0 && rounds.length < totalRounds && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-white/25 text-xs py-2 pl-2"
          >
            <motion.div className="w-3 h-3 rounded-full border border-white/20 border-t-white/50"
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
            models are cooking round {(currentRound ?? 0) + 1}…
          </motion.div>
        )}
      </div>
    </div>
  );
}
