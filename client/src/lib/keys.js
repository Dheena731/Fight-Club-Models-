const STORAGE_KEY = 'aba:provider-keys';

// Provider display metadata for the keys panel.
export const KEY_PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic',  placeholder: 'sk-ant-...', url: 'https://console.anthropic.com/settings/keys', fighters: ['claude'] },
  { id: 'openai',    label: 'OpenAI',     placeholder: 'sk-...',     url: 'https://platform.openai.com/api-keys',          fighters: ['gpt'] },
  { id: 'google',    label: 'Google',     placeholder: 'AIza...',    url: 'https://aistudio.google.com/app/apikey',        fighters: ['gemini'] },
  { id: 'openrouter',label: 'OpenRouter', placeholder: 'sk-or-...',  url: 'https://openrouter.ai/keys',                   fighters: [] },
  { id: 'groq',      label: 'Groq',       placeholder: 'gsk_...',    url: 'https://console.groq.com/keys',                 fighters: [] },
  { id: 'xai',       label: 'xAI / Grok', placeholder: 'xai-...',   url: 'https://console.x.ai',                          fighters: [] },
  { id: 'together',  label: 'Together',   placeholder: 'tok_...',    url: 'https://api.together.xyz/settings/api-keys',    fighters: [] },
];

// Provider id → which fighters rely on it.
export const FIGHTER_PROVIDER = { claude: 'anthropic', gpt: 'openai', gemini: 'google' };

export function loadKeys() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveKeys(keys) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function getKeyForFighter(fighterId, keys) {
  const provider = FIGHTER_PROVIDER[fighterId];
  return provider ? (keys[provider] || '') : '';
}
