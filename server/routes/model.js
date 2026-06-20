import express from 'express';
import { resolveFighter } from '../../shared/resolveFighter.js';
import { callModel } from '../adapters/index.js';
import { publicProviders } from '../../shared/providers.js';

const router = express.Router();

// List all providers so the UI can render the model picker.
router.get('/providers', (_req, res) => {
  res.json(publicProviders());
});

// Health-check a BYOK model before adding it to the UI inventory.
// Body: { name, provider, model, apiKey, baseURL? }
// Returns: { ok, latencyMs, error? }
router.post('/health-check', async (req, res) => {
  const { name, provider, model, apiKey, baseURL } = req.body || {};

  if (!provider || !model) {
    return res.status(400).json({ ok: false, error: 'provider and model are required' });
  }

  // Build a minimal fighter spec — same shape resolveFighter expects for BYOK.
  const spec = {
    name: name || model,
    provider,
    model,
    apiKey: apiKey || null,
    baseURL: baseURL || null,
  };

  let fighter;
  try {
    fighter = resolveFighter(spec);
  } catch (e) {
    return res.status(400).json({ ok: false, error: e.message });
  }

  const start = Date.now();
  try {
    const result = await callModel(
      fighter,
      'You are a helpful assistant.',
      'Reply with exactly one word: ready',
      { maxTokens: 10 },
    );
    const latencyMs = Date.now() - start;

    if (!result.text) {
      return res.json({ ok: false, latencyMs, error: 'Empty response from model' });
    }
    return res.json({ ok: true, latencyMs });
  } catch (e) {
    return res.json({ ok: false, latencyMs: Date.now() - start, error: e.message });
  }
});

export default router;
