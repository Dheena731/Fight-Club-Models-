import { callModel } from '../adapters/index.js';
import { buildPrompt } from '../../shared/prompts.js';
import { resolveFighter, publicFighter } from '../../shared/resolveFighter.js';
import { sanitizeForNextModel } from './sanitize.js';
import { judgeRound } from '../routes/judge.js';

const START_HP = 100;
const OPENING_LINE = 'The bell rings. Open with your best shot.';

// A "technical KO" turn when a provider errors or refuses, so the match never crashes.
function forfeitTurn(reason) {
  return { text: `*(staggers — couldn't answer)*`, tokensUsed: 0, latencyMs: 0, finishReason: reason };
}

async function safeCall(fighter, system, userMessage, opts) {
  try {
    const res = await callModel(fighter, system, userMessage, opts);
    if (!res.text || res.finishReason === 'refusal') return forfeitTurn('refusal');
    return res;
  } catch (err) {
    return forfeitTurn(`error:${err.message}`);
  }
}

// Map a judge round to HP damage. Loser of the round takes damage scaled by the margin.
function applyDamage(hp, total) {
  const margin = total.a - total.b; // >0 means A won the round
  const dmg = Math.min(40, Math.round(Math.abs(margin) * 2.2) + 6);
  if (margin > 0) hp.b = Math.max(0, hp.b - dmg);
  else if (margin < 0) hp.a = Math.max(0, hp.a - dmg);
  return dmg;
}

/**
 * Run a full battle. onRound (optional) is called after each scored round for streaming.
 * Returns the complete match result.
 */
export async function runBattle({ fighterAId, fighterBId, mode, rounds, topic, onRound } = {}) {
  const a = resolveFighter(fighterAId);
  const b = resolveFighter(fighterBId);
  const maxRounds = Math.min(Number(rounds) || 3, Number(process.env.MAX_ROUNDS) || 5);

  const hp = { a: START_HP, b: START_HP };
  const roundLog = [];
  let lastLine = OPENING_LINE; // what the next fighter is reacting to

  for (let r = 1; r <= maxRounds; r++) {
    // Fighter A strikes (reacting to B's last line, or the opening bell).
    const aTurn = await safeCall(a, buildPrompt(mode, { self: a, opponent: b, round: r, topic }), lastLine);
    const aClean = sanitizeForNextModel(aTurn.text);

    // Fighter B counters A.
    const bTurn = await safeCall(b, buildPrompt(mode, { self: b, opponent: a, round: r, topic }), aClean || lastLine);
    const bClean = sanitizeForNextModel(bTurn.text);

    const score = await judgeRound({ a, b, mode, turnA: aTurn.text, turnB: bTurn.text });
    const damage = applyDamage(hp, score.total);

    const round = {
      round: r,
      a: { text: aTurn.text, latencyMs: aTurn.latencyMs, tokensUsed: aTurn.tokensUsed },
      b: { text: bTurn.text, latencyMs: bTurn.latencyMs, tokensUsed: bTurn.tokensUsed },
      score,
      damage,
      hp: { ...hp },
    };
    roundLog.push(round);
    if (onRound) await onRound(round);

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
