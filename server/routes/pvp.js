import express from 'express';
import rateLimit from 'express-rate-limit';
import { createPvpStore, PvpError } from '../lib/pvp.js';

export function createPvpRouter({ store = createPvpStore(), limits = true } = {}) {
  const router = express.Router();
  const limit = max => rateLimit({ windowMs: 60_000, max, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many Duel Hall requests. Wait a minute, then try again.' } });
  const reads = limits ? limit(180) : (_req, _res, next) => next();
  const writes = limits ? limit(120) : (_req, _res, next) => next();
  const invites = limits ? limit(20) : (_req, _res, next) => next();
  router.use(express.json({ limit: '2kb' }));
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const run = handler => (req, res) => {
    try { handler(req, res); }
    catch (error) {
      res.status(error instanceof PvpError ? error.status : 500).json({ error: error instanceof PvpError ? error.message : 'The Duel Hall could not answer. Try refreshing the room.' });
    }
  };
  const token = req => req.get('authorization')?.replace(/^Bearer /, '');
  router.post('/rooms', invites, run((req, res) => res.status(201).json(store.create(req.body))));
  router.post('/rooms/:code/join', invites, run((req, res) => res.status(201).json(store.join(req.params.code, req.body))));
  router.get('/rooms/:code', reads, run((req, res) => res.json(store.read(req.params.code, token(req)))));
  router.post('/rooms/:code/command', writes, run((req, res) => res.json(store.command(req.params.code, token(req), req.body))));
  router.use((error, _req, res, _next) => res.status(error.status === 413 ? 413 : 400).json({ error: 'Room request could not be read. Refresh and try again with a shorter trainer name.' }));
  return router;
}

export default createPvpRouter();
