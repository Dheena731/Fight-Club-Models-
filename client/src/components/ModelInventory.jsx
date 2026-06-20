import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { healthCheck } from '../lib/api';

const PROVIDER_META = {
  openrouter: { label: 'OpenRouter', hint: 'Free tier', url: 'https://openrouter.ai/keys' },
  groq:       { label: 'Groq',       hint: 'Free tier', url: 'https://console.groq.com/keys' },
  google:     { label: 'Google',     hint: 'Free quota', url: 'https://aistudio.google.com/app/apikey' },
  anthropic:  { label: 'Anthropic',  hint: 'Paid',       url: 'https://console.anthropic.com/settings/keys' },
  openai:     { label: 'OpenAI',     hint: 'Paid',        url: 'https://platform.openai.com/api-keys' },
  xai:        { label: 'xAI / Grok', hint: 'Paid',        url: 'https://console.x.ai' },
  together:   { label: 'Together',   hint: 'Free tier',  url: 'https://api.together.xyz/settings/api-keys' },
  ollama:     { label: 'Ollama',     hint: 'Local / keyless', url: null },
  custom:     { label: 'Custom',     hint: 'OpenAI-compatible', url: null },
};

const fieldStyle = {
  width: '100%',
  background: 'var(--c-raised)',
  border: '1px solid var(--c-border)',
  color: 'var(--c-text)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
};

function AddModelForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({ name: '', provider: 'openrouter', model: '', apiKey: '', baseURL: '' });
  const [status, setStatus] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const needsKey = form.provider !== 'ollama';
  const needsBase = form.provider === 'custom' || form.provider === 'ollama';

  async function handleCheck() {
    setStatus('checking');
    const result = await healthCheck({
      name: form.name || form.model,
      provider: form.provider,
      model: form.model,
      apiKey: form.apiKey || null,
      baseURL: form.baseURL || null,
    });
    setStatus(result);
    if (result.ok) {
      setTimeout(() => onAdd({
        name: form.name || form.model,
        provider: form.provider, model: form.model,
        apiKey: form.apiKey || null, baseURL: form.baseURL || null,
      }), 700);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--c-raised)', border: '1px solid var(--c-border)' }}
    >
      <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--c-text-3)' }}>Add Custom Model</p>

      <select style={fieldStyle} value={form.provider} onChange={e => set('provider', e.target.value)}>
        {Object.entries(PROVIDER_META).map(([id, m]) => (
          <option key={id} value={id}>{m.label} — {m.hint}</option>
        ))}
      </select>

      <input style={fieldStyle} placeholder="Model ID (e.g. mistralai/mistral-7b-instruct)"
        value={form.model} onChange={e => set('model', e.target.value)} />

      <input style={fieldStyle} placeholder="Display name (optional)"
        value={form.name} onChange={e => set('name', e.target.value)} />

      {needsKey && (
        <input type="password" style={fieldStyle} placeholder="API Key — never stored server-side"
          value={form.apiKey} onChange={e => set('apiKey', e.target.value)} />
      )}

      {needsBase && (
        <input style={fieldStyle}
          placeholder={form.provider === 'ollama' ? 'Base URL (default: http://localhost:11434/v1)' : 'Base URL'}
          value={form.baseURL} onChange={e => set('baseURL', e.target.value)} />
      )}

      {status && status !== 'checking' && (
        <div
          className="text-xs rounded-lg px-3 py-2"
          style={{ background: status.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: status.ok ? '#22C55E' : '#EF4444' }}
        >
          {status.ok ? `✓ Connected in ${status.latencyMs}ms` : `✗ ${status.error}`}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleCheck}
          disabled={!form.model || status === 'checking'}
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)', border: '1px solid var(--c-accent)' }}
        >
          {status === 'checking' ? 'Testing…' : 'Test & Add'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm transition-colors"
          style={{ color: 'var(--c-text-3)' }}
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

export default function ModelInventory({ models, onAdd, onRemove }) {
  const [showForm, setShowForm] = useState(false);

  function handleAdd(spec) { onAdd(spec); setShowForm(false); }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--c-text-3)' }}>Your Models</span>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ color: 'var(--c-text-2)', border: '1px solid var(--c-border)', background: 'var(--c-raised)' }}
          >
            + Add
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && <AddModelForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />}
      </AnimatePresence>

      {models.length === 0 && !showForm && (
        <p className="text-xs italic text-center py-3" style={{ color: 'var(--c-text-3)' }}>
          No custom models. Add any OpenAI-compatible endpoint.
        </p>
      )}

      {models.map((m, i) => (
        <motion.div
          key={m.name + i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{ background: 'var(--c-raised)', border: '1px solid var(--c-border)' }}
        >
          <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: 'var(--c-text)' }}>{m.name}</div>
            <div className="text-[11px] truncate" style={{ color: 'var(--c-text-3)' }}>{m.provider} · {m.model}</div>
          </div>
          <button
            onClick={() => onRemove(i)}
            className="text-xs px-1 transition-colors hover:text-red-400"
            style={{ color: 'var(--c-text-3)' }}
          >
            ✕
          </button>
        </motion.div>
      ))}
    </div>
  );
}
