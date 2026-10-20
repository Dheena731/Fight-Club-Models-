import { isIP } from 'node:net';

const BLOCKED_NAMES = new Set([
  'localhost',
  'host.docker.internal',
  'metadata.google.internal',
  'instance-data.ec2.internal',
]);

function isPrivateIpv4(hostname) {
  const parts = hostname.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a === 10
    || a === 127
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || a === 0;
}

function isPrivateIpv6(hostname) {
  const value = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return value === '::' || value === '::1' || value.startsWith('::ffff:') || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe80:');
}

export function assertSafeBaseURL(rawUrl) {
  if (!rawUrl) return;
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Custom model URL is invalid');
  }

  const allowPrivate = process.env.ALLOW_PRIVATE_MODEL_URLS === 'true';
  if (!allowPrivate && url.protocol !== 'https:') {
    throw new Error('Custom model URLs must use HTTPS');
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const blockedSuffix = host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal');
  const privateAddress = BLOCKED_NAMES.has(host)
    || blockedSuffix
    || (isIP(host) === 4 && isPrivateIpv4(host))
    || (isIP(host) === 6 && isPrivateIpv6(host));
  if (!allowPrivate && privateAddress) {
    throw new Error('Private or local model URLs are disabled on this server');
  }
}

export function assertSafeFighterEndpoint(fighter) {
  if (fighter?.provider !== 'custom') return;
  if (process.env.ALLOW_CUSTOM_MODEL_URLS !== 'true') {
    throw new Error('Arbitrary custom model URLs are disabled on this server');
  }
  assertSafeBaseURL(fighter.baseURL);
}
