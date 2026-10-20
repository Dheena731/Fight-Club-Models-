import { Texture } from 'pixi.js';
import { CREATURES } from '../components/creatures/pixelData';

const PIXEL = 5; // px per grid cell when baking

/**
 * Bake a creature pixel grid into a Pixi Texture once.
 * Uses nearest-neighbor so pixel art stays crisp.
 */
export function bakeCreatureTexture(creature) {
  if (!creature?.px?.length) return Texture.EMPTY;

  const { pal, px } = creature;
  const rows = px.length;
  const cols = Math.max(...px.map((r) => r.length));
  const canvas = document.createElement('canvas');
  canvas.width = cols * PIXEL;
  canvas.height = rows * PIXEL;
  const ctx = canvas.getContext('2d');

  for (let y = 0; y < rows; y++) {
    const row = px[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '_' || ch === ' ') continue;
      const color = pal[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * PIXEL, y * PIXEL, PIXEL, PIXEL);
    }
  }

  const texture = Texture.from(canvas);
  texture.source.scaleMode = 'nearest';
  return texture;
}

/** Bake every creature in CREATURES. Returns Map<creatureKey, Texture>. */
export function bakeAllTextures() {
  const map = new Map();
  for (const [key, creature] of Object.entries(CREATURES)) {
    map.set(key, bakeCreatureTexture(creature));
  }
  return map;
}
