import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SETTLEMENT_ART } from '../../client/src/lib/adventureEnvironment.js';

test('all thirty settlement sprites have recorded source art and lossless runtime sheets', () => {
  const root = new URL('../../client/public/assets/frontier/settlement/', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));
  assert.equal(manifest.assets.length, 3);
  assert.deepEqual(manifest.assets.flatMap(asset => asset.sprites).sort(), Object.keys(SETTLEMENT_ART).sort());
  for (const asset of manifest.assets) {
    const source = readFileSync(new URL(asset.source, root));
    const runtime = readFileSync(new URL(asset.runtime, root));
    assert.equal(source.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(source.readUInt32BE(16), asset.width);
    assert.equal(source.readUInt32BE(20), asset.height);
    assert.equal(runtime.subarray(8, 16).toString(), 'WEBPVP8L');
    const dimensions = runtime.readUInt32LE(21);
    assert.equal((dimensions & 0x3fff) + 1, asset.width);
    assert.equal(((dimensions >>> 14) & 0x3fff) + 1, asset.height);
    assert.equal((dimensions >>> 28) & 1, 1);
    assert.equal(createHash('sha256').update(source).digest('hex'), asset.sourceSha256);
    assert.equal(createHash('sha256').update(runtime).digest('hex'), asset.runtimeSha256);
    assert.ok(asset.prompt.length > 100);
  }
});
