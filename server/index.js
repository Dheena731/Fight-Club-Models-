import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import battleRouter from './routes/battle.js';
import modelRouter from './routes/model.js';

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Cost / abuse guardrail: cap battles per IP.
const limiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });
app.use('/api', limiter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/battle', battleRouter);
app.use('/api/model', modelRouter);

app.listen(PORT, () => {
  console.log(`🥊 AI Battle Arena server on http://localhost:${PORT}`);
});
