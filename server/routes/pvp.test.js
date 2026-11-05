import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createPvpRouter } from './pvp.js';

const trainer = { trainerName: 'Human One', companionId: 'kitewhisk' };
async function withApi(run, options) {
  const app = express();
  app.use('/api/pvp', createPvpRouter(options));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/pvp`;
  const request = async (path, { token, ...body } = {}, method = 'POST') => {
    const response = await fetch(`${base}${path}`, {
      method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
    });
    return { response, body: await response.json() };
  };
  try { await run(request, base); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('HTTP invite, authorized polling, hidden choice, conflict and forfeit flow', async () => {
  await withApi(async request => {
    const a = await request('/rooms', trainer);
    assert.equal(a.response.status, 201);
    assert.equal(a.response.headers.get('cache-control'), 'no-store');
    const code = a.body.room.code;
    const unauthorized = await request(`/rooms/${code}`, {}, 'GET');
    assert.equal(unauthorized.response.status, 401);
    const b = await request(`/rooms/${code}/join`, { trainerName: 'Human Two', companionId: 'duplet' });
    assert.equal(b.response.status, 201);
    const move = await request(`/rooms/${code}/command`, { token: a.body.token, version: b.body.room.version, type: 'choice', moveId: 'overcharge' });
    assert.equal(move.response.status, 200);
    const polled = await request(`/rooms/${code}`, { token: b.body.token }, 'GET');
    assert.equal(polled.body.duel.myChoice, null);
    assert.ok(!JSON.stringify(polled.body).includes('overcharge'));
    const stale = await request(`/rooms/${code}/command`, { token: b.body.token, version: b.body.room.version, type: 'leave' });
    assert.equal(stale.response.status, 409);
    const forfeited = await request(`/rooms/${code}/command`, { token: b.body.token, version: polled.body.version, type: 'leave' });
    assert.equal(forfeited.body.duel.result.winner, 0);
    const full = await request(`/rooms/${code}/join`, trainer);
    assert.equal(full.response.status, 409);
  });
});

test('route limits tolerate two tabs polling every two seconds and reject abuse', async () => {
  await withApi(async request => {
    const a = await request('/rooms', trainer);
    const path = `/rooms/${a.body.room.code}`;
    for (let i = 0; i < 60; i++) assert.equal((await request(path, { token: a.body.token }, 'GET')).response.status, 200);
    for (let i = 60; i < 180; i++) await request(path, { token: a.body.token }, 'GET');
    const limited = await request(path, { token: a.body.token }, 'GET');
    assert.equal(limited.response.status, 429);
    assert.match(limited.body.error, /minute/);
    for (let i = 1; i < 20; i++) await request('/rooms', trainer);
    assert.equal((await request('/rooms', trainer)).response.status, 429);
  });
});

test('invalid JSON and oversized bodies return actionable JSON errors', async () => {
  await withApi(async (_request, base) => {
    for (const body of ['{', JSON.stringify({ trainerName: 'x'.repeat(3000) })]) {
      const response = await fetch(`${base}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      assert.ok([400, 413].includes(response.status));
      assert.match((await response.json()).error, /request could not be read/);
    }
  });
});
