import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { streamBattle } from '../lib/api';
import * as sfx from '../lib/sfx';
import { getStreak } from '../lib/streaks';
import FighterSprite from '../components/FighterSprite';
import HPBar from '../components/arena/HPBar';
import SpeechBubble from '../components/arena/SpeechBubble';
import DamageFloat from '../components/arena/DamageFloat';
import RoundAnnouncer from '../components/arena/RoundAnnouncer';
import CompactRound from '../components/arena/CompactRound';

const START_HP = 100;
const CRIT_DAMAGE = 22; // hits this big get gold numbers, callouts, heavy shake

export default function Battle() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

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

  // Impact juice: white hit-stop flash + whole-stage screen shake
  const [koFlash, setKoFlash] = useState(false);
  const [hitFlash, setHitFlash] = useState(false);
  const [shake, setShake] = useState(null); // { id, amp }
  const [muted, setMuted] = useState(sfx.isMuted());

  // Running cumulative scores across rounds
  const [cumScore, setCumScore] = useState({ a: 0, b: 0 });

  // Compact round log below stage
  const [rounds, setRounds] = useState([]);
  const [phase, setPhase] = useState('fighting'); // 'fighting' | 'ko' | 'error'
  const [error, setError] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [totalRounds] = useState(state?.rounds ?? 3);
  const [winStreak] = useState(() => {
    if (!state?.fighters) return null;
    const aStreak = getStreak(state.fighters.a?.id);
    const bStreak = getStreak(state.fighters.b?.id);
    return aStreak > bStreak
      ? { id: state.fighters.a.id, count: aStreak }
      : bStreak > 0
        ? { id: state.fighters.b.id, count: bStreak }
        : null;
  });

  const logRef = useRef(null);
  const stopRef = useRef(null);
  const dmgIdRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const fighterA = state?.fighters?.a;
  const fighterB = state?.fighters?.b;
  const colorA = fighterA?.color ?? '#D97757';
  const colorB = fighterB?.color ?? '#10A37F';

  function addDamage(side, value) {
    const id = dmgIdRef.current++;
    const setter = side === 'a' ? setDamagesA : setDamagesB;
    setter(d => [...d, { id, value, crit: value >= CRIT_DAMAGE }]);
    setTimeout(() => setter(d => d.filter(x => x.id !== id)), 1500);
  }

  // The hit landing: one white freeze-frame, then shake scaled by damage.
  const impact = useCallback((side, damage, isKo = false) => {
    const crit = damage >= CRIT_DAMAGE;
    sfx.punch(crit || isKo);
    if (crit) sfx.crowd(isKo);
    addDamage(side, damage);
    setHitFlash(true);
    setTimeout(() => setHitFlash(false), 90);
    setShake({ id: dmgIdRef.current, amp: isKo ? 22 : crit ? 13 : 7 });
  }, []);

  const showAnnouncer = useCallback((label, sub, duration = 1400) => {
    setAnnouncer({ label, sub });
    if (sub === 'FIGHT!') sfx.bell();
    setTimeout(() => setAnnouncer(null), duration);
  }, []);

  // Sequence: A speaks → attacks → B hurt → pause → B speaks → attacks → A hurt → HP update
  const playRound = useCallback((round) => {
    const scoreA = round.score?.total?.a ?? 0;
    const scoreB = round.score?.total?.b ?? 0;
    const margin = scoreA - scoreB;
    const aWon = margin > 0;
    const bWon = margin < 0;

    // Update running score
    setCumScore(s => ({ a: s.a + scoreA, b: s.b + scoreB }));

    // Show speech bubbles immediately
    setBubbleA({ text: round.a.text, key: round.round });
    setBubbleB({ text: round.b.text, key: round.round });

    const isKo = round.hp.a === 0 || round.hp.b === 0;

    // Winner attacks first; HP snaps on impact (ghost bar lags behind)
    if (aWon) {
      setSpriteA('attack');
      setTimeout(() => { setSpriteA('idle'); setSpriteB('hurt'); impact('b', round.damage, isKo); setHp({ ...round.hp }); }, 380);
      setTimeout(() => setSpriteB('idle'), 780);
    } else if (bWon) {
      setSpriteB('attack');
      setTimeout(() => { setSpriteB('idle'); setSpriteA('hurt'); impact('a', round.damage, isKo); setHp({ ...round.hp }); }, 380);
      setTimeout(() => setSpriteA('idle'), 780);
    } else {
      setTimeout(() => setHp({ ...round.hp }), 380);
    }

    // Add compact round card after animations settle
    setTimeout(() => {
      setRounds(rs => [...rs, round]);
      setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }), 80);
    }, 900);

    // Clear bubbles after a while
    setTimeout(() => { setBubbleA(null); setBubbleB(null); }, 5000);
  }, [impact]);

  // Mount-only: start the battle stream
  useEffect(() => {
    const s = stateRef.current;
    if (!s) { navigate('/'); return; }

    // Show round 1 announcer on start
    showAnnouncer('ROUND 1', 'FIGHT!');

    stopRef.current = streamBattle(s, {
      onRound(round) {
        setCurrentRound(round.round);
        if (round.round > 1) {
          showAnnouncer(`ROUND ${round.round}`, 'FIGHT!');
          setTimeout(() => playRound(round), 1000);
        } else {
          setTimeout(() => playRound(round), 1500);
        }
      },
      onEnd(result) {
        const s2 = stateRef.current;
        setTimeout(() => {
          setKoFlash(true);
          setTimeout(() => setKoFlash(false), 180);
          sfx.ko();
          setShake({ id: -1, amp: 22 });
          showAnnouncer('K.O.', null, 2000);
          if (result.winnerId === s2?.fighters?.a?.id) { setSpriteA('win'); setSpriteB('ko'); }
          else if (result.winnerId === s2?.fighters?.b?.id) { setSpriteB('win'); setSpriteA('ko'); }
          setPhase('ko');
          setTimeout(() => navigate('/result', { state: result }), 2400);
        }, 400);
      },
      onError(msg) { setError(msg); setPhase('error'); },
    });

    return () => stopRef.current?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const modeLabel = { roast: 'ROAST BATTLE', injection: 'PROMPT INJECTION', impersonation: 'IMPERSONATION' };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0a0a0f' }}>

      {/* ── ARENA STAGE (fixed, never scrolls; shakes on impact) ── */}
      <motion.div
        className="arena-stage relative flex-shrink-0"
        style={{ height: 'min(380px, 45svh)', '--arena-h': 'min(380px, 45svh)' }}
        animate={
          shake && !reducedMotion
            ? {
                x: [0, -shake.amp, shake.amp, -shake.amp * 0.6, shake.amp * 0.6, -shake.amp * 0.25, shake.amp * 0.25, 0],
                y: [0, shake.amp * 0.35, -shake.amp * 0.35, shake.amp * 0.2, -shake.amp * 0.2, 0, 0, 0],
              }
            : { x: 0, y: 0 }
        }
        transition={{ duration: 0.5 }}
        key={shake?.id ?? 'still'}
      >

        {/* KO flash */}
        <AnimatePresence>
          {koFlash && (
            <motion.div className="absolute inset-0 z-50 pointer-events-none bg-white"
              initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.18 }} />
          )}
        </AnimatePresence>

        {/* Hit-stop flash — one white frame when a hit lands */}
        {hitFlash && !reducedMotion && (
          <div className="absolute inset-0 z-50 pointer-events-none bg-white/70" aria-hidden="true" />
        )}

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
                {damagesA.map(d => <DamageFloat key={d.id} id={d.id} value={d.value} crit={d.crit} />)}
                <FighterSprite fighter={fighterA} state={spriteA} flip={false} scale={2.5} />
              </div>
            </div>

            {/* Fighter B (mirrored) */}
            <div className="relative flex flex-col items-center justify-end pb-2">
              <SpeechBubble text={bubbleB?.text} side="right" visible={!!bubbleB} />
              <div className="relative">
                {damagesB.map(d => <DamageFloat key={d.id} id={d.id} value={d.value} crit={d.crit} />)}
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
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3"
          style={{ height: 40, background: 'rgba(0,0,0,0.8)', borderTop: '1px solid #1e1e2e' }}>

          <div className="flex items-center gap-3 min-w-0">
            {phase === 'fighting' && (
              <div className="flex items-center gap-2 shrink-0">
                <motion.span
                  className="inline-block w-2 h-2 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-xs text-white/40 tracking-widest uppercase hidden sm:inline">Live</span>
              </div>
            )}
            {phase === 'ko' && (
              <span className="text-xs font-bold tracking-widest text-red-400 uppercase shrink-0">Fight over</span>
            )}
            {phase === 'error' && (
              <span className="text-xs text-red-400 truncate">{error}</span>
            )}

            {/* Running score */}
            {rounds.length > 0 && (
              <div className="flex items-center gap-2 text-[11px] font-display tracking-wider">
                <span style={{ color: colorA }}>{cumScore.a}</span>
                <span className="text-white/20">-</span>
                <span style={{ color: colorB }}>{cumScore.b}</span>
              </div>
            )}

            {/* Win streak */}
            {winStreak && (
              <span className="text-[11px] text-amber-400 font-display tracking-wider hidden sm:inline">
                🔥 {winStreak.count}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setMuted(sfx.toggleMute())}
              aria-pressed={!muted}
              aria-label={muted ? 'Unmute sound' : 'Mute sound'}
              title={muted ? 'Sound off — click for fight-night audio' : 'Mute'}
              className="text-sm min-w-[44px] min-h-[44px] flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <button onClick={() => navigate('/')} className="text-xs text-white/25 hover:text-white/50 transition-colors tracking-wider min-w-[44px] min-h-[44px] flex items-center justify-end">
              EXIT
            </button>
          </div>
        </div>
      </motion.div>

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
