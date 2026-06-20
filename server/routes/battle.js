import express from 'express';
import { runBattle } from '../lib/battle.js';
import { FIGHTERS, MODES } from '../../shared/fighters.js';
import { resolveFighter } from '../../shared/resolveFighter.js';
import { publicProviders } from '../../shared/providers.js';

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

function validate(body) {
  const { fighterAId, fighterBId, mode } = body || {};
  if (!isValidSpec(fighterAId) || !isValidSpec(fighterBId)) return 'Invalid fighter spec';
  if (specName(fighterAId) === specName(fighterBId)) return 'Fighters must be different';
  if (!MODES[mode]) return 'Invalid mode';
  return null;
}

// One-shot full battle.
router.post('/', async (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  try {
    const result = await runBattle(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Streaming battle (SSE) — turns/rounds arrive live for the animation.
router.post('/stream', async (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    const result = await runBattle({ ...req.body, onRound: (round) => send('round', round) });
    send('end', result);
  } catch (e) {
    send('error', { error: e.message });
  } finally {
    res.end();
  }
});

export default router;
