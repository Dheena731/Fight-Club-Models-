const BASE = import.meta.env.VITE_API_URL || '';

export async function getMeta() {
  const res = await fetch(`${BASE}/api/battle/meta`);
  if (!res.ok) throw new Error('Failed to load arena metadata');
  return res.json();
}

export async function healthCheck(spec) {
  const res = await fetch(`${BASE}/api/model/health-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(spec),
  });
  return res.json(); // always returns { ok, latencyMs, error? }
}

/**
 * Stream a battle over SSE.
 * Beats: onTurnA → onTurnB → onVerdict (per round), then onEnd.
 * Returns an abort function.
 */
export function streamBattle(
  { fighterAId, fighterBId, mode, rounds, topic, cards },
  { onTurnA, onTurnB, onVerdict, onEnd, onError },
) {
  const ctrl = new AbortController();

  fetch(`${BASE}/api/battle/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fighterAId, fighterBId, mode, rounds, topic, cards }),
    signal: ctrl.signal,
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      onError(err.error || 'Server error');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split('\n\n');
      buf = parts.pop(); // keep incomplete chunk
      for (const chunk of parts) {
        // Allow colons in event names (turn:a, turn:b)
        const eventLine = chunk.match(/^event: ([\w:]+)/m)?.[1];
        const dataLine = chunk.match(/^data: (.+)/m)?.[1];
        if (!eventLine || !dataLine) continue;
        try {
          const payload = JSON.parse(dataLine);
          if (eventLine === 'turn:a') onTurnA?.(payload);
          else if (eventLine === 'turn:b') onTurnB?.(payload);
          else if (eventLine === 'verdict') onVerdict?.(payload);
          else if (eventLine === 'end') onEnd?.(payload);
          else if (eventLine === 'error') onError?.(payload.error);
        } catch {
          // Ignore malformed SSE chunks and continue reading the stream.
        }
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError') onError(err.message);
  });

  return () => ctrl.abort();
}
