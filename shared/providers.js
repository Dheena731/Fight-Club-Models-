// Provider registry. `kind` maps a provider to an adapter:
//   anthropic -> claude.js | gemini -> gemini.js | openai -> openai.js (OpenAI-compatible)
// Almost everything (OpenRouter, Groq, xAI/Grok, Together, Ollama, custom) speaks the
// OpenAI Chat Completions API, so one adapter + a baseURL covers them all.
//
// `sampleModels` are illustrative starting points only — model IDs change constantly and
// the UI health-checks any model before adding it, so these are just hints, not a contract.

export const PROVIDERS = {
  anthropic: {
    id: 'anthropic', name: 'Anthropic (Claude)', kind: 'anthropic',
    free: false, baseURL: null, keysUrl: 'https://console.anthropic.com/settings/keys',
    sampleModels: ['claude-opus-4-8', 'claude-haiku-4-5'],
  },
  openai: {
    id: 'openai', name: 'OpenAI', kind: 'openai',
    free: false, baseURL: null, keysUrl: 'https://platform.openai.com/api-keys',
    sampleModels: ['gpt-4o', 'gpt-4o-mini'],
  },
  google: {
    id: 'google', name: 'Google (Gemini)', kind: 'gemini',
    free: true, baseURL: null, keysUrl: 'https://aistudio.google.com/apikey',
    note: 'Generous free tier via AI Studio',
    sampleModels: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  openrouter: {
    id: 'openrouter', name: 'OpenRouter', kind: 'openai',
    free: true, baseURL: 'https://openrouter.ai/api/v1', keysUrl: 'https://openrouter.ai/keys',
    note: 'Hundreds of models incl. many free `:free` variants',
    sampleModels: ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat:free'],
  },
  groq: {
    id: 'groq', name: 'Groq', kind: 'openai',
    free: true, baseURL: 'https://api.groq.com/openai/v1', keysUrl: 'https://console.groq.com/keys',
    note: 'Very fast, generous free tier',
    sampleModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  },
  xai: {
    id: 'xai', name: 'xAI (Grok)', kind: 'openai',
    free: false, baseURL: 'https://api.x.ai/v1', keysUrl: 'https://console.x.ai',
    sampleModels: ['grok-2-latest', 'grok-beta'],
  },
  together: {
    id: 'together', name: 'Together AI', kind: 'openai',
    free: true, baseURL: 'https://api.together.xyz/v1', keysUrl: 'https://api.together.ai/settings/api-keys',
    note: 'Some free models + free credits',
    sampleModels: ['meta-llama/Llama-3.3-70B-Instruct-Turbo-Free'],
  },
  ollama: {
    id: 'ollama', name: 'Ollama (local)', kind: 'openai',
    free: true, baseURL: 'http://localhost:11434/v1', keysUrl: null, keyless: true,
    note: 'Run open models locally — no key needed',
    sampleModels: ['llama3.2', 'qwen2.5'],
  },
  custom: {
    id: 'custom', name: 'Custom (OpenAI-compatible)', kind: 'openai',
    free: null, baseURL: null, keysUrl: null, requiresBaseURL: true,
    note: 'Any endpoint that speaks the OpenAI Chat Completions API',
    sampleModels: [],
  },
};

export function getProvider(id) {
  const p = PROVIDERS[id];
  if (!p) throw new Error(`Unknown provider: ${id}`);
  return p;
}

// Strip nothing sensitive here (presets hold no secrets) — safe to send to the client.
export function publicProviders() {
  return Object.values(PROVIDERS);
}
