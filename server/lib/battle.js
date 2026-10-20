import { callModel } from '../adapters/index.js';
import { buildPrompt } from '../../shared/prompts.js';
import { resolveFighter, publicFighter } from '../../shared/resolveFighter.js';
import { sanitizeForNextModel } from './sanitize.js';
import { judgeRound } from '../routes/judge.js';
import { normalizeCardSequence, publicPromptCard } from '../../shared/cards.js';
import { assertSafeFighterEndpoint } from './safeEndpoint.js';

const START_HP = 100;
const OPENING_LINE = 'The bell rings. Open with your best shot.';

// A "technical KO" turn when a provider errors or refuses, so the match never crashes.
function forfeitTurn(reason) {
  return { text: `*(staggers — couldn't answer)*`, tokensUsed: 0, latencyMs: 0, finishReason: reason };
}

async function safeCall(fighter, system, userMessage, opts, modelCall) {
  opts?.signal?.throwIfAborted();
  try {
    const res = await modelCall(fighter, system, userMessage, opts);
    opts?.signal?.throwIfAborted();
    if (!res.text || res.finishReason === 'refusal') return forfeitTurn('refusal');
    return res;
  } catch (err) {
    opts?.signal?.throwIfAborted();
    return forfeitTurn(`error:${err.message}`);
  }
}

// Map a judge round to HP damage. Loser of the round takes damage scaled by the margin.
export function applyDamage(hp, total, card) {
  const margin = total.a - total.b; // >0 means A won the round
  if (margin === 0) return 0;
  const base = Math.round(Math.abs(margin) * 2.2) + 6;
  const dmg = Math.min(60, Math.round(base * (card?.damageMultiplier || 1)));
  if (margin > 0) hp.b = Math.max(0, hp.b - dmg);
  else if (margin < 0) hp.a = Math.max(0, hp.a - dmg);
  return dmg;
}

/**
 * Run a full battle.
 * onEvent(event, data) — streaming beats: 'turn:a' | 'turn:b' | 'verdict'
 * onRound(round) — legacy callback after each scored round (kept for non-stream callers)
 * Returns the complete match result.
 */
export async function runBattle({ fighterAId, fighterBId, mode, rounds, topic, cards, onEvent, onRound, signal, modelCall = callModel, scoreRound = judgeRound } = {}) {
  signal?.throwIfAborted();
  const a = resolveFighter(fighterAId);
  const b = resolveFighter(fighterBId);
  assertSafeFighterEndpoint(a);
  assertSafeFighterEndpoint(b);
  const maxRounds = Math.min(Number(rounds) || 3, Number(process.env.MAX_ROUNDS) || 5);
  const cardSequence = normalizeCardSequence(cards, maxRounds);

  const hp = { a: START_HP, b: START_HP };
  const roundLog = [];
  let lastLine = OPENING_LINE; // what the next fighter is reacting to

  for (let r = 1; r <= maxRounds; r++) {
    signal?.throwIfAborted();
    const card = cardSequence[r - 1];
    // Fighter A strikes (reacting to B's last line, or the opening bell).
    const aTurn = await safeCall(a, buildPrompt(mode, { self: a, opponent: b, round: r, topic, card }), lastLine, { signal }, modelCall);
    const aClean = sanitizeForNextModel(aTurn.text);
    const aPayload = { text: aTurn.text, latencyMs: aTurn.latencyMs, tokensUsed: aTurn.tokensUsed };
    if (onEvent) await onEvent('turn:a', { round: r, a: aPayload, card: publicPromptCard(card) });
    signal?.throwIfAborted();

    // Fighter B counters A.
    const bTurn = await safeCall(b, buildPrompt(mode, { self: b, opponent: a, round: r, topic }), aClean || lastLine, { signal }, modelCall);
    const bClean = sanitizeForNextModel(bTurn.text);
    const bPayload = { text: bTurn.text, latencyMs: bTurn.latencyMs, tokensUsed: bTurn.tokensUsed };
    if (onEvent) await onEvent('turn:b', { round: r, a: aPayload, b: bPayload });
    signal?.throwIfAborted();

    const score = await scoreRound({ a, b, mode, turnA: aTurn.text, turnB: bTurn.text, signal });
    signal?.throwIfAborted();
    const damage = applyDamage(hp, score.total, card);

    const round = {
      round: r,
      a: aPayload,
      b: bPayload,
      score,
      damage,
      card: publicPromptCard(card),
      hp: { ...hp },
    };
    roundLog.push(round);
    if (onEvent) await onEvent('verdict', round);
    if (onRound) await onRound(round);
    signal?.throwIfAborted();

    lastLine = bClean || aClean || lastLine;
    if (hp.a === 0 || hp.b === 0) break; // KO
  }

  const winnerId = hp.a === hp.b ? null : hp.a > hp.b ? a.id : b.id;
  return {
    mode,
    topic: topic || null,
    fighters: { a: publicFighter(a), b: publicFighter(b) },
    rounds: roundLog,
    finalHp: hp,
    winnerId,
    ko: hp.a === 0 || hp.b === 0,
  };
}
