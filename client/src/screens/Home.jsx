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

const MODES = [
  { id: 'roast',         name: 'Roast Battle',     short: 'ROAST',  desc: 'Witty burns, no mercy' },
  { id: 'injection',     name: 'Prompt Injection', short: 'INJECT', desc: 'Break the prompt, not the UI' },
  { id: 'impersonation', name: 'Impersonation',    short: 'MIMIC',  desc: 'Parody then out-perform' },
];

const CORNER_A_COLOR = '#EF4444';
const CORNER_B_COLOR = '#3B82F6';

/* ── Fighter Slot ─────────────────────────────────────────── */
function FighterSlot({ side, fighter, active, hasKey, onClick }) {
  const color = fighter?.color ?? (side === 'a' ? CORNER_A_COLOR : CORNER_B_COLOR);
  const cornerColor = side === 'a' ? CORNER_A_COLOR : CORNER_B_COLOR;
  const label = side === 'a' ? 'CORNER A' : 'CORNER B';
  const creature = fighter ? getCreature(fighter.id ?? fighter.provider ?? 'custom') : null;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className="relative w-full rounded-2xl overflow-hidden text-left transition-all duration-200 outline-none"
      style={{
        minHeight: 180,
        background: fighter ? `${color}0A` : 'var(--c-raised)',
        border: `2px solid ${active ? cornerColor : fighter ? `${color}44` : 'var(--c-border)'}`,
        boxShadow: active
          ? `0 0 0 3px ${cornerColor}22, 0 0 12px ${cornerColor}26`
          : fighter ? `0 0 8px ${color}1A` : undefined,
      }}
    >
      {/* corner badge */}
      <div className="absolute top-3 left-3 z-10">
        <span
          className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded"
          style={{ background: `${cornerColor}18`, color: cornerColor, border: `1px solid ${cornerColor}44` }}
        >
          {label}
        </span>
      </div>

      {/* active pulse */}
      {active && (
        <motion.div
          className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full z-10"
          style={{ background: cornerColor }}
          animate={{ opacity: [1, 0.25, 1], scale: [1, 0.8, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      )}

      {fighter ? (
        <div className="flex flex-col items-center pt-8 pb-5 gap-2 px-3">
          <div className="h-24 w-full flex items-end justify-center overflow-hidden">
            <PixelCreature creature={creature} scale={0.95} />
          </div>
          <div className="text-center mt-1">
            <div className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{fighter.name}</div>
            <div className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: 'var(--c-text-3)' }}>{fighter.tagline}</div>
            {!hasKey && (
              <div className="text-[10px] text-amber-500 mt-1.5">key needed</div>
            )}
            {hasKey && (
              <div className="text-[10px] mt-1.5" style={{ color: color }}>ready</div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-44 gap-2" style={{ opacity: 0.5 }}>
          <div className="font-display text-5xl" style={{ color: cornerColor }}>?</div>
          <div className="text-[11px] font-semibold tracking-wider" style={{ color: cornerColor }}>
            {active ? '← SELECT BELOW' : 'TAP TO SELECT'}
          </div>
        </div>
      )}
    </motion.button>
  );
}

/* ── VS Badge ─────────────────────────────────────────────── */
function VSBadge() {
  return (
    <div className="flex items-center justify-center shrink-0 self-center px-1">
      <div
        className="font-display text-2xl tracking-widest w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: 'var(--c-raised)', border: '2px solid var(--c-border)', color: 'var(--c-text-3)' }}
      >
        VS
      </div>
    </div>
  );
}

/* ── Fighter Roster Card ──────────────────────────────────── */
function RosterCard({ fighter, isA, isB, activeSide, hasKey, onClick }) {
  const color = fighter.color ?? '#888';
  const creature = getCreature(fighter.id ?? fighter.provider ?? 'custom');
  const isMine = activeSide === 'a' ? isA : isB;
  const isOther = activeSide === 'a' ? isB : isA;

  return (
    <motion.button
      onClick={() => onClick(fighter)}
      disabled={isOther}
      whileHover={!isOther ? { scale: 1.02 } : {}}
      whileTap={!isOther ? { scale: 0.97 } : {}}
      className="relative min-h-[76px] overflow-hidden rounded-xl p-3 text-left transition-all duration-150 outline-none"
      style={{
        background: isMine ? `${color}12` : 'var(--c-card)',
        border: `1px solid ${isMine ? color : 'var(--c-border)'}`,
        opacity: isOther ? 0.35 : 1,
        boxShadow: isMine ? `0 0 8px ${color}20` : undefined,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 flex items-end justify-center overflow-hidden" style={{ width: 52, height: 52 }}>
          <PixelCreature creature={creature} scale={isMine ? 0.52 : 0.48} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate" style={{ color: isMine ? color : 'var(--c-text)' }}>
            {fighter.name}
          </div>
          <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--c-text-3)' }}>{fighter.tagline}</div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          {isMine && <div className="w-2 h-2 rounded-full" style={{ background: color }} />}
          {!hasKey && !isMine && <span className="text-[10px] text-amber-500">KEY</span>}
        </div>
      </div>
    </motion.button>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */
function missingKey(fighter, keys) {
  if (!fighter) return false;
  if (fighter._spec) return !fighter._spec.apiKey && fighter._spec.provider !== 'ollama';
  return !getKeyForFighter(fighter.id, keys);
}

/* ── Home ─────────────────────────────────────────────────── */
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
  const canStart = selA && selB && selA.id !== selB.id && !missingA && !missingB;

  function getStartLabel() {
    if (!selA || !selB) return 'SELECT TWO FIGHTERS';
    if (missingA) return `ADD ${(selA._spec ? selA.name : FIGHTER_PROVIDER[selA.id] ?? selA.name).toUpperCase()} KEY`;
    if (missingB) return `ADD ${(selB._spec ? selB.name : FIGHTER_PROVIDER[selB.id] ?? selB.name).toUpperCase()} KEY`;
    return `FIGHT - ${selA.name} VS ${selB.name}`;
  }

  function handleStart() {
    if (!canStart) return;
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

      {/* ── HERO HEADER ── */}
      <header className="relative overflow-hidden" style={{ background: 'var(--c-hero-bg)', borderBottom: '1px solid var(--c-border)' }}>
        {/* ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'var(--c-hero-glow)' }} />

        <div className="relative max-w-5xl mx-auto px-6 py-8 flex items-start justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display tracking-widest leading-none"
              style={{ color: 'var(--c-hero-text)', fontSize: 'clamp(2.4rem, 6vw, 5rem)', textShadow: '0 0 28px rgba(217,119,87,0.20)' }}
            >
              AI BATTLE ARENA
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm mt-1.5 tracking-widest uppercase"
              style={{ color: 'var(--c-hero-muted)' }}
            >
              Bring your own keys · Pick your fighters · Watch them roast
            </motion.p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <ThemeToggle />
          </div>
        </div>

      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pb-12 space-y-8 pt-4">

        {serverError && (
          <div className="rounded-xl px-4 py-3 text-sm text-center"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
            {serverError}
          </div>
        )}

        {/* ── API KEYS ── */}
        <KeysPanel keys={keys} onChange={setKeys} />

        {/* ── VS SELECTOR ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display text-lg tracking-wider" style={{ color: 'var(--c-text-3)' }}>
              SELECT FIGHTERS
            </h2>
            {selA && selB && (
              <span className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-accent-bg)' }}>
                both chosen
              </span>
            )}
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
            <FighterSlot
              side="a" fighter={selA} active={activeSide === 'a'}
              hasKey={!missingA} onClick={() => setActiveSide('a')}
            />
            <VSBadge />
            <FighterSlot
              side="b" fighter={selB} active={activeSide === 'b'}
              hasKey={!missingB} onClick={() => setActiveSide('b')}
            />
          </div>
        </section>

        {/* ── FIGHTER ROSTER ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg tracking-wider" style={{ color: 'var(--c-text-3)' }}>ROSTER</span>
              <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>
                — picking for
                <span className="font-bold ml-1" style={{ color: activeSide === 'a' ? CORNER_A_COLOR : CORNER_B_COLOR }}>
                  CORNER {activeSide.toUpperCase()}
                </span>
              </span>
            </div>
            <button
              onClick={() => setShowCustom(v => !v)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: 'var(--c-raised)',
                border: '1px solid var(--c-border)',
                color: 'var(--c-text-2)',
              }}
            >
              {showCustom ? 'Hide custom' : '+ Custom model'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {allFighters.map(f => (
              <RosterCard
                key={f.id}
                fighter={f}
                isA={selA?.id === f.id}
                isB={selB?.id === f.id}
                activeSide={activeSide}
                hasKey={f._spec ? true : !!keys[FIGHTER_PROVIDER[f.id]]}
                onClick={selectFighter}
              />
            ))}
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

        {/* ── BATTLE SETTINGS ── */}
        <section className="rounded-2xl p-4 sm:p-5 space-y-5" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
          <h2 className="font-display text-lg tracking-wider" style={{ color: 'var(--c-text-3)' }}>BATTLE SETTINGS</h2>

          {/* Mode */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--c-text-3)' }}>Mode</label>
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
                >
                  <div className="text-[11px] font-bold tracking-widest mb-1" style={{ color: mode === m.id ? 'var(--c-accent)' : 'var(--c-text-3)' }}>{m.short}</div>
                  <div className="text-xs font-semibold" style={{ color: mode === m.id ? 'var(--c-accent)' : 'var(--c-text)' }}>{m.name}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--c-text-3)' }}>{m.desc}</div>
                  {mode === m.id && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-accent)' }} />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Rounds + Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--c-text-3)' }}>Rounds</label>
              <select
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
                style={{ background: 'var(--c-raised)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                value={rounds}
                onChange={e => setRounds(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'round' : 'rounds'}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--c-text-3)' }}>Topic (optional)</label>
              <input
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  background: 'var(--c-raised)',
                  border: '1px solid var(--c-border)',
                  color: 'var(--c-text)',
                }}
                placeholder="JavaScript, cooking, space…"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ── FIGHT BUTTON ── */}
        <motion.button
          onClick={handleStart}
          disabled={!canStart}
          whileHover={canStart ? { scale: 1.015 } : {}}
          whileTap={canStart ? { scale: 0.975 } : {}}
          className="w-full py-5 rounded-2xl font-display text-3xl tracking-widest transition-all duration-200 outline-none"
          style={canStart ? {
            background: 'linear-gradient(135deg, #D97757 0%, #C45C38 100%)',
            color: '#fff',
            boxShadow: '0 0 32px rgba(217,119,87,0.4)',
          } : {
            background: 'var(--c-raised)',
            color: 'var(--c-text-3)',
            cursor: 'not-allowed',
            border: '1px solid var(--c-border)',
          }}
        >
          {getStartLabel()}
        </motion.button>
      </main>
    </div>
  );
}
