import { claudeAdapter } from './claude.js';
import { openaiAdapter } from './openai.js';
import { geminiAdapter } from './gemini.js';
import { resolveFighter } from '../../shared/resolveFighter.js';

// Unified entry point. `fighter` is a RESOLVED fighter object (see resolveFighter):
//   { kind, modelId, baseURL, apiKey, provider, ... }
// For convenience a raw spec (string id or inline object) is also accepted and resolved here.
// Every adapter returns the same shape: { text, tokensUsed, latencyMs, model, finishReason }.
export async function callModel(fighter, systemPrompt, userMessage, opts = {}) {
  const f = fighter && fighter.kind ? fighter : resolveFighter(fighter);
  const callOpts = {
    model: f.modelId,
    apiKey: f.apiKey || undefined,
    baseURL: f.baseURL || undefined,
    ...opts,
  };

  switch (f.kind) {
    case 'anthropic':
      return claudeAdapter(systemPrompt, userMessage, callOpts);
    case 'gemini':
      return geminiAdapter(systemPrompt, userMessage, callOpts);
    case 'openai':
      // OpenRouter likes an X-Title header for its dashboard; harmless elsewhere.
      if (f.provider === 'openrouter') callOpts.headers = { 'X-Title': 'AI Battle Arena' };
      return openaiAdapter(systemPrompt, userMessage, callOpts);
    default:
      throw new Error(`No adapter for kind: ${f.kind}`);
  }
}

export { claudeAdapter, openaiAdapter, geminiAdapter };
