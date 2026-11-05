import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../../client/public/assets/frontier/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));

test('lossless runtime art preserves recorded dimensions, alpha, hashes and original PNG sources', () => {
  let sourceBytes = 0;
  let runtimeBytes = 0;
  for (const asset of [...manifest.assets, ...manifest.portraits]) {
    const data = readFileSync(new URL(asset.file, root));
    assert.match(asset.file, /\.webp$/);
    assert.equal(data.subarray(0, 4).toString(), 'RIFF', asset.file);
    assert.equal(data.readUInt32LE(4), data.length - 8, asset.file);
    assert.equal(data.subarray(8, 16).toString(), 'WEBPVP8L', asset.file);
    assert.equal(data[20], 0x2f, `${asset.file} needs a lossless WebP header`);
    const dimensions = data.readUInt32LE(21);
    assert.equal((dimensions & 0x3fff) + 1, asset.width, asset.file);
    assert.equal(((dimensions >>> 14) & 0x3fff) + 1, asset.height, asset.file);
    assert.equal(data.length, asset.bytes, asset.file);
    assert.equal(createHash('sha256').update(data).digest('hex'), asset.sha256, asset.file);
    assert.match(asset.rgbaSha256, /^[a-f0-9]{64}$/);
    if (asset.transparent) assert.equal((dimensions >>> 28) & 1, 1, `${asset.file} must keep alpha`);
    const original = readFileSync(new URL(asset.original.file, root));
    assert.equal(original.subarray(1, 4).toString(), 'PNG', asset.original.file);
    assert.equal(original.readUInt32BE(16), asset.width, asset.original.file);
    assert.equal(original.readUInt32BE(20), asset.height, asset.original.file);
    assert.equal(original.length, asset.original.bytes, asset.original.file);
    assert.equal(createHash('sha256').update(original).digest('hex'), asset.original.sha256, asset.original.file);
    if (asset.transparent) assert.equal(original[25], 6, `${asset.original.file} must keep RGBA`);
    sourceBytes += original.length;
    runtimeBytes += data.length;
  }
  assert.equal(sourceBytes, manifest.delivery.sourceBytes);
  assert.equal(runtimeBytes, manifest.delivery.runtimeBytes);
  assert.ok(runtimeBytes < sourceBytes);
});

test('all nine companion and trainer portraits are project-owned assets', () => {
  assert.equal(manifest.portraits.length, 10);
  for (const portrait of manifest.portraits) {
    assert.equal(portrait.file, `portraits/${portrait.id}.webp`);
    assert.equal(portrait.original.file, `portraits/${portrait.id}.png`);
    assert.ok(portrait.transparent, `${portrait.id} needs transparent portrait art`);
  }
});

test('runtime consumers request WebP derivatives instead of the retained PNG sources', () => {
  for (const component of ['AdventureScene', 'CompanionArt', 'JourneyTitle', 'Locker']) {
    const source = readFileSync(new URL(`../../client/src/rpg/${component}.jsx`, import.meta.url), 'utf8');
    for (const asset of manifest.assets) assert.ok(!source.includes(`/assets/frontier/${asset.original.file}`));
    assert.doesNotMatch(source, /\/assets\/frontier\/portraits\/[^\n]*\.png/);
    assert.match(source, /\/assets\/frontier\/[^\n]*\.webp/);
  }
});
