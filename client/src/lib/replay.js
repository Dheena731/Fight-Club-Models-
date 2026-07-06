// Shareable replay links — the full battle result encoded in the URL hash.
// No backend storage needed; anyone opening the link reconstructs the result.
// Results only ever contain public fighter info (keys are stripped server-side
// by publicFighter()), so encoding them in a URL is safe.

const PREFIX = '#r=';

function toB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromB64(b64) {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Result object → full shareable URL. */
export function encodeReplayUrl(result) {
  const payload = encodeURIComponent(toB64(JSON.stringify(result)));
  return `${window.location.origin}/result${PREFIX}${payload}`;
}

/** Parse a replay from the current URL hash. Returns the result or null. */
export function decodeReplayFromHash() {
  const h = window.location.hash;
  if (!h.startsWith(PREFIX)) return null;
  try {
    const result = JSON.parse(fromB64(decodeURIComponent(h.slice(PREFIX.length))));
    // sanity: must look like a battle result
    if (!result?.fighters?.a || !Array.isArray(result?.rounds)) return null;
    return result;
  } catch {
    return null;
  }
}
