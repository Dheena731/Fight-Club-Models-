import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

test('world landmarks ship with their recorded PNG dimensions, alpha channel and source hashes', () => {
  const directory = new URL('../../client/public/assets/frontier/world/', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', directory), 'utf8'));
  assert.deepEqual(manifest.assets.map(asset => asset.path).sort(), ['broadleaf-tree.png', 'cottage.png', 'observatory.png', 'stone-bridge.png', 'watermill.png']);
  let sourceBytes = 0; let runtimeBytes = 0;
  for (const asset of manifest.assets) {
    const bytes = readFileSync(new URL(asset.path, directory));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', asset.path);
    assert.equal(bytes.readUInt32BE(16), asset.width, asset.path);
    assert.equal(bytes.readUInt32BE(20), asset.height, asset.path);
    assert.equal(bytes[25], 6, `${asset.path} preserves RGBA`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.path);
    assert.ok(asset.transparent && asset.prompt.length > 100, `${asset.path} keeps its source brief`);
    const runtime = readFileSync(new URL(asset.runtime.path, directory));
    assert.equal(asset.runtime.path, asset.path.replace(/\.png$/, '.webp'));
    assert.equal(runtime.subarray(0, 4).toString(), 'RIFF');
    assert.equal(runtime.subarray(8, 16).toString(), 'WEBPVP8L', 'runtime uses lossless WebP');
    assert.equal(runtime[20], 0x2f, 'valid lossless image signature');
    const dimensions = runtime.readUInt32LE(21);
    assert.equal((dimensions & 0x3fff) + 1, asset.width);
    assert.equal(((dimensions >>> 14) & 0x3fff) + 1, asset.height);
    assert.equal((dimensions >>> 28) & 1, 1, 'runtime preserves transparency');
    assert.equal(createHash('sha256').update(runtime).digest('hex'), asset.runtime.sha256);
    assert.equal(runtime.length, asset.runtime.bytes);
    assert.match(asset.runtime.rgbaSha256, /^[a-f0-9]{64}$/);
    sourceBytes += bytes.length; runtimeBytes += runtime.length;
  }
  assert.equal(sourceBytes, manifest.delivery.sourceBytes);
  assert.equal(runtimeBytes, manifest.delivery.runtimeBytes);
  assert.ok(runtimeBytes < sourceBytes);
});
