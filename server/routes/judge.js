import { claudeAdapter } from '../adapters/claude.js';
import { judgePrompt } from '../../shared/prompts.js';
import { JUDGE } from '../../shared/fighters.js';

// Scores one exchange. Returns { a:{wit,creativity,burns}, b:{...}, rationale, total:{a,b} }.
// Falls back to a neutral score if the judge model returns unparseable output.
export async function judgeRound({ a, b, mode, turnA, turnB }) {
  const system = judgePrompt({ a, b, mode });
  const userMessage = `${a.name} said: "${turnA}"\n\n${b.name} said: "${turnB}"\n\nScore both turns now.`;

  let parsed;
  try {
    const res = await claudeAdapter(system, userMessage, { model: JUDGE.modelId, maxTokens: 300 });
    parsed = JSON.parse(extractJson(res.text));
  } catch {
    parsed = {
      a: { wit: 5, creativity: 5, burns: 5 },
      b: { wit: 5, creativity: 5, burns: 5 },
      rationale: 'The judge was speechless. Even split.',
    };
  }

  const sum = (s) => (s ? (s.wit || 0) + (s.creativity || 0) + (s.burns || 0) : 0);
  return { ...parsed, total: { a: sum(parsed.a), b: sum(parsed.b) } };
}

// Models sometimes wrap JSON in prose/markdown — grab the outermost {...}.
function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no json');
  return text.slice(start, end + 1);
}
