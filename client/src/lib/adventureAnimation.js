// The authored poses cross the generated atlas grid, especially east/north hats.
const FIELD_POSES = [
  [[88, 25, 245, 312], [335, 42, 575, 313], [645, 58, 885, 313], [928, 58, 1188, 313]],
  [[86, 340, 248, 606], [331, 343, 559, 609], [630, 358, 880, 609], [914, 356, 1188, 608]],
  [[82, 625, 247, 897], [342, 637, 570, 898], [615, 648, 878, 897], [923, 644, 1202, 898]],
  [[84, 914, 248, 1202], [349, 924, 581, 1202], [664, 931, 846, 1200], [942, 941, 1192, 1200]],
];
const FIELD_BASELINES = [[305, 307, 305, 304], [595, 596, 596, 595], [884, 884, 882, 884], [1189, 1189, 1187, 1187]];

export function fieldPoseBounds(column, row, atlasWidth, atlasHeight) {
  const bounds = FIELD_POSES[row][column];
  const x = Math.round(bounds[0] * atlasWidth / 1246); const y = Math.round(bounds[1] * atlasHeight / 1263);
  const right = Math.round(bounds[2] * atlasWidth / 1246); const bottom = Math.round(bounds[3] * atlasHeight / 1263);
  const cellX = Math.round(column * atlasWidth / 4); const cellY = Math.round(row * atlasHeight / 4);
  return { x, y, width: right - x, height: bottom - y, offsetX: x - cellX, offsetY: y - cellY, baseline: Math.round(FIELD_BASELINES[row][column] * atlasHeight / 1263) - y,
    cellWidth: Math.round((column + 1) * atlasWidth / 4) - cellX, cellHeight: Math.round((row + 1) * atlasHeight / 4) - cellY };
}

export function cameraAxis(position, worldSize, viewportSize) {
  if (worldSize <= viewportSize) return worldSize / 2;
  return Math.max(viewportSize / 2, Math.min(worldSize - viewportSize / 2, position));
}

export function followerTile(x, y, facing, walkable) {
  const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[facing] || [0, 1];
  for (const [sx, sy] of [[-dx, -dy], [-dy, dx], [dy, -dx], [dx, dy]]) {
    if (walkable(x + sx, y + sy)) return { x: x + sx, y: y + sy };
  }
  return { x, y };
}

export function sampleTrail(trail, distance, out = {}) {
  let index = 0;
  while (index < trail.length - 2 && trail[index + 1].distance < distance) index++;
  const from = trail[index]; const to = trail[index + 1] || from;
  const length = to.distance - from.distance;
  const ratio = length ? Math.max(0, Math.min(1, (distance - from.distance) / length)) : 0;
  out.x = from.x + (to.x - from.x) * ratio;
  out.y = from.y + (to.y - from.y) * ratio;
  out.facing = to.x > from.x ? 'right' : to.x < from.x ? 'left' : to.y < from.y ? 'up' : 'down';
  return out;
}

export function stridePose(phase, facing, running = false, reduced = false, out = {}) {
  const swing = reduced ? 0 : Math.sin(phase);
  const side = facing === 'left' || facing === 'right';
  const reach = running ? 2.3 : 1.7;
  out.leftX = side ? swing * reach : -swing * 0.3;
  out.rightX = side ? -swing * reach : -swing * 0.3;
  out.leftY = side ? -Math.max(0, swing) * 1.4 : swing * reach;
  out.rightY = side ? -Math.max(0, -swing) * 1.4 : -swing * reach;
  out.bodyX = side ? 0 : swing * 0.45;
  out.bodyY = -Math.abs(swing) * (running ? 0.85 : 0.5);
  out.rotation = side ? swing * 0.012 : swing * 0.008;
  return out;
}
