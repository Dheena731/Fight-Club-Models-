export const PVP_SESSION_KEY = 'cogimon:pvp-session:v1';

export function readPvpSession(storage, inviteCode = null) {
  try {
    const session = JSON.parse(storage?.getItem(PVP_SESSION_KEY) || 'null');
    return session && /^[A-F0-9]{10}$/.test(session.code) && /^[A-Za-z0-9_-]{43}$/.test(session.token)
      && (!inviteCode || session.code === inviteCode) ? { code: session.code, token: session.token } : null;
  } catch { return null; }
}

export function writePvpSession(storage, session) {
  try {
    if (!storage) return false;
    if (session) storage.setItem(PVP_SESSION_KEY, JSON.stringify(session));
    else storage.removeItem(PVP_SESSION_KEY);
    return true;
  } catch { return false; }
}

export function duelShareLink(href, code) {
  const url = new URL(href);
  url.search = '';
  url.hash = `duel=${code}`;
  return url.href;
}

export function duelSecondsLeft(room, clock) {
  const elapsed = Math.max(0, clock - room.receivedAt);
  return Math.max(0, Math.ceil((room.duel.deadline - room.serverTime - elapsed) / 1000));
}

export async function pvpRequest(path, { token, body, signal } = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(cancel, 10_000);
  try {
    const response = await fetch(`/api/pvp${path}`, {
      method: body ? 'POST' : 'GET', signal: controller.signal,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let data;
    try { data = await response.json(); }
    catch { throw new Error('The Duel Hall did not answer. Check that the game server is running, then retry.'); }
    if (!response.ok) {
      const error = new Error(data.error || 'The room could not answer. Refresh and try again.');
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error.name === 'AbortError' || error instanceof TypeError) throw new Error('The room signal was lost. Check your connection; the Hall will reconnect.', { cause: error });
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}
