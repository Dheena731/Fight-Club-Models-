export function readPreference(key, fallback, storage) {
  try { return (storage ?? globalThis.localStorage).getItem(key) ?? fallback; } catch { return fallback; }
}

export function writePreference(key, value, storage) {
  try { (storage ?? globalThis.localStorage).setItem(key, value); return true; } catch { return false; }
}
