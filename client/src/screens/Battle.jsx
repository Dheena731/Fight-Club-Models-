import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { streamBattle } from '../lib/api';
import * as sfx from '../lib/sfx';
import { getStreak } from '../lib/streaks';
import { useGameState, useGameDispatch, useArenaCredentials, FIGHT_BEAT } from '../game/GameContext';
import { useStage } from '../stage/StageContext';
import Letterbox from '../stage/Letterbox';
import PixiCanvas from '../stage/PixiCanvas';
import HPBar from '../components/arena/HPBar';
import SpeechBubble from '../components/arena/SpeechBubble';
import RoundAnnouncer from '../components/arena/RoundAnnouncer';
import CompactRound from '../components/arena/CompactRound';
import CornerPlanner from '../components/arena/CornerPlanner';

const START_HP = 100;
const CRIT_DAMAGE = 22;

export default function Battle() {
  const { loadout } = useGameState();
  const dispatch = useGameDispatch();
  const withArenaCredentials = useArenaCredentials();
  const {
    setFighters,
    setSpriteState,
    spawnDamage,
    clearFx,
    anchors,
  } = useStage();
  const reducedMotion = useReducedMotion();

  const [hp, setHp] = useState({ a: START_HP, b: START_HP });
  const [bubbleA, setBubbleA] = useState(null);
  const [bubbleB, setBubbleB] = useState(null);
  const [announcer, setAnnouncer] = useState(null);
  const [koFlash, setKoFlash] = useState(false);
  const [hitFlash, setHitFlash] = useState(false);
  const [shake, setShake] = useState(null);
  const [muted, setMuted] = useState(sfx.isMuted());
  const [cumScore, setCumScore] = useState({ a: 0, b: 0 });
  const [rounds, setRounds] = useState([]);
  const [plannedCards, setPlannedCards] = useState(null);
  const [phase, setPhase] = useState('corner');
  const [error, setError] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [statusHint, setStatusHint] = useState('Waiting for round 1…');

  const totalRounds = loadout?.rounds ?? 3;
  const fighterA = loadout?.fighters?.a;
  const fighterB = loadout?.fighters?.b;
  const colorA = fighterA?.color ?? '#D97757';
  const colorB = fighterB?.color ?? '#10A37F';

  const [winStreak] = useState(() => {
    if (!loadout?.fighters) return null;
    const aStreak = getStreak(loadout.fighters.a?.id);
    const bStreak = getStreak(loadout.fighters.b?.id);
    return aStreak > bStreak
      ? { id: loadout.fighters.a.id, count: aStreak }
      : bStreak > 0
        ? { id: loadout.fighters.b.id, count: bStreak }
        : null;
  });

  const logRef = useRef(null);
  const stopRef = useRef(null);
  const timersRef = useRef(new Set());
  const activeRef = useRef(true);
  const dmgIdRef = useRef(0);
  const pendingRef = useRef({ a: null, b: null });
  const lastVerdictAtRef = useRef(0);
  const loadoutRef = useRef(loadout);
  loadoutRef.current = withArenaCredentials(loadout);

  const schedule = useCallback((fn, delay) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      if (activeRef.current) fn();
    }, delay);
    timersRef.current.add(id);
    return id;
  }, []);

  const impact = useCallback((side, damage, isKo = false) => {
    const crit = damage >= CRIT_DAMAGE;
    sfx.punch(crit || isKo);
    if (crit) sfx.crowd(isKo);
    spawnDamage(side, damage);
    setHitFlash(true);
    schedule(() => setHitFlash(false), 90);
    setShake({ id: dmgIdRef.current++, amp: isKo ? 22 : crit ? 13 : 7 });
  }, [spawnDamage, schedule]);

  const showAnnouncer = useCallback((label, sub, duration = 1400) => {
    setAnnouncer({ label, sub });
    if (sub === 'FIGHT!') sfx.bell();
    schedule(() => setAnnouncer(null), duration);
  }, [schedule]);

  const playVerdict = useCallback((round) => {
    dispatch({ type: 'SET_FIGHT_BEAT', beat: FIGHT_BEAT.VERDICT });
    const scoreA = round.score?.total?.a ?? 0;
    const scoreB = round.score?.total?.b ?? 0;
    const margin = scoreA - scoreB;
    const aWon = margin > 0;
    const bWon = margin < 0;

    setCumScore((s) => ({ a: s.a + scoreA, b: s.b + scoreB }));
    const isKo = round.hp.a === 0 || round.hp.b === 0;

    if (aWon) {
      setSpriteState('a', 'attack');
      schedule(() => {
        setSpriteState('a', 'idle');
        setSpriteState('b', 'hurt');
        impact('b', round.damage, isKo);
        setHp({ ...round.hp });
      }, 380);
      schedule(() => setSpriteState('b', 'idle'), 780);
    } else if (bWon) {
      setSpriteState('b', 'attack');
      schedule(() => {
        setSpriteState('b', 'idle');
        setSpriteState('a', 'hurt');
        impact('a', round.damage, isKo);
        setHp({ ...round.hp });
      }, 380);
      schedule(() => setSpriteState('a', 'idle'), 780);
    } else {
      schedule(() => setHp({ ...round.hp }), 380);
    }

    schedule(() => {
      setRounds((rs) => [...rs, round]);
      schedule(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }), 80);
      dispatch({ type: 'SET_FIGHT_BEAT', beat: FIGHT_BEAT.WINDUP });
    }, 900);
  }, [dispatch, impact, setSpriteState, schedule]);

  // Mount the selected fighters, then wait for the player to call the rounds.
  useEffect(() => {
    activeRef.current = true;
    const timers = timersRef.current;
    const selected = loadoutRef.current;
    if (!selected) {
      dispatch({ type: 'EXIT_TO_SELECT' });
      return;
    }

    setFighters(selected.fighters.a, selected.fighters.b);
    clearFx();
    dispatch({ type: 'SET_FIGHT_BEAT', beat: FIGHT_BEAT.CORNER });
    setStatusHint('Choose one P1 tactic for every round.');

    return () => {
      activeRef.current = false;
      stopRef.current?.();
      for (const id of timers) clearTimeout(id);
      timers.clear();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A committed card plan starts the paid model stream exactly once.
  useEffect(() => {
    if (!plannedCards) return undefined;
    const selected = loadoutRef.current;
    if (!selected) return undefined;

    setPhase('fighting');
    showAnnouncer('ROUND 1', 'FIGHT!');
    dispatch({ type: 'SET_FIGHT_BEAT', beat: FIGHT_BEAT.WINDUP });
    setStatusHint(`${selected.fighters.a?.name ?? 'P1'} is winding up...`);

    stopRef.current = streamBattle({ ...selected, cards: plannedCards }, {
      onTurnA(payload) {
        setCurrentRound(payload.round);
        setCurrentCard(payload.card ?? null);
        if (payload.round > 1) showAnnouncer(`ROUND ${payload.round}`, 'FIGHT!', 1000);
        pendingRef.current.a = payload.a;
        setBubbleA({ text: payload.a.text, key: `a-${payload.round}` });
        setBubbleB(null);
        setSpriteState('a', 'idle');
        dispatch({ type: 'SET_FIGHT_BEAT', beat: FIGHT_BEAT.EXCHANGE });
        setStatusHint(`${selected.fighters.b?.name ?? 'P2'} is cooking a comeback...`);
      },
      onTurnB(payload) {
        pendingRef.current.b = payload.b;
        setBubbleB({ text: payload.b.text, key: `b-${payload.round}` });
        setStatusHint('TWO BLIND JUDGES ARE SCORING...');
      },
      onVerdict(round) {
        lastVerdictAtRef.current = Date.now();
        playVerdict(round);
        setStatusHint(
          round.hp.a === 0 || round.hp.b === 0
            ? 'K.O.'
            : `models are cooking round ${round.round + 1}...`,
        );
      },
      onEnd(result) {
        const verdictElapsed = Date.now() - lastVerdictAtRef.current;
        const settleDelay = Math.max(0, 1400 - verdictElapsed);
        schedule(() => {
          if (result.ko) {
            setKoFlash(true);
            schedule(() => setKoFlash(false), 180);
            sfx.ko();
            setShake({ id: -1, amp: 22 });
          } else sfx.bell();
          showAnnouncer(result.ko ? 'K.O.' : result.winnerId ? 'DECISION' : 'DRAW', null, 2000);
          if (result.winnerId === selected.fighters?.a?.id) {
            setSpriteState('a', 'win');
            setSpriteState('b', result.ko ? 'ko' : 'idle');
          } else if (result.winnerId === selected.fighters?.b?.id) {
            setSpriteState('b', 'win');
            setSpriteState('a', result.ko ? 'ko' : 'idle');
          }
          setPhase('ko');
          schedule(() => dispatch({ type: 'FIGHT_END', result }), 2400);
        }, settleDelay);
      },
      onError(message) {
        setError(message);
        setPhase('error');
      },
    });

    return () => stopRef.current?.();
  }, [plannedCards]); // eslint-disable-line react-hooks/exhaustive-deps

  const modeLabel = { roast: 'ROAST BATTLE', injection: 'PROMPT INJECTION', impersonation: 'IMPERSONATION' };

  // Bubble positions from Pixi head anchors (logical coords inside letterbox)
  const bubbleStyleA = anchors?.a?.head
    ? { left: anchors.a.head.x, top: anchors.a.head.y, transform: 'translate(-50%, -100%)' }
    : { left: '25%', top: '40%' };
  const bubbleStyleB = anchors?.b?.head
    ? { left: anchors.b.head.x, top: anchors.b.head.y, transform: 'translate(-50%, -100%)' }
    : { left: '75%', top: '40%' };

  return (
    <div className="h-svh flex flex-col overflow-hidden" style={{ background: '#0a0a0f' }}>
      {/* Arena band — letterboxed 960×540 */}
      <div className="relative flex-shrink-0 w-full" style={{ height: 'min(540px, 55svh)' }}>
        <Letterbox shake={shake} className="arena-stage">
          {/* Pixi stage (z0) */}
          <PixiCanvas />

          {/* Ambient glows (DOM, under overlay UI) */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1,
            background: `radial-gradient(ellipse 50% 80% at 15% 80%, ${colorA}1A, transparent 70%),
                         radial-gradient(ellipse 50% 80% at 85% 80%, ${colorB}1A, transparent 70%)` }} />

          {/* DOM overlay (z1) */}
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            <AnimatePresence>
              {koFlash && (
                <motion.div className="absolute inset-0 z-50 pointer-events-none bg-white"
                  initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.18 }} />
              )}
            </AnimatePresence>
            {hitFlash && !reducedMotion && (
              <div className="absolute inset-0 z-50 pointer-events-none bg-white/70" aria-hidden="true" />
            )}

            {/* HP bars */}
            <div className="relative z-10 grid gap-2 px-4 pt-3 pb-2"
              style={{ gridTemplateColumns: '1fr auto 1fr', borderBottom: '1px solid #1e1e2e', background: 'rgba(0,0,0,0.6)' }}>
              <HPBar fighter={fighterA} hp={hp.a} flip={false} />
              <div className="flex flex-col items-center justify-center px-3 gap-0.5">
                <span className="font-display tracking-widest text-white/20" style={{ fontSize: 9 }}>
                  {currentCard?.name?.toUpperCase() ?? modeLabel[loadout?.mode] ?? 'BATTLE'}
                </span>
                <span className="font-display tracking-widest text-white/50" style={{ fontSize: 14 }}>
                  {currentRound ?? '—'} <span className="text-white/20">/</span> {totalRounds}
                </span>
              </div>
              <HPBar fighter={fighterB} hp={hp.b} flip={true} />
            </div>

            <RoundAnnouncer label={announcer?.label} sub={announcer?.sub} visible={!!announcer} />

            {/* Speech bubbles pinned to head anchors */}
            <div className="absolute pointer-events-none" style={{ ...bubbleStyleA, zIndex: 10, maxWidth: 220 }}>
              <SpeechBubble text={bubbleA?.text} side="left" visible={!!bubbleA} pinned />
            </div>
            <div className="absolute pointer-events-none" style={{ ...bubbleStyleB, zIndex: 10, maxWidth: 220 }}>
              <SpeechBubble text={bubbleB?.text} side="right" visible={!!bubbleB} pinned />
            </div>

            {/* Floor line */}
            <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, height: 4, background: '#1e1e2e' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(to right, ${colorA}66, #ffffff22, ${colorB}66)` }} />
            </div>

            {/* Status bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3"
              style={{ height: 40, background: 'rgba(0,0,0,0.8)', borderTop: '1px solid #1e1e2e' }}>
              <div className="flex items-center gap-3 min-w-0">
                {phase === 'corner' && (
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--c-accent)' }}>P1 CORNER</span>
                )}
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
                {rounds.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] font-display tracking-wider">
                    <span style={{ color: colorA }}>{cumScore.a}</span>
                    <span className="text-white/20">-</span>
                    <span style={{ color: colorB }}>{cumScore.b}</span>
                  </div>
                )}
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
                  className="text-sm min-w-[44px] min-h-[44px] flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                >
                  {muted ? '🔇' : '🔊'}
                </button>
                <button
                  onClick={() => dispatch({ type: 'EXIT_TO_SELECT' })}
                  className="text-xs text-white/25 hover:text-white/50 transition-colors tracking-wider min-w-[44px] min-h-[44px] flex items-center justify-end"
                >
                  EXIT
                </button>
              </div>
            </div>
          </div>
        </Letterbox>
      </div>

      {/* Round log */}
      <div ref={logRef} className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3 thin-scroll"
        style={{ background: '#0a0a0f', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {phase === 'corner' && (
          <CornerPlanner
            totalRounds={totalRounds}
            playerName={fighterA?.name}
            onCommit={(cards) => setPlannedCards(cards)}
          />
        )}
        {rounds.length === 0 && phase === 'fighting' && (
          <div className="flex items-center justify-center gap-3 py-12 text-white/25 text-sm">
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            {statusHint}
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
        {phase === 'fighting' && rounds.length > 0 && rounds.length < totalRounds && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-white/25 text-xs py-2 pl-2"
          >
            <motion.div className="w-3 h-3 rounded-full border border-white/20 border-t-white/50"
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
            {statusHint}
          </motion.div>
        )}
      </div>
    </div>
  );
}
