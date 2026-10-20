const STORAGE_KEY = 'aba:provider-keys';
const SESSION_KEY = 'aba:provider-keys:session';
let activeKeys = {};

// Provider display metadata for the keys panel / coin slot.
export const KEY_PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic',  placeholder: 'sk-ant-...', url: 'https://console.anthropic.com/settings/keys', fighters: ['claude'] },
  { id: 'openai',    label: 'OpenAI',     placeholder: 'sk-...',     url: 'https://platform.openai.com/api-keys',          fighters: ['gpt'] },
  { id: 'google',    label: 'Google',     placeholder: 'AIza...',    url: 'https://aistudio.google.com/app/apikey',        fighters: ['gemini'] },
  { id: 'openrouter',label: 'OpenRouter', placeholder: 'sk-or-...',  url: 'https://openrouter.ai/keys',                   fighters: [] },
  { id: 'groq',      label: 'Groq',       placeholder: 'gsk_...',    url: 'https://console.groq.com/keys',                 fighters: [] },
  { id: 'xai',       label: 'xAI / Grok', placeholder: 'xai-...',   url: 'https://console.x.ai',                          fighters: [] },
  { id: 'together',  label: 'Together',   placeholder: 'tok_...',    url: 'https://api.together.xyz/settings/api-keys',    fighters: [] },
  { id: 'ollama',    label: 'Ollama',     placeholder: '(none — local)', url: 'https://ollama.com',                       fighters: ['ollama'] },
];

// Provider id → which fighters rely on it.
export const FIGHTER_PROVIDER = {
  claude: 'anthropic',
  gpt: 'openai',
  gemini: 'google',
  groq: 'groq',
  ollama: 'ollama',
  openrouter: 'openrouter',
  xai: 'xai',
  together: 'together',
};

export function loadKeys() {
  return { ...activeKeys };
}

export function hasRememberedKeys() {
  return false;
}

export function saveKeys(keys) {
  activeKeys = { ...keys };
}

export function clearKeys() {
  activeKeys = {};
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Storage may be unavailable. */ }
}

export function getKeyForFighter(fighterId, keys) {
  const provider = FIGHTER_PROVIDER[fighterId];
  return provider ? (keys[provider] || '') : '';
}

/** True if this fighter still needs a user-supplied key. */
export function fighterNeedsKey(fighter, keys) {
  if (!fighter) return false;
  if (fighter._spec) {
    if (fighter._spec.provider === 'ollama') return false;
    return !fighter._spec.apiKey;
  }
  const provider = FIGHTER_PROVIDER[fighter.id];
  if (!provider || provider === 'ollama') return false;
  return !keys[provider];
}

/**
 * Providers required for the selected fighters (for Coin Slot).
 * Returns [{ providerId, label, url, placeholder, fighterNames[], filled }]
 */
export function requiredProvidersFor(fighters, keys) {
  const map = new Map();

  for (const f of fighters.filter(Boolean)) {
    if (f._spec) {
      if (f._spec.provider === 'ollama') continue;
      if (f._spec.apiKey) continue; // custom model already carries its key
      const meta = KEY_PROVIDERS.find((p) => p.id === f._spec.provider)
        || { id: f._spec.provider, label: f._spec.provider, placeholder: 'API key…', url: null };
      const entry = map.get(meta.id) || {
        providerId: meta.id,
        label: meta.label,
        url: meta.url,
        placeholder: meta.placeholder,
        fighterNames: [],
        filled: Boolean(keys[meta.id] || f._spec.apiKey),
        custom: true,
      };
      entry.fighterNames.push(f.name);
      map.set(meta.id, entry);
      continue;
    }

    const providerId = FIGHTER_PROVIDER[f.id];
    if (!providerId || providerId === 'ollama') continue;
    const meta = KEY_PROVIDERS.find((p) => p.id === providerId);
    if (!meta) continue;
    const entry = map.get(providerId) || {
      providerId,
      label: meta.label,
      url: meta.url,
      placeholder: meta.placeholder,
      fighterNames: [],
      filled: Boolean(keys[providerId]),
    };
    entry.fighterNames.push(f.name);
    entry.filled = Boolean(keys[providerId]);
    map.set(providerId, entry);
  }

  return [...map.values()];
}

export function allRequiredKeysPresent(fighters, keys) {
  return fighters.filter(Boolean).every((f) => !fighterNeedsKey(f, keys));
}
