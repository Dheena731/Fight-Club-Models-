import { FIGHTERS } from './fighters.js';
import { getProvider, PROVIDERS } from './providers.js';

// A fighter "spec" coming from the client is always an object:
//   Built-in:  { id: 'claude', apiKey: 'sk-ant-...' }
//   Custom:    { name, provider, model, apiKey, baseURL? }
// resolveFighter() normalizes both into a resolved fighter the adapters understand:
//   { id, name, provider, kind, modelId, baseURL, apiKey, color, style, tagline, source }
// The apiKey is carried only for the duration of a request and is NEVER persisted or
// returned to the client (see publicFighter()).
export function resolveFighter(spec) {
  if (!spec || typeof spec !== 'object') throw new Error('Invalid fighter spec — must be an object');

  // Built-in fighter referenced by id (e.g. { id: 'claude', apiKey: '...' })
  if (spec.id && FIGHTERS[spec.id]) {
    const f = FIGHTERS[spec.id];
    const preset = PROVIDERS[f.provider];
    if (!preset?.keyless && !spec.apiKey) {
      throw new Error(`${f.name} needs an API key — add it in the app`);
    }
    return {
      ...f,
      kind: preset?.kind || f.provider,
      baseURL: preset?.baseURL || null,
      apiKey: spec.apiKey || null,
      source: 'builtin',
    };
  }

  // Fully custom BYOK fighter
  const { name, provider, model, apiKey, baseURL, color } = spec;
  if (!provider) throw new Error('Fighter needs a provider');
  if (!model) throw new Error('Fighter needs a model id');

  const preset = getProvider(provider);
  const resolvedBaseURL = baseURL || preset.baseURL || null;
  if (preset.requiresBaseURL && !resolvedBaseURL) {
    throw new Error('This provider needs a baseURL');
  }
  if (!preset.keyless && !apiKey) {
    throw new Error(`${preset.name} needs an API key — add it in the app`);
  }

  return {
    id: spec.id || `byok-${slug(name || model)}`,
    name: name || model,
    provider,
    kind: preset.kind,
    modelId: model,
    baseURL: resolvedBaseURL,
    apiKey: apiKey || null,
    color: color || '#8b8b8b',
    style: spec.style || 'mysterious challenger',
    tagline: spec.tagline || 'Challenger',
    source: 'custom',
  };
}

// Strip the key (and anything else secret) before a fighter is sent to the client or logged.
export function publicFighter(f) {
  if (!f) return f;
  const { apiKey, ...rest } = f;
  return rest;
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'model';
}
