export const WORLD_TILE = 24;

// Stable per-coordinate variation keeps the landscape fixed across saves and rebuilds.
export function groundNoise(x, y, seed = 0) {
  let value = Math.imul(x + 374761393, 668265263) ^ Math.imul(y + seed * 13, 1274126177);
  value = Math.imul(value ^ value >>> 13, 1274126177);
  return (value ^ value >>> 16) >>> 0;
}

// Smooth world-space fields make meadows and shoreline detail cross tile seams.
export function landscapeValue(x, y, seed = 0) {
  const gx = x / 5; const gy = y / 5;
  const ix = Math.floor(gx); const iy = Math.floor(gy);
  const fx = gx - ix; const fy = gy - iy;
  const sx = fx * fx * (3 - 2 * fx); const sy = fy * fy * (3 - 2 * fy);
  const a = groundNoise(ix, iy, seed) / 0xffffffff; const b = groundNoise(ix + 1, iy, seed) / 0xffffffff;
  const c = groundNoise(ix, iy + 1, seed) / 0xffffffff; const d = groundNoise(ix + 1, iy + 1, seed) / 0xffffffff;
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

export function environmentGrid(region) {
  const width = region.width || 20; const height = region.height || 12;
  const cells = Array.from({ length: height }, () => Array(width).fill(region.outdoor === false ? region.flooring || 'wood' : 'grass'));
  for (const area of region.path || []) for (let y = Math.max(0, area.y); y < Math.min(height, area.y + area.h); y++) {
    for (let x = Math.max(0, area.x); x < Math.min(width, area.x + area.w); x++) cells[y][x] = region.outdoor === false ? region.flooring || 'wood' : region.id === 'archive' ? 'stone' : 'dirt';
  }
  for (const area of region.terrain || []) for (let y = Math.max(0, area.y); y < Math.min(height, area.y + area.h); y++) {
    for (let x = Math.max(0, area.x); x < Math.min(width, area.x + area.w); x++) cells[y][x] = area.kind;
  }
  return cells;
}

export function traversalPose(traversal, progress, out = {}) {
  const t = Math.max(0, Math.min(1, progress));
  const ease = traversal.kind === 'climb' ? t * t * (3 - 2 * t) : t;
  out.x = (traversal.from.x + (traversal.to.x - traversal.from.x) * ease + 0.5) * WORLD_TILE;
  out.y = (traversal.from.y + (traversal.to.y - traversal.from.y) * ease + 0.95) * WORLD_TILE;
  out.lift = traversal.kind === 'climb' ? Math.sin(t * Math.PI) * 4 : Math.sin(t * Math.PI) * (traversal.kind === 'ledge' ? 12 : 26);
  out.facing = traversal.to.x > traversal.from.x ? 'right' : traversal.to.x < traversal.from.x ? 'left' : traversal.to.y < traversal.from.y ? 'up' : 'down';
  return out;
}

export function crossingTimeline(elapsed, duration, reduced = false, out = {}) {
  const delay = 100; const settle = 110;
  const time = reduced ? duration + delay + settle : Math.max(0, elapsed);
  out.approach = Math.min(1, time / delay);
  out.player = Math.min(1, time / duration);
  out.follower = Math.max(0, Math.min(1, (time - delay) / duration));
  out.settle = Math.max(0, Math.min(1, (time - delay - duration) / settle));
  out.done = time >= duration + delay + settle;
  return out;
}

// Tight visual bounds remove the atlas cell padding; coordinates use the original sheet size.
export const SETTLEMENT_ART = {
  inn: ['buildings', 25, 24, 472, 450], smithy: ['buildings', 524, 80, 489, 375], shop: ['buildings', 1042, 62, 470, 397],
  townhouse: ['buildings', 72, 531, 354, 468], greenhouse: ['buildings', 499, 580, 498, 399], barn: ['buildings', 1040, 526, 479, 472],
  bed: ['interiors', 65, 24, 240, 325], table: ['interiors', 382, 66, 319, 279], chair: ['interiors', 811, 48, 190, 295], shelf: ['interiors', 1124, 10, 286, 339],
  stove: ['interiors', 14, 381, 329, 334], kitchen: ['interiors', 365, 385, 354, 331], counter: ['interiors', 730, 435, 358, 271], wardrobe: ['interiors', 1115, 369, 308, 346],
  chest: ['interiors', 30, 794, 302, 241], rug: ['interiors', 367, 783, 351, 269], loom: ['interiors', 744, 745, 319, 326], workbench: ['interiors', 1092, 777, 350, 267],
  fountain: ['outdoors', 8, 18, 340, 330], well: ['outdoors', 388, 15, 315, 341], cart: ['outdoors', 734, 59, 327, 291], stall: ['outdoors', 1090, 10, 354, 346],
  crop: ['outdoors', 9, 418, 347, 269], beehive: ['outdoors', 416, 391, 250, 317], logs: ['outdoors', 724, 389, 352, 317], clothesline: ['outdoors', 1090, 408, 352, 297],
  boat: ['outdoors', 5, 790, 346, 282], pot: ['outdoors', 364, 735, 355, 341], barrel: ['outdoors', 749, 778, 316, 292], lamppost: ['outdoors', 1193, 731, 153, 349],
};

export function settlementFrameBounds(kind, width, height) {
  const entry = SETTLEMENT_ART[kind];
  if (!entry) return null;
  const [sheet, x, y, w, h] = entry;
  const sourceWidth = sheet === 'buildings' ? 1536 : 1448;
  const sourceHeight = sheet === 'buildings' ? 1024 : 1086;
  const left = Math.round(x / sourceWidth * width); const top = Math.round(y / sourceHeight * height);
  return { sheet, x: left, y: top, width: Math.round((x + w) / sourceWidth * width) - left, height: Math.round((y + h) / sourceHeight * height) - top };
}
