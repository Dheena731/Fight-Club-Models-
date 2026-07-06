import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getMeta } from '../lib/api';
import { loadKeys, getKeyForFighter, FIGHTER_PROVIDER } from '../lib/keys';
import { fighterColor } from '../lib/colors';
import { getCreature } from '../components/creatures/pixelData';
import PixelCreature from '../components/creatures/PixelCreature';
import ModelInventory from '../components/ModelInventory';
import KeysPanel from '../components/KeysPanel';
import ThemeToggle from '../components/ThemeToggle';
import * as sfx from '../lib/sfx';

const MODES = [
  { id: 'roast',         name: 'Roast Battle',     short: 'ROAST',  desc: 'Witty burns, no mercy' },
  { id: 'injection',     name: 'Prompt Injection', short: 'INJECT', desc: 'Break the prompt, not the UI' },
  { id: 'impersonation', name: 'Impersonation',    short: 'MIMIC',  desc: 'Parody then out-perform' },
];

const CORNER_A_COLOR = '#EF4444';
const CORNER_B_COLOR = '#3B82F6';

/* ── Playful tale-of-the-tape stats, deterministic per fighter ── */
function statsFor(id) {
  let h = 2166136261;
  for (const c of String(id)) h = ((h ^ c.charCodeAt(0)) * 16777619) >>> 0;
  const pick = (n) => 5 + ((h >> (n * 5)) % 6); // 5..10
  return [
    ['POW', pick(0)],
    ['WIT', pick(1)],
    ['SPD', pick(2)],
  ];
}

function StatBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      <span className="font-display text-[11px] tracking-widest w-8 shrink-0" style={{ color: 'var(--c-text-3)' }}>
        {label}
      </span>
      <div className="flex gap-[3px] flex-1" role="img" aria-label={`${label} ${value} of 10`}>
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="h-[7px] flex-1 rounded-[1px]"
            style={{ background: i < value ? color : 'var(--c-border-2)', opacity: i < value ? 1 : 0.5 }}
          />
        ))}
      </div>
      <span className="font-display text-[11px] w-4 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

