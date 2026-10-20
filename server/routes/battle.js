import express from 'express';
import { runBattle } from '../lib/battle.js';
import { FIGHTERS, MODES } from '../../shared/fighters.js';
import { publicProviders } from '../../shared/providers.js';
import { normalizeCardSequence } from '../../shared/cards.js';

const router = express.Router();

// Roster + modes + providers for the client picker.
router.get('/meta', (_req, res) => {
  res.json({
    fighters: Object.values(FIGHTERS),
    modes: Object.values(MODES),
    providers: publicProviders(),
  });
});

// Fighter spec is always an object from the client:
//   Built-in:  { id: 'claude', apiKey: 'sk-ant-...' }
//   Custom:    { name, provider, model, apiKey, baseURL? }
function isValidSpec(spec) {
  if (!spec || typeof spec !== 'object') return false;
  // built-in reference
  if (spec.id && FIGHTERS[spec.id]) return true;
  // custom BYOK
  return typeof spec.provider === 'string' && typeof spec.model === 'string';
}

function specName(spec) {
  return spec.id || spec.name || spec.model;
}

export function validateBattleRequest(body) {
  const { fighterAId, fighterBId, mode, rounds = 3, cards } = body || {};
  if (!isValidSpec(fighterAId) || !isValidSpec(fighterBId)) return 'Invalid fighter spec';
  if (specName(fighterAId) === specName(fighterBId)) return 'Fighters must be different';
  if (!MODES[mode]) return 'Invalid mode';
  const roundCount = Number(rounds);
  if (!Number.isInteger(roundCount) || roundCount < 1 || roundCount > 5) return 'Rounds must be an integer from 1 to 5';
  try {
    normalizeCardSequence(cards, roundCount);
  } catch (error) {
    return error.message;
  }
  return null;
}

// One-shot full battle.
router.post('/', async (req, res) => {
  const err = validateBattleRequest(req.body);
  if (err) return res.status(400).json({ error: err });
  const controller = new AbortController();
  res.on('close', () => controller.abort());
  try {
    const result = await runBattle({ ...req.body, signal: controller.signal });
    if (!res.destroyed) res.json(result);
  } catch {
    if (!res.destroyed && !controller.signal.aborted) res.status(500).json({ error: 'Battle could not finish. Check your provider connection and try again.' });
  }
});

// Streaming battle (SSE) — turns/rounds arrive live for the animation.
router.post('/stream', async (req, res) => {
  const err = validateBattleRequest(req.body);
  if (err) return res.status(400).json({ error: err });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const controller = new AbortController();
  res.on('close', () => controller.abort());
  const send = (event, data) => {
    if (!res.destroyed && !controller.signal.aborted) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await runBattle({
      ...req.body,
      signal: controller.signal,
      onEvent: (event, data) => send(event, data),
    });
    send('end', result);
  } catch {
    send('error', { error: 'Battle could not finish. Check your provider connection and try again.' });
  } finally {
    if (!res.destroyed) res.end();
  }
});

export default router;
