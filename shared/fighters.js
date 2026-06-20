// Fighter roster + battle mode metadata.
// `modelId` is the value passed to callModel(); keep these in sync with the adapters.
// Model IDs verified 2026-06-20 — do not guess; confirm provider GA ids before launch.

export const FIGHTERS = {
  claude: {
    id: 'claude',
    name: 'Claude',
    provider: 'anthropic',
    modelId: 'claude-opus-4-8',
    tagline: 'The thoughtful heavyweight',
    style: 'measured, dry wit, surgical',
    color: '#D97757',
  },
  gpt: {
    id: 'gpt',
    name: 'GPT-4o',
    provider: 'openai',
    modelId: 'gpt-4o',
    tagline: 'The fast-talking showman',
    style: 'quick, punchy, crowd-pleasing',
    color: '#10A37F',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    provider: 'google',
    // TODO: confirm latest GA model id at build time (e.g. gemini-1.5-pro / gemini-2.x).
    modelId: 'gemini-1.5-pro',
    tagline: 'The wildcard',
    style: 'unpredictable, encyclopedic, sharp left turns',
    color: '#4285F4',
  },
};

// The judge is its own character. Defaults to Claude.
export const JUDGE = {
  name: 'The Commentator',
  modelId: 'claude-opus-4-8',
};

export const MODES = {
  roast: { id: 'roast', name: 'Roast Battle', emoji: '🔥' },
  injection: { id: 'injection', name: 'Prompt Injection', emoji: '🧬' },
  impersonation: { id: 'impersonation', name: 'Impersonation', emoji: '🎭' },
};

export function getFighter(id) {
  const f = FIGHTERS[id];
  if (!f) throw new Error(`Unknown fighter: ${id}`);
  return f;
}