/* ── Stage side: one fighter on the select-screen stage ──────── */
function StageSide({ side, fighter, active, hasKey, onClick }) {
  const cornerColor = side === 'a' ? CORNER_A_COLOR : CORNER_B_COLOR;
  const color = fighter?.color ?? cornerColor;
  const creature = fighter ? getCreature(fighter.id ?? fighter.provider ?? 'custom') : null;
  const playerTag = side === 'a' ? 'P1' : 'P2';
  const flip = side === 'b';

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-0 outline-none w-full group"
      aria-label={`${playerTag} — ${fighter ? fighter.name : 'empty slot'}${active ? ' (selecting)' : ''}`}
    >
      {/* player tag */}
      <div className="absolute top-0 z-10" style={{ [flip ? 'right' : 'left']: 8 }}>
        <span
          className="font-display text-sm tracking-widest px-2 py-0.5 rounded-sm"
          style={{ background: cornerColor, color: '#0a0a0f' }}
        >
          {playerTag}
        </span>
        {active && (
          <motion.span
            className="ml-1.5 inline-block align-middle w-2 h-2 rounded-full"
            style={{ background: cornerColor }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        )}
      </div>

      {/* the fighter on the platform */}
      <div className="home-creature h-36 sm:h-44 flex items-end justify-center w-full pt-6">
        {fighter ? (
          <motion.div
            key={fighter.id}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
            className="drop-shadow-[0_0_18px_rgba(0,0,0,0.6)]"
          >
            <PixelCreature creature={creature} scale={1.15} brightness={hasKey ? 1 : 0.55} />
          </motion.div>
        ) : (
          <motion.div
            className="font-display text-7xl leading-none pb-2 select-none"
            style={{ color: cornerColor, opacity: 0.5 }}
            animate={active ? { opacity: [0.5, 0.9, 0.5] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
            aria-hidden="true"
          >
            ?
          </motion.div>
        )}
      </div>

      {/* platform */}
      <div
        className="h-3 w-4/5 rounded-[50%]"
        style={{
          background: `radial-gradient(ellipse at center, ${fighter ? color : cornerColor}55 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* nameplate */}
      <div className="mt-2 w-full max-w-[240px] text-center">
        <div
          className="font-display text-2xl tracking-wider truncate px-2"
          style={{ color: fighter ? color : 'var(--c-text-3)' }}
        >
          {fighter ? fighter.name.toUpperCase() : active ? 'PICK FROM ROSTER' : 'TAP TO SELECT'}
        </div>
        {fighter && (
          <>
            <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--c-text-3)' }}>
              {fighter.tagline}
            </div>
            <div className="flex flex-col gap-1 mt-2 px-1">
              {statsFor(fighter.id).map(([label, value]) => (
                <StatBar key={label} label={label} value={value} color={color} />
              ))}
            </div>
            <div
              className="font-display text-[12px] tracking-[0.25em] mt-2"
              style={{ color: hasKey ? '#22C55E' : '#F59E0B' }}
            >
              {hasKey ? '● READY' : '⚠ INSERT KEY'}
            </div>
          </>
        )}
      </div>
    </button>
  );
}

/* ── Roster tile — the character-select grid cell ────────────── */
function RosterTile({ fighter, isA, isB, activeSide, hasKey, onClick }) {
  const creature = getCreature(fighter.id ?? fighter.provider ?? 'custom');
  const isOther = activeSide === 'a' ? isB : isA;
  const picked = isA || isB;
  const pickColor = isA ? CORNER_A_COLOR : CORNER_B_COLOR;

  return (
    <motion.button
      onClick={() => onClick(fighter)}
      disabled={isOther}
      whileHover={!isOther ? { y: -4 } : {}}
      whileTap={!isOther ? { scale: 0.95 } : {}}
      className="relative rounded-xl overflow-hidden text-center outline-none transition-all duration-150"
      style={{
        background: 'var(--c-card)',
        border: `2px solid ${picked ? pickColor : 'var(--c-border)'}`,
        opacity: isOther ? 0.35 : 1,
        boxShadow: picked ? `0 0 14px ${pickColor}44` : undefined,
      }}
      aria-pressed={picked}
      aria-label={`${fighter.name}${picked ? ` — corner ${isA ? 'A' : 'B'}` : ''}${!hasKey ? ' (key needed)' : ''}`}
    >
      {picked && (
        <span
          className="absolute top-1.5 left-1.5 z-10 font-display text-[11px] tracking-widest px-1.5 py-0.5 rounded-sm"
          style={{ background: pickColor, color: '#0a0a0f' }}
        >
          {isA ? 'P1' : 'P2'}
        </span>
      )}
      {!hasKey && (
        <span className="absolute top-1.5 right-1.5 z-10 text-[10px] font-bold text-amber-500" title="API key needed">
          🔒
        </span>
      )}
      <div className="h-20 flex items-end justify-center pt-2 overflow-hidden">
        <PixelCreature creature={creature} scale={0.62} brightness={isOther ? 0.6 : 1} />
      </div>
      <div
        className="font-display text-sm tracking-wider truncate px-2 py-1.5 mt-1"
        style={{
          color: picked ? pickColor : 'var(--c-text)',
          background: 'var(--c-raised)',
          borderTop: '1px solid var(--c-border)',
        }}
      >
        {fighter.name.toUpperCase()}
      </div>
    </motion.button>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */
function missingKey(fighter, keys) {
  if (!fighter) return false;
  if (fighter._spec) return !fighter._spec.apiKey && fighter._spec.provider !== 'ollama';
  return !getKeyForFighter(fighter.id, keys);
}

/* ── Home — the character-select screen ──────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const [fighters, setFighters] = useState([]);
  const [mode, setMode] = useState('roast');
  const [rounds, setRounds] = useState(3);
  const [topic, setTopic] = useState('');
  const [selA, setSelA] = useState(null);
  const [selB, setSelB] = useState(null);
  const [activeSide, setActiveSide] = useState('a');
  const [customModels, setCustomModels] = useState([]);
  const [keys, setKeys] = useState(loadKeys);
  const [serverError, setServerError] = useState(null);
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    getMeta()
      .then(d => setFighters(d.fighters))
      .catch(() => setServerError('Could not reach the server. Is the API running?'));
  }, []);

  const allFighters = [
    ...fighters,
    ...customModels.map(m => ({
      id: m.name, name: m.name, tagline: `${m.provider} · ${m.model}`,
      color: '#8B5CF6', _spec: m,
    })),
  ];

  function selectFighter(fighter) {
    sfx.punch();
    if (activeSide === 'a') {
      if (fighter.id === selA?.id) { setSelA(null); return; }
      setSelA(fighter);
      if (!selB && fighter.id !== selB?.id) setActiveSide('b');
    } else {
      if (fighter.id === selB?.id) { setSelB(null); return; }
      setSelB(fighter);
    }
  }

  function buildSpec(f) {
    if (!f) return null;
    if (f._spec) return { name: f._spec.name, provider: f._spec.provider, model: f._spec.model, apiKey: f._spec.apiKey, baseURL: f._spec.baseURL };
    return { id: f.id, apiKey: getKeyForFighter(f.id, keys) };
  }

  const missingA = missingKey(selA, keys);
  const missingB = missingKey(selB, keys);
  const bothChosen = selA && selB && selA.id !== selB.id;
  const canStart = bothChosen && !missingA && !missingB;

  function getStartLabel() {
    if (!selA || !selB) return 'SELECT TWO FIGHTERS';
    if (missingA) return `ADD ${(selA._spec ? selA.name : FIGHTER_PROVIDER[selA.id] ?? selA.name).toUpperCase()} KEY`;
    if (missingB) return `ADD ${(selB._spec ? selB.name : FIGHTER_PROVIDER[selB.id] ?? selB.name).toUpperCase()} KEY`;
    return `FIGHT!`;
  }

  function handleStart() {
    if (!canStart) return;
    sfx.bell();
    navigate('/battle', {
      state: {
        fighterAId: buildSpec(selA),
        fighterBId: buildSpec(selB),
        mode, rounds,
        topic: topic.trim() || undefined,
        fighters: {
          a: { id: selA.id, name: selA.name, tagline: selA.tagline, color: selA.color || fighterColor(selA.id) },
          b: { id: selB.id, name: selB.name, tagline: selB.tagline, color: selB.color || fighterColor(selB.id) },
        },
      },
    });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-bg)' }}>

      {/* ── MARQUEE HEADER ── */}
      <header className="relative overflow-hidden" style={{ background: 'var(--c-hero-bg)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--c-hero-glow)' }} />
        <div className="relative max-w-5xl mx-auto px-6 pt-6 pb-5 flex items-start justify-between gap-4">
          <div className="text-center flex-1">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="insert-coin font-display text-[13px] tracking-[0.4em]"
              style={{ color: 'var(--c-accent)' }}
            >
              INSERT COIN · FREE PLAY
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display tracking-widest leading-none mt-1"
              style={{ color: 'var(--c-hero-text)', fontSize: 'clamp(2.2rem, 5.5vw, 4.2rem)', textShadow: '0 0 28px rgba(217,119,87,0.20)' }}
            >
              CHOOSE YOUR FIGHTER
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-[11px] mt-1.5 tracking-[0.3em] uppercase"
              style={{ color: 'var(--c-hero-muted)' }}
            >
              AI Battle Arena · Bring your own keys · Watch them roast
            </motion.p>
          </div>
          <div className="shrink-0 mt-1 absolute right-6 top-6">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pb-12 space-y-7 pt-5">

        {serverError && (
          <div className="rounded-xl px-4 py-3 text-sm text-center"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
            {serverError}
          </div>
        )}

        {/* ── THE STAGE ── */}
        <section
          className="arena-dark stage-floor scanlines relative rounded-2xl overflow-hidden px-3 sm:px-8 pt-4 pb-6"
          style={{ border: '1px solid var(--c-border)' }}
          aria-label="Selected fighters"
        >
          <div className="grid items-end gap-2" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
            <StageSide side="a" fighter={selA} active={activeSide === 'a'} hasKey={!missingA} onClick={() => setActiveSide('a')} />

            {/* VS emblem */}
            <div className="flex flex-col items-center self-center pb-10 px-1 sm:px-3">
              <motion.div
                className="font-display leading-none select-none"
                style={{
                  fontSize: 'clamp(2.2rem, 6vw, 3.8rem)',
                  color: '#EF4444',
                  textShadow: '0 0 30px rgba(239,68,68,0.5)',
                }}
                animate={bothChosen ? { scale: [1, 1.12, 1] } : {}}
                transition={{ duration: 0.9, repeat: Infinity }}
                aria-hidden="true"
              >
                VS
              </motion.div>
              {bothChosen && (
                <div className="insert-coin font-display text-[11px] tracking-[0.3em] mt-1" style={{ color: '#22C55E' }}>
                  READY?
                </div>
              )}
            </div>

            <StageSide side="b" fighter={selB} active={activeSide === 'b'} hasKey={!missingB} onClick={() => setActiveSide('b')} />
          </div>
        </section>

        {/* ── ROSTER GRID ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg tracking-wider" style={{ color: 'var(--c-text-3)' }}>ROSTER</span>
              <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>
                picking for
                <span className="font-bold ml-1 font-display tracking-widest" style={{ color: activeSide === 'a' ? CORNER_A_COLOR : CORNER_B_COLOR }}>
                  {activeSide === 'a' ? 'P1' : 'P2'}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {allFighters.map(f => (
              <RosterTile
                key={f.id}
                fighter={f}
                isA={selA?.id === f.id}
                isB={selB?.id === f.id}
                activeSide={activeSide}
                hasKey={f._spec ? true : !!keys[FIGHTER_PROVIDER[f.id]]}
                onClick={selectFighter}
              />
            ))}

            {/* "+" tile — add a custom challenger */}
            <motion.button
              onClick={() => setShowCustom(v => !v)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl outline-none flex flex-col items-center justify-center gap-1 min-h-[124px] transition-colors"
              style={{
                background: 'transparent',
                border: `2px dashed ${showCustom ? '#8B5CF6' : 'var(--c-border-2)'}`,
                color: showCustom ? '#8B5CF6' : 'var(--c-text-3)',
              }}
              aria-expanded={showCustom}
            >
              <span className="font-display text-4xl leading-none">+</span>
              <span className="font-display text-xs tracking-[0.25em]">CUSTOM</span>
            </motion.button>
          </div>

          <AnimatePresence>
            {showCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="rounded-2xl p-4" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
                  <ModelInventory
                    models={customModels}
                    onAdd={m => setCustomModels(ms => [...ms, m])}
                    onRemove={i => setCustomModels(ms => ms.filter((_, idx) => idx !== i))}
                    onSelect={() => {}}
                    selectedId={null}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── FIGHT CARD (mode / rounds / topic) ── */}
        <section className="rounded-2xl p-4 sm:p-5 space-y-5" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
          <h2 className="font-display text-lg tracking-wider" style={{ color: 'var(--c-text-3)' }}>TONIGHT&rsquo;S CARD</h2>

          {/* Mode */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {MODES.map(m => (
                <motion.button
                  key={m.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMode(m.id)}
                  className="relative rounded-xl border p-3 text-left transition-all duration-150 outline-none"
                  style={{
                    background: mode === m.id ? 'var(--c-accent-bg)' : 'var(--c-raised)',
                    borderColor: mode === m.id ? 'var(--c-accent)' : 'var(--c-border)',
                    boxShadow: mode === m.id ? '0 0 8px var(--c-accent-glow)' : undefined,
                  }}
                  aria-pressed={mode === m.id}
                >
                  <div className="font-display text-base tracking-widest" style={{ color: mode === m.id ? 'var(--c-accent)' : 'var(--c-text-2)' }}>
                    {m.short}
                  </div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: mode === m.id ? 'var(--c-accent)' : 'var(--c-text)' }}>{m.name}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--c-text-3)' }}>{m.desc}</div>
                  {mode === m.id && (
                    <div className="absolute top-2 right-2 font-display text-[10px] tracking-widest" style={{ color: 'var(--c-accent)' }}>
                      MAIN EVENT
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Rounds + Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--c-text-3)' }}>Rounds</label>
              <div className="flex gap-1.5" role="radiogroup" aria-label="Number of rounds">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setRounds(n)}
                    role="radio"
                    aria-checked={rounds === n}
                    className="flex-1 py-2.5 rounded-lg font-display text-lg tracking-wider outline-none transition-all duration-150"
                    style={{
                      background: rounds === n ? 'var(--c-accent-bg)' : 'var(--c-raised)',
                      border: `1px solid ${rounds === n ? 'var(--c-accent)' : 'var(--c-border)'}`,
                      color: rounds === n ? 'var(--c-accent)' : 'var(--c-text-2)',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--c-text-3)' }}>Topic (optional)</label>
              <input
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
                style={{ background: 'var(--c-raised)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                placeholder="JavaScript, cooking, space…"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ── API KEYS (the coin slot) ── */}
        <KeysPanel keys={keys} onChange={setKeys} />

        {/* ── FIGHT BUTTON ── */}
        <motion.button
          onClick={handleStart}
          disabled={!canStart}
          whileHover={canStart ? { scale: 1.015 } : {}}
          whileTap={canStart ? { scale: 0.975 } : {}}
          animate={canStart ? {
            boxShadow: [
              '0 0 24px rgba(217,119,87,0.35)',
              '0 0 48px rgba(217,119,87,0.6)',
              '0 0 24px rgba(217,119,87,0.35)',
            ],
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full py-5 rounded-2xl font-display text-4xl tracking-[0.2em] transition-all duration-200 outline-none"
          style={canStart ? {
            background: 'linear-gradient(135deg, #D97757 0%, #C45C38 100%)',
            color: '#fff',
          } : {
            background: 'var(--c-raised)',
            color: 'var(--c-text-3)',
            cursor: 'not-allowed',
            border: '1px solid var(--c-border)',
          }}
        >
          {getStartLabel()}
        </motion.button>
        {bothChosen && canStart && (
          <p className="text-center text-xs -mt-4 pt-1 font-display tracking-[0.3em]" style={{ color: 'var(--c-text-3)' }}>
            {selA.name.toUpperCase()} VS {selB.name.toUpperCase()} · {rounds} {rounds === 1 ? 'ROUND' : 'ROUNDS'} · {MODES.find(m => m.id === mode)?.short}
          </p>
        )}
      </main>
    </div>
  );
}
