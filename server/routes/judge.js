import { callModel } from '../adapters/index.js';
import { judgePrompt } from '../../shared/prompts.js';

const AXES = ['wit', 'creativity', 'burns'];

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 5;
  return Math.max(1, Math.min(10, Math.round(number)));
}

function normalizeFighterScore(score = {}) {
  return Object.fromEntries(AXES.map((axis) => [axis, clampScore(score[axis])]));
}

export function extractJudgeJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Judge returned no JSON');
  return text.slice(start, end + 1);
}

export function parseJudgeText(text) {
  const parsed = JSON.parse(extractJudgeJson(text));
  return {
    a: normalizeFighterScore(parsed.a),
    b: normalizeFighterScore(parsed.b),
    rationale: String(parsed.rationale || 'No commentary supplied.').slice(0, 320),
  };
}

function mergeDecisions(decisions) {
  const average = (side, axis) => Math.round(
    decisions.reduce((sum, decision) => sum + decision[side][axis], 0) / decisions.length,
  );

  const a = Object.fromEntries(AXES.map((axis) => [axis, average('a', axis)]));
  const b = Object.fromEntries(AXES.map((axis) => [axis, average('b', axis)]));
  const sum = (score) => AXES.reduce((total, axis) => total + score[axis], 0);
  const commentary = decisions.map((decision) => decision.rationale).filter(Boolean);

  return {
    a,
    b,
    rationale: decisions.length > 1
      ? `Split decision. ${commentary.join(' / ')}`.slice(0, 420)
      : commentary[0],
    total: { a: sum(a), b: sum(b) },
    judges: decisions.length,
  };
}

/**
 * Both fighters judge anonymized corners in parallel. Self-bias is symmetric,
 * no third API key is required, and one judge may fail without forcing a draw.
 */
export async function judgeRound({ a, b, mode, turnA, turnB, signal, judgeCall = callModel }) {
  signal?.throwIfAborted();
  const red = { name: 'Red Corner' };
  const blue = { name: 'Blue Corner' };
  const system = judgePrompt({ a: red, b: blue, mode });
  const userMessage = `RED CORNER said: "${turnA}"\n\nBLUE CORNER said: "${turnB}"\n\nScore both turns now.`;

  const settled = await Promise.allSettled(
    [a, b].map(async (judge) => {
      const result = await judgeCall(judge, system, userMessage, { maxTokens: 300, signal });
      return parseJudgeText(result.text);
    }),
  );
  const decisions = settled
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
  signal?.throwIfAborted();

  if (!decisions.length) {
    const reasons = settled
      .map((result) => result.status === 'rejected' ? result.reason?.message : null)
      .filter(Boolean)
      .join('; ');
    throw new Error(`Judges unavailable${reasons ? `: ${reasons}` : ''}`);
  }

  return mergeDecisions(decisions);
}
