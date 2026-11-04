import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../../client/public/assets/frontier/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));

test('runtime original art matches its recorded PNG dimensions, alpha format and hashes', () => {
  for (const asset of manifest.assets) {
    const data = readFileSync(new URL(asset.file, root));
    assert.equal(data.subarray(1, 4).toString(), 'PNG', asset.file);
    assert.equal(data.readUInt32BE(16), asset.width, asset.file);
    assert.equal(data.readUInt32BE(20), asset.height, asset.file);
    assert.equal(data.length, asset.bytes, asset.file);
    assert.equal(createHash('sha256').update(data).digest('hex'), asset.sha256, asset.file);
    if (asset.transparent) assert.equal(data[25], 6, `${asset.file} must keep RGBA`);
  }
});

test('all nine companion and trainer portraits are project-owned assets, not external paths', () => {
  assert.equal(manifest.portraits.length, 10);
  for (const portrait of manifest.portraits) {
    assert.match(portrait.file, /^portraits\/[a-z]+\.png$/);
    const data = readFileSync(new URL(portrait.file, root));
    assert.equal(data.subarray(1, 4).toString(), 'PNG');
    assert.equal(data[25], 6, `${portrait.id} needs transparent portrait art`);
  }
});
