import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KEY_PROVIDERS, saveKeys } from '../lib/keys';

const inputStyle = {
  background: 'var(--c-raised)',
  border: '1px solid var(--c-border)',
  color: 'var(--c-text)',
  borderRadius: 8,
  padding: '8px 40px 8px 12px',
  width: '100%',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'monospace',
  transition: 'border-color 0.15s',
};

export default function KeysPanel({ keys, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(keys);
  const [visible, setVisible] = useState({});

  function handleChange(id, val) {
    const next = { ...draft, [id]: val };
    setDraft(next);
    saveKeys(next);
    onChange(next);
  }

  const filledCount = KEY_PROVIDERS.filter(p => draft[p.id]).length;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="keys-panel-body"
        className="w-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-5 py-3.5 transition-colors"
        style={{ background: open ? 'var(--c-raised)' : 'var(--c-card)' }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>API Keys</span>
          {/* key dots */}
          <div className="hidden sm:flex gap-1">
            {KEY_PROVIDERS.map(p => (
              <div
                key={p.id}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{ background: draft[p.id] ? '#22C55E' : 'var(--c-border)' }}
                title={`${p.label}: ${draft[p.id] ? 'configured' : 'missing'}`}
              />
            ))}
          </div>
          <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>
            {filledCount} / {KEY_PROVIDERS.length} keys
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
            style={{ background: 'var(--c-raised)', color: 'var(--c-text-3)', border: '1px solid var(--c-border)' }}
          >
            local only
          </span>
          <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            id="keys-panel-body"
            className="overflow-hidden"
            style={{ borderTop: '1px solid var(--c-border)' }}
          >
            <div className="px-5 py-4 space-y-4" style={{ background: 'var(--c-card)' }}>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-3)' }}>
                Keys are saved in browser localStorage and sent directly to the AI provider per-request.
                They are never stored server-side or logged.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {KEY_PROVIDERS.map(p => (
                  <div key={p.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`key-${p.id}`} className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>{p.label}</label>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] underline transition-colors py-2 pl-3 -mr-1"
                          style={{ color: 'var(--c-text-3)' }}
                        >
                          get key ↗
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id={`key-${p.id}`}
                        type={visible[p.id] ? 'text' : 'password'}
                        style={inputStyle}
                        placeholder={p.placeholder}
                        value={draft[p.id] || ''}
                        onChange={e => handleChange(p.id, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setVisible(v => ({ ...v, [p.id]: !v[p.id] }))}
                        aria-label={visible[p.id] ? `Hide ${p.label} key` : `Show ${p.label} key`}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs transition-colors px-1 py-2"
                        style={{ color: 'var(--c-text-3)' }}
                      >
                        {visible[p.id] ? 'hide' : 'show'}
                      </button>
                    </div>
                    {draft[p.id] && (
                      <div className="text-[10px] text-green-500">✓ configured</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
