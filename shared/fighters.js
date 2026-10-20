// Fighter roster + battle mode metadata.
// `modelId` is the value passed to callModel(); keep these in sync with the adapters.
// Documentation reviewed 2026-10-20. Availability still depends on account and
// must be checked by the arena preflight before a paid match.

export const FIGHTERS = {
  claude: {
    id: 'claude',
    name: 'Claude Sonnet 5',
    provider: 'anthropic',
    modelId: 'claude-sonnet-5',
    tagline: 'The thoughtful heavyweight',
    style: 'measured, dry wit, surgical',
    color: '#D97757',
    modelStatus: 'legacy',
    modelSourceUrl: 'https://platform.claude.com/docs/en/models/sonnet-5/overview',
  },
  gpt: {
    id: 'gpt',
    name: 'GPT-4o',
    provider: 'openai',
    modelId: 'gpt-4o',
    tagline: 'The fast-talking showman',
    style: 'quick, punchy, crowd-pleasing',
    color: '#10A37F',
    modelStatus: 'deprecated',
    modelSourceUrl: 'https://developers.openai.com/api/docs/models/gpt-4o',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini 3.6 Flash',
    provider: 'google',
    modelId: 'gemini-3.6-flash',
    tagline: 'The wildcard',
    style: 'unpredictable, encyclopedic, sharp left turns',
    color: '#4285F4',
    modelStatus: 'stable',
    modelSourceUrl: 'https://ai.google.dev/gemini-api/docs/models',
  },
};

// The judge is its own character. Defaults to Claude.
export const JUDGE = {
  name: 'The Commentator',
  modelId: 'claude-sonnet-5',
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
