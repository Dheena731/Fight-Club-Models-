import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeBaseURL, assertSafeFighterEndpoint } from './safeEndpoint.js';

test('custom fighter endpoints are opt-in', () => {
  assert.throws(
    () => assertSafeFighterEndpoint({ provider: 'custom', baseURL: 'https://models.example/v1' }),
    /disabled/,
  );
});

test('custom URL validation blocks insecure and private IPv6 endpoints', () => {
  assert.throws(() => assertSafeBaseURL('http://models.example/v1'), /HTTPS/);
  assert.throws(() => assertSafeBaseURL('https://[::1]/v1'), /Private or local/);
  assert.throws(() => assertSafeBaseURL('https://service.internal/v1'), /Private or local/);
});
