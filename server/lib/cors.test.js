import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedOrigin } from './cors.js';

test('allows Vite dev origins on localhost and loopback ports', () => {
  assert.equal(isAllowedOrigin('http://localhost:5173'), true);
  assert.equal(isAllowedOrigin('http://localhost:5174'), true);
  assert.equal(isAllowedOrigin('http://127.0.0.1:5174'), true);
});

test('rejects unrelated browser origins by default', () => {
  assert.equal(isAllowedOrigin('https://example.com'), false);
});
