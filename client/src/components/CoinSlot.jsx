import { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KEY_PROVIDERS, FIGHTER_PROVIDER, saveKeys, requiredProvidersFor } from '../lib/keys';
import { healthCheck } from '../lib/api';

/**
 * Coin Slot — the only place we ask for API keys.
 * Shows only providers needed for the selected fighters.
 * Keys stay in application memory and are cleared on page reload or world exit.
 */
export default function CoinSlot({
  open,
  onClose,
  fighters = [],
  keys,
  onChange,
  onReady,
}) {
  const titleId = useId();
  const firstInputRef = useRef(null);
  const [draft, setDraft] = useState(keys);
  const [visible, setVisible] = useState({});
  const [checking, setChecking] = useState(false);
  const [errors, setErrors] = useState({}); // providerId → message

  const selected = fighters.filter(Boolean);
  // Fight commit → only needed providers. Header open with no picks → common providers to pre-load.
  const required = selected.length
    ? requiredProvidersFor(selected, draft)
    : KEY_PROVIDERS.filter((p) => p.id !== 'ollama').slice(0, 3).map((p) => ({
        providerId: p.id,
        label: p.label,
        url: p.url,
        placeholder: p.placeholder,
        fighterNames: p.fighters.length ? p.fighters : ['optional'],
        filled: Boolean(draft[p.id]),
      }));
  const committing = selected.length >= 2;
  const allFilled = !committing || required.every((r) => draft[r.providerId]?.trim() || r.providerId === 'ollama');

  useEffect(() => {
    if (open) {
      setDraft(keys);
      setErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open, keys]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function handleChange(providerId, val) {
    const next = { ...draft, [providerId]: val };
    setDraft(next);
    saveKeys(next);
    onChange(next);
    setErrors((e) => {
      const copy = { ...e };
      delete copy[providerId];
      return copy;
    });
  }

  async function handleInsertCoin() {
    if (!allFilled || checking) return;

    // Pre-loading keys from header — just save and close.
    if (!committing) {
      saveKeys(draft);
      onChange(draft);
      onClose();
      return;
    }

    setChecking(true);
    setErrors({});

    const nextErrors = {};
    const specs = selected.map((f) => {
      if (f._spec) {
        return {
          name: f._spec.name,
          provider: f._spec.provider,
          model: f._spec.model,
          apiKey: f._spec.apiKey || draft[f._spec.provider] || '',
          baseURL: f._spec.baseURL,
        };
      }
      return { id: f.id, apiKey: draft[FIGHTER_PROVIDER[f.id]] || '' };
    });

    const results = await Promise.all(
      specs.map(async (spec) => {
        if (spec.provider === 'ollama') return { ok: true, spec };
        if (spec.id === 'ollama') return { ok: true, spec };
        try {
          const res = await healthCheck(spec);
          return { ok: !!res.ok, error: res.error, spec };
        } catch (err) {
          return { ok: false, error: err.message, spec };
        }
      }),
    );

    for (const r of results) {
      if (r.ok) continue;
      const key = r.spec.id ? (FIGHTER_PROVIDER[r.spec.id] || r.spec.id) : (r.spec.provider || 'unknown');
      nextErrors[key] = r.error || 'Key rejected — check it and try again';
    }

    setChecking(false);

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onReady?.(draft);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ background: 'rgba(0,0,0,0.72)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', maxHeight: '92svh' }}
          >
            <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[11px] tracking-[0.35em]" style={{ color: 'var(--c-accent)' }}>
                    COIN SLOT
                  </p>
                  <h2 id={titleId} className="font-display text-3xl tracking-wider mt-1" style={{ color: 'var(--c-text)' }}>
                    INSERT KEY
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-w-[44px] min-h-[44px] text-sm"
                  style={{ color: 'var(--c-text-3)' }}
                  aria-label="Close coin slot"
                >
                  Close
                </button>
              </div>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--c-text-2)' }}>
                Only the providers for your fighters. Keys pass through our battle proxy in memory
                and are never logged or persisted by the server.
              </p>
            </div>

            <div className="px-5 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: '50svh' }}>
              {required.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>
                  No keys needed for these fighters (local / already configured). Hit INSERT COIN to continue.
                </p>
              ) : (
                required.map((req, i) => (
                  <div key={req.providerId} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor={`coin-${req.providerId}`} className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                        {req.label}
                        <span className="font-normal ml-2 text-xs" style={{ color: 'var(--c-text-3)' }}>
                          for {req.fighterNames.join(' · ')}
                        </span>
                      </label>
                      {req.url && (
                        <a
                          href={req.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] underline py-2"
                          style={{ color: 'var(--c-accent)' }}
                        >
                          Get key ↗
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        ref={i === 0 ? firstInputRef : undefined}
                        id={`coin-${req.providerId}`}
                        type={visible[req.providerId] ? 'text' : 'password'}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={req.placeholder}
                        value={draft[req.providerId] || ''}
                        onChange={(e) => handleChange(req.providerId, e.target.value)}
                        className="w-full outline-none font-mono text-sm"
                        style={{
                          background: 'var(--c-raised)',
                          border: `1px solid ${errors[req.providerId] ? 'var(--c-danger)' : 'var(--c-border)'}`,
                          color: 'var(--c-text)',
                          borderRadius: 10,
                          padding: '12px 72px 12px 14px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setVisible((v) => ({ ...v, [req.providerId]: !v[req.providerId] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-2"
                        style={{ color: 'var(--c-text-3)' }}
                        aria-label={visible[req.providerId] ? 'Hide key' : 'Show key'}
                      >
                        {visible[req.providerId] ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {errors[req.providerId] ? (
                      <p className="text-xs" style={{ color: 'var(--c-danger)' }} role="alert">
                        {errors[req.providerId]}
                      </p>
                    ) : draft[req.providerId] ? (
                      <p className="text-xs" style={{ color: 'var(--c-ok)' }}>
                        Available until you leave the arena or reload
                      </p>
                    ) : null}
                  </div>
                ))
              )}

              <ul className="text-[11px] space-y-1 pt-1" style={{ color: 'var(--c-text-3)' }}>
                <li>· You pay the provider directly at their normal rates.</li>
                <li>- A 3-round fight uses up to 12 calls (2 fighters + 2 blind judges per round).</li>
                <li>- Keys stay in memory only; leaving the arena or reloading clears them. The battle proxy receives them temporarily for authorized calls.</li>
              </ul>
            </div>

            <div className="px-5 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--c-border)' }}>
              <button
                type="button"
                onClick={handleInsertCoin}
                disabled={!allFilled || checking}
                className="w-full py-3.5 rounded-xl font-display text-2xl tracking-[0.2em] outline-none transition-opacity"
                style={
                  allFilled && !checking
                    ? { background: 'linear-gradient(135deg, var(--c-accent) 0%, #E09A14 100%)', color: '#0a0a0f' }
                    : { background: 'var(--c-raised)', color: 'var(--c-text-3)', cursor: 'not-allowed', border: '1px solid var(--c-border)' }
                }
              >
                {checking ? 'CHECKING KEYS…' : committing ? 'INSERT COIN · START FIGHT' : 'CONNECT FOR THIS VISIT'}
              </button>
              <p className="text-center text-[11px]" style={{ color: 'var(--c-text-3)' }}>
                {committing
                  ? 'We ping each provider once before the bell — bad keys never start a fight.'
                  : 'Pick two fighters, then INSERT COIN again to start.'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
