import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PROMPT_CARD_LIST } from '../../../../shared/cards.js';

const RISK_LABEL = {
  safe: 'LOW RISK',
  tactical: 'SETUP',
  volatile: 'HIGH RISK',
};

export default function CornerPlanner({ totalRounds = 3, playerName = 'P1', onCommit }) {
  const count = Math.max(1, Number(totalRounds) || 3);
  const [slots, setSlots] = useState(() => Array(count).fill(null));
  const [activeRound, setActiveRound] = useState(0);
  const ready = useMemo(() => slots.every(Boolean), [slots]);

  function choose(card) {
    setSlots((current) => {
      const next = [...current];
      next[activeRound] = card;
      const nextEmpty = next.findIndex((slot, index) => index > activeRound && !slot);
      if (nextEmpty >= 0) setActiveRound(nextEmpty);
      return next;
    });
  }

  function commit() {
    if (!ready) return;
    onCommit(slots.map((card) => card.id));
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-5xl rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--c-border)', background: 'var(--c-card)' }}
      aria-labelledby="corner-title"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-4 sm:px-6 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div>
          <p className="font-display text-[10px] tracking-[0.35em]" style={{ color: 'var(--c-accent)' }}>P1 CORNER</p>
          <h2 id="corner-title" className="font-display text-2xl sm:text-3xl tracking-wider mt-1" style={{ color: 'var(--c-text)' }}>
            CALL THE FIGHT
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--c-text-2)' }}>
            Coach {playerName}. Pick one prompt tactic for every round.
          </p>
        </div>
        <div className="flex gap-2" aria-label="Round plan">
          {slots.map((card, index) => (
            <button
              type="button"
              key={index}
              onClick={() => setActiveRound(index)}
              className="min-w-[52px] min-h-[44px] rounded-lg font-display text-xs tracking-wider"
              style={{
                color: activeRound === index ? '#0a0a0f' : 'var(--c-text-2)',
                background: activeRound === index ? 'var(--c-accent)' : 'var(--c-raised)',
                border: '1px solid var(--c-border)',
              }}
              aria-label={`Round ${index + 1}: ${card?.name ?? 'not planned'}`}
              aria-pressed={activeRound === index}
            >
              R{index + 1}
              <span className="block mt-0.5 text-[9px] truncate max-w-[46px]">{card?.label ?? 'OPEN'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 p-4 sm:p-6">
        {PROMPT_CARD_LIST.map((card) => {
          const selected = slots[activeRound]?.id === card.id;
          return (
            <button
              type="button"
              key={card.id}
              onClick={() => choose(card)}
              aria-pressed={selected}
              className="text-left rounded-xl p-4 min-h-[148px] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              style={{
                background: selected ? 'rgba(255, 182, 39, 0.12)' : 'var(--c-raised)',
                border: selected ? '1px solid var(--c-accent)' : '1px solid var(--c-border)',
              }}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-xl tracking-wider" style={{ color: 'var(--c-text)' }}>{card.name.toUpperCase()}</span>
                <span className="text-[9px] tracking-[0.18em]" style={{ color: card.risk === 'volatile' ? 'var(--c-danger)' : 'var(--c-accent)' }}>
                  {RISK_LABEL[card.risk]}
                </span>
              </span>
              <span className="block text-[10px] tracking-[0.25em] mt-2" style={{ color: 'var(--c-text-3)' }}>{card.label}</span>
              <span className="block text-sm leading-relaxed mt-3" style={{ color: 'var(--c-text-2)' }}>{card.description}</span>
            </button>
          );
        })}
      </div>

      <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" style={{ borderTop: '1px solid var(--c-border)' }}>
        <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>
          {ready ? 'Plan locked. Your cards modify P1 prompts server-side.' : `Choose a card for round ${activeRound + 1}.`}
        </p>
        <button
          type="button"
          onClick={commit}
          disabled={!ready}
          className="min-h-[48px] px-7 rounded-xl font-display text-xl tracking-[0.2em]"
          style={ready
            ? { background: 'var(--c-accent)', color: '#0a0a0f' }
            : { background: 'var(--c-raised)', color: 'var(--c-text-3)', border: '1px solid var(--c-border)', cursor: 'not-allowed' }}
        >
          RING THE BELL
        </button>
      </div>
    </motion.section>
  );
}
