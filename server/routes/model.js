import express from 'express';
import { resolveFighter } from '../../shared/resolveFighter.js';
import { callModel } from '../adapters/index.js';
import { publicProviders } from '../../shared/providers.js';
import { assertSafeFighterEndpoint } from '../lib/safeEndpoint.js';

const router = express.Router();

router.get('/providers', (_req, res) => {
  res.json(publicProviders());
});

export function resolveHealthCheckFighter(spec) {
  const fighter = resolveFighter(spec);
  assertSafeFighterEndpoint(fighter);
  return fighter;
}

/**
 * Health-check the exact same fighter spec accepted by a battle:
 * built-in { id, apiKey } or custom { name, provider, model, apiKey, baseURL }.
 */
router.post('/health-check', async (req, res) => {
  let fighter;
  try {
    fighter = resolveHealthCheckFighter(req.body);
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message });
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
      return res.json({ ok: false, latencyMs, error: 'The provider returned an empty response' });
    }
    return res.json({ ok: true, latencyMs });
  } catch (error) {
    return res.json({
      ok: false,
      latencyMs: Date.now() - start,
      error: 'We could not verify this fighter. Check the key and model, then try again.',
    });
  }
});

export default router;
