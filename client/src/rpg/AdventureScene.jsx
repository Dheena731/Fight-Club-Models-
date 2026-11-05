import { useEffect, useRef, useState } from 'react';
import { Application, Assets, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { ADVENTURE_REGIONS, terrainAt, TRAVERSAL_DURATION_MS } from '../../../shared/rpg/adventureContent.js';
import { exitLocked, isAdventureWalkable, regionObjects } from '../../../shared/rpg/adventure.js';
import { WALK_STEP_MS, stepDuration } from '../lib/adventureMovement.js';
import { cameraAxis, fieldPoseBounds, followerTile, sampleTrail, stridePose } from '../lib/adventureAnimation.js';
import { crossingTimeline, environmentGrid, groundNoise, landscapeValue, settlementFrameBounds, traversalPose } from '../lib/adventureEnvironment.js';

const TILE = 24;
const DIRECTIONS = { south: 0, down: 0, west: 1, left: 1, east: 2, right: 2, north: 3, up: 3 };
const COLUMNS = { emberquill: 1, kitewhisk: 2, duplet: 3 };
let assetsPromise;

function loadArt() {
  if (!assetsPromise) assetsPromise = Promise.all([
    Assets.load('/assets/frontier/field-atlas.webp'),
    Assets.load('/assets/frontier/portraits/mossback.webp'),
    Assets.load('/assets/frontier/npc-atlas.webp'),
    Assets.load('/assets/frontier/enemy-atlas.webp'),
    Assets.load('/assets/frontier/world/watermill.webp'),
    Assets.load('/assets/frontier/world/observatory.webp'),
    Assets.load('/assets/frontier/world/stone-bridge.webp'),
    Assets.load('/assets/frontier/world/broadleaf-tree.webp'),
    Assets.load('/assets/frontier/world/cottage.webp'),
    Assets.load('/assets/frontier/settlement/buildings.webp'),
    Assets.load('/assets/frontier/settlement/interiors.webp'),
    Assets.load('/assets/frontier/settlement/outdoors.webp'),
  ]).catch((error) => { assetsPromise = null; throw error; });
  return assetsPromise;
}

function frame(atlas, column, row, columns, rows) {
  const x = Math.round(column * atlas.width / columns); const y = Math.round(row * atlas.height / rows);
  const right = Math.round((column + 1) * atlas.width / columns); const bottom = Math.round((row + 1) * atlas.height / rows);
  return new Texture({ source: atlas.source, frame: new Rectangle(x, y, right - x, bottom - y) });
}

function rect(graphics, x, y, w, h, color) { graphics.rect(x, y, w, h).fill(color); }

function drawWorld(state, fieldAtlas, mossbackArt, npcAtlas, enemyAtlas, millArt, observatoryArt, bridgeArt, treeArt, cottageArt, buildingsAtlas, interiorsAtlas, outdoorsAtlas) {
  const region = ADVENTURE_REGIONS[state.locationId];
  const width = region.width || 20; const height = region.height || 12;
  const indoor = region.outdoor === false;
  const forest = state.locationId === 'grove'; const archive = state.locationId === 'archive'; const ridge = ['sunward', 'highlands'].includes(region.biome);
  const p = region.fieldPalette || (archive ? { grass: '#7b8f91', grass2: '#829697', path: '#c0b8a2', dark: '#526a70', light: '#b5c8b8' }
    : forest ? { grass: '#65986a', grass2: '#6e9f70', path: '#c9b17a', dark: '#38775b', light: '#a4c77b' }
      : { grass: '#8ab773', grass2: '#92bb77', path: '#dfbe7d', dark: '#5e945e', light: '#c1d895' });
  const world = new Container();
  const ground = new Graphics();
  world.addChild(ground);
  const actors = new Container(); actors.sortableChildren = true;
  world.addChild(actors);
  const frames = []; const ambient = [];
  const orchard = region.biome === 'orchard';
  const fieldSeed = [...region.id].reduce((seed, letter) => seed + letter.charCodeAt(0), 0);
  let swayingTrees = 0;
  const getFrame = (...args) => { const texture = frame(...args); frames.push(texture); return texture; };
  const grid = environmentGrid(region);
  const tileKind = (x, y) => grid[y]?.[x];
  const water = kind => kind === 'water';
  const colors = { wood: '#a67950', grass: p.grass, dirt: p.path, sand: '#e4cd99', mud: '#a68e68', stone: '#b8b7a2', water: '#369bb2', bridge: '#c7bda1' };
  function shadow(x, y, w, h = 6) {
    ground.ellipse(x + 5, y + 3, w, h + 3).fill({ color: '#243f3c', alpha: 0.045 });
    ground.ellipse(x + 4, y + 2, w * 0.86, h).fill({ color: '#243f3c', alpha: 0.11 });
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const kind = tileKind(x, y); const n = groundNoise(x, y); const px = x * TILE; const py = y * TILE;
    rect(ground, px, py, TILE, TILE, colors[kind] || p.grass);
    if (indoor) {
      if (kind === 'stone') {
        rect(ground, px, py, TILE, TILE, '#aaa08a'); rect(ground, px + 1, py + 1, TILE - 2, TILE - 2, n % 3 ? '#c2b89f' : '#b9ad95');
        rect(ground, px + 2, py + 2, TILE - 4, 1, '#d5c9ae');
      } else {
        rect(ground, px, py, TILE, TILE, '#a2754d');
        for (let by = 0; by < TILE; by += 8) {
          rect(ground, px, py + by, TILE, 7, (x + y + by) % 3 ? '#b48a5e' : '#bd9568');
          rect(ground, px + 3 + (n + by) % 13, py + by + 3, 7, 1, { color: '#795b3f', alpha: 0.25 });
          rect(ground, px + ((y + by / 8) % 2 ? 16 : 0), py + by, 1, 7, '#906542');
        }
      }
      continue;
    }
    if (kind === 'water') {
      const deep = [tileKind(x - 1, y), tileKind(x + 1, y), tileKind(x, y - 1), tileKind(x, y + 1)].every(water);
      rect(ground, px, py, TILE, TILE, deep ? '#338fa6' : '#64b8b6');
      for (let by = 0; by < TILE; by += 8) for (let bx = 0; bx < TILE; bx += 8) {
        const current = landscapeValue(x + bx / TILE, y + by / TILE, fieldSeed + 3);
        if (current > 0.55) rect(ground, px + bx, py + by, 8, 8, { color: '#235c87', alpha: 0.14 });
        else if (current < 0.36) rect(ground, px + bx, py + by, 8, 8, { color: '#b6ead4', alpha: 0.16 });
      }
      for (let i = 0; i < 3; i++) {
        const ax = px + (n >>> (i * 3) & 15); const ay = py + 3 + (n >>> (i * 4 + 8) & 15);
        rect(ground, ax, ay, 4 + (n >>> (i * 4) & 7), 1, i === 0 ? '#8bd3cd' : '#53b6c4');
      }
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const neighbor = tileKind(x + dx, y + dy);
        if (!neighbor || water(neighbor) || neighbor === 'bridge') continue;
        const horizontal = dy !== 0;
        for (let k = 0; k < TILE; k += 4) {
          const contour = landscapeValue(x + (horizontal ? k / TILE : 0), y + (horizontal ? 0 : k / TILE), fieldSeed + 11);
          const depth = 3 + Math.floor(contour * 4);
          const bx = px + (dx === 1 ? TILE - depth : dx === -1 ? 0 : k);
          const by = py + (dy === 1 ? TILE - depth : dy === -1 ? 0 : k);
          rect(ground, bx, by, horizontal ? 4 : depth, horizontal ? depth : 4, '#90cebc');
          const edgeX = px + (dx === 1 ? TILE - 2 : dx === -1 ? 0 : k);
          const edgeY = py + (dy === 1 ? TILE - 2 : dy === -1 ? 0 : k);
          rect(ground, edgeX, edgeY, horizontal ? 4 : 2, horizontal ? 2 : 4, '#cfcc9b');
        }
      }
      if (n % 19 === 0 && ambient.length < 32) {
        const ripple = new Graphics(); rect(ripple, -5, 0, 11, 1, '#e0f5d8'); rect(ripple, -9, 3, 6, 1, '#a4e4dc');
        ripple.position.set(px + 12, py + 12); ripple.alpha = 0.45; ground.addChild(ripple);
        ambient.push({ sprite: ripple, type: 'water', phase: n % 31, originX: ripple.x });
      }
      continue;
    }
    if (kind === 'bridge') {
      rect(ground, px, py, TILE, TILE, '#c7bda1');
      for (let by = 0; by < TILE; by += 8) for (let bx = 0; bx < TILE; bx += 12) {
        rect(ground, px + bx + (by % 16 ? 3 : 0), py + by, 10, 6, (bx + by) % 16 ? '#e4d4b1' : '#d0c5a8');
      }
    } else if (kind === 'stone') {
      for (let i = 0; i < 4; i++) {
        const ax = px + (n >>> (i * 4) & 15); const ay = py + (n >>> (i * 3 + 7) & 15);
        rect(ground, ax, ay, 5 + i, 3, i % 2 ? '#cbc5aa' : '#a2a68e'); rect(ground, ax, ay, 5, 1, '#e4d8b9');
      }
    } else if (kind !== 'grass') {
      for (let i = 0; i < 4; i++) rect(ground, px + (n >>> (i * 4) & 15), py + (n >>> (i * 3 + 8) & 15), i + 2, 1, i % 2 ? '#edcf94' : '#c5a574');
      // Rough edges follow the traversable tile boundary without hiding the route.
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (tileKind(x + dx, y + dy) === 'grass') {
        for (let k = 0; k < 24; k += 4) {
          const depth = 1 + Math.floor(landscapeValue(x + (dy ? k / TILE : 0), y + (dx ? k / TILE : 0), fieldSeed + 5) * 5);
          rect(ground, px + (dx === 1 ? 24 - depth : dx === -1 ? 0 : k), py + (dy === 1 ? 24 - depth : dy === -1 ? 0 : k), dx ? depth : 3, dy ? depth : 3, p.grass);
        }
      }
    } else {
      const meadow = landscapeValue(x, y, fieldSeed);
      for (let by = 0; by < TILE; by += 8) for (let bx = 0; bx < TILE; bx += 8) {
        const tone = landscapeValue(x + bx / TILE, y + by / TILE, fieldSeed);
        if (tone > 0.55) rect(ground, px + bx, py + by, 8, 8, p.grass2);
        else if (tone < 0.34) rect(ground, px + bx, py + by, 8, 8, { color: p.dark, alpha: 0.12 });
      }
      if (meadow > 0.48 && n % 3 !== 0 || n % 11 === 0) {
        const ax = px + 4 + n % 12; const ay = py + 8 + n % 10;
        const blades = meadow > 0.62 ? 3 : 1;
        for (let i = 0; i < blades; i++) {
          rect(ground, ax + i * 4, ay - i % 2 * 2, 1, 3, p.dark);
          rect(ground, ax + i * 4 + 1, ay - i % 2 * 2 - 1, 1, 2, p.light);
        }
      }
      if (n % 7 === 0) rect(ground, px + 3 + n % 13, py + 4 + (n >>> 5) % 15, 4, 1, p.grass2);
    }
  }
  function asset(texture, x, y, w, h, z = y) {
    const sprite = new Sprite(texture); sprite.anchor.set(0.5, 1); sprite.position.set(x, y); sprite.width = w; sprite.height = h; sprite.zIndex = z;
    actors.addChild(sprite); return sprite;
  }
  const settlementSheets = { buildings: buildingsAtlas, interiors: interiorsAtlas, outdoors: outdoorsAtlas };
  const settlementTextures = new Map();
  function settlement(kind, tx, ty, w = 1, h = 1, tint) {
    const alias = { planter: 'pot' }; const art = alias[kind] || kind;
    const entry = settlementFrameBounds(art, 1536, 1024);
    if (!entry) return null;
    let texture = settlementTextures.get(art);
    if (!texture) {
      const atlas = settlementSheets[entry.sheet]; const bounds = settlementFrameBounds(art, atlas.width, atlas.height);
      texture = new Texture({ source: atlas.source, frame: new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height) });
      frames.push(texture); settlementTextures.set(art, texture);
    }
    const floor = art === 'rug' || art === 'crop';
    const building = entry.sheet === 'buildings';
    const modules = { shelf: [1.5, 2], counter: [2, 2], kitchen: [2, 2], workbench: [2, 2], table: [3, 2], crop: [2, 1], logs: [2, 1], clothesline: [2, 2] };
    const module = modules[art];
    const columns = module ? Math.ceil(w / module[0]) : 1;
    const rows = module ? Math.ceil(h / module[1]) : 1;
    const cellWidth = w / columns; const cellDepth = h / rows;
    let sprite;
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
      let displayWidth = Math.max(12, cellWidth * TILE - (floor ? 0 : 3));
      let displayHeight = displayWidth * texture.height / texture.width;
      const x = (tx + (column + 0.5) * cellWidth) * TILE; const y = (ty + (row + 1) * cellDepth) * TILE;
      if (!building) {
        const maxHeight = Math.min(art === 'clothesline' ? TILE * 1.5 : (cellDepth + (floor ? 0 : 0.75)) * TILE, indoor ? Math.max(8, y - 2) : Infinity);
        if (displayHeight > maxHeight) { displayWidth *= maxHeight / displayHeight; displayHeight = maxHeight; }
      }
      if (!floor) shadow(x, y - 2, displayWidth * 0.4, Math.min(7, displayWidth * 0.12));
      sprite = asset(texture, x, y, displayWidth, displayHeight, floor ? -2 : y);
      if (tint) sprite.tint = tint;
    }
    return sprite;
  }
  function roomWall(tx, ty, w, h) {
    const g = new Graphics(); const x = tx * TILE; const y = ty * TILE; const ww = w * TILE; const hh = h * TILE;
    g.position.set(x, y); g.zIndex = y + hh; actors.addChild(g);
    rect(g, 0, 0, ww, hh, '#dfcba2'); rect(g, 0, hh - 9, ww, 9, '#896344'); rect(g, 0, hh - 10, ww, 2, '#b68b5b');
    rect(g, 0, hh - 2, ww, 2, '#634c3c'); rect(g, 0, 0, ww, 3, '#75523e');
    for (let xx = 0; xx < ww; xx += TILE) { rect(g, xx, hh - 8, 1, 6, '#ae8255'); }
    return g;
  }
  if (indoor) {
    roomWall(0, 0, width, 1);
    for (let x = 3; x < width - 2; x += 5) {
      const win = new Graphics(); win.position.set(x * TILE, 2); win.zIndex = TILE + 1; actors.addChild(win);
      rect(win, -10, 0, 22, 18, '#70533f'); rect(win, -8, 2, 18, 12, '#8fc6ba'); rect(win, -7, 2, 8, 4, '#d9e8c4');
      rect(win, 0, 2, 2, 13, '#e9c98e'); rect(win, -8, 8, 18, 2, '#e9c98e'); rect(win, -12, 16, 26, 3, '#bc8a56');
      ground.poly([x * TILE - 8, TILE, x * TILE + 10, TILE, x * TILE + 43, TILE * 4, x * TILE + 7, TILE * 4]).fill({ color: '#f6df9e', alpha: 0.08 });
    }
    const edges = new Graphics(); world.addChildAt(edges, 0);
    rect(edges, -2000, -2000, width * TILE + 4000, 2000, '#302d2c'); rect(edges, -2000, height * TILE, width * TILE + 4000, 2000, '#302d2c');
    rect(edges, -2000, 0, 2000, height * TILE, '#302d2c'); rect(edges, width * TILE, 0, 2000, height * TILE, '#302d2c');
    rect(ground, 0, TILE, 4, (height - 1) * TILE, '#70533f'); rect(ground, (width - 1) * TILE + 20, TILE, 4, (height - 1) * TILE, '#70533f');
    rect(ground, 0, height * TILE - 4, width * TILE, 4, '#70533f');
  }
  function stone(graphics, x, y, w, h, seed = 0) {
    graphics.poly([x + 2, y + h, x, y + h * 0.4, x + w * 0.23, y + 1, x + w * 0.73, y, x + w, y + h * 0.48, x + w - 1, y + h]).fill('#626b68');
    graphics.poly([x + 2, y + h * 0.42, x + w * 0.25, y + 2, x + w * 0.7, y + 1, x + w - 2, y + h * 0.47, x + w * 0.6, y + h * 0.7, x + 3, y + h * 0.6]).fill('#c8c6a9');
    rect(graphics, x + 3, y + h * 0.4, w * 0.35, 1, '#f1dfb3'); rect(graphics, x + w * 0.66, y + h * 0.58, 1, h * 0.26, '#7f8580');
    if (seed % 3 === 0) { rect(graphics, x + 2, y + h - 3, w * 0.45, 2, '#75945f'); rect(graphics, x + 4, y + h - 5, 3, 2, '#adc47c'); }
  }
  function flowers(graphics, x, y, seed) {
    for (let i = 0; i < 4; i++) {
      const fx = x + (i * 7 + seed) % 19; const fy = y + (i * 5 + seed) % 12;
      rect(graphics, fx, fy - 3, 1, 5, '#4a8057'); rect(graphics, fx - 2, fy - 6, 5, 3, seed % 2 ? '#f1af9a' : '#f2e4b0');
      rect(graphics, fx - 1, fy - 7, 3, 5, seed % 2 ? '#f6c6ac' : '#fff4ce'); rect(graphics, fx, fy - 5, 1, 1, '#dba84d');
    }
  }
  function smallProp(kind, tx, ty, w = 1, h = 1) {
    const detailed = settlement(kind, tx, ty, w, h); if (detailed) return detailed;
    const x = (tx + 0.5) * TILE; const y = (ty + 1) * TILE; const n = groundNoise(tx, ty);
    const g = new Graphics(); g.position.set(x, y); g.zIndex = y; actors.addChild(g);
    if (kind === 'door') {
      g.zIndex = -1; rect(g, -11, -5, 22, 5, '#a9997b'); rect(g, -9, -5, 18, 1, '#e5d2aa'); rect(g, -12, 0, 24, 2, '#7b715e');
      if (indoor && ty >= height - 3) { rect(g, -10, -10, 20, 10, '#493c32'); rect(g, -12, -10, 2, 11, '#b18b5b'); rect(g, 10, -10, 2, 11, '#b18b5b'); }
    } else if (kind === 'hay') {
      rect(g, -10, -15, 20, 15, '#b78b3f'); rect(g, -10, -17, 20, 4, '#ead080'); rect(g, -7, -16, 2, 16, '#806545'); rect(g, 5, -16, 2, 16, '#806545'); for (let by = -11; by < 0; by += 4) rect(g, -4, by, 8, 1, '#e8c56e');
    } else if (kind === 'dock') {
      g.position.set((tx + w / 2) * TILE, (ty + h) * TILE);
      g.zIndex = -3; for (let i = 0; i < h * TILE; i += 6) { rect(g, -w * TILE / 2, -h * TILE + i, w * TILE, 5, '#ae8354'); rect(g, -w * TILE / 2 + 2, -h * TILE + i, w * TILE - 4, 1, '#d2ab73'); }
      for (const dx of [-w * TILE / 2 + 2, w * TILE / 2 - 4]) { rect(g, dx, -h * TILE, 3, h * TILE + 3, '#75543c'); }
    } else if (kind === 'anvil') {
      shadow(x, y, w * 9); rect(g, -9, -8, 18, 8, '#76553a'); rect(g, -5, -16, 10, 9, '#596a6c'); g.poly([-15, -23, 13, -23, 18, -19, 8, -16, -5, -16, -5, -12, -10, -12, -11, -17, -18, -20]).fill('#889895'); rect(g, -14, -23, 26, 2, '#c2c8ae');
    } else if (kind === 'basket') {
      g.ellipse(0, -10, 8, 6).stroke({color: '#ae8c5b', width: 2}); rect(g, -10, -11, 20, 12, '#a67e4b'); rect(g, -9, -11, 18, 2, '#d4b377'); for(let i = -6; i < 8; i += 4) rect(g, i, -8, 1, 9, '#d7b978');
    } else if (kind === 'book') {
      g.zIndex = -1; rect(g, -7, -5, 14, 6, '#9e5148'); rect(g, -5, -4, 10, 4, '#e7d5a7'); rect(g, -7, -5, 2, 6, '#713e3c');
    } else if (kind === 'clock') {
      g.circle(0, -14, 9).fill('#77563c'); g.circle(0, -14, 7).fill('#e7d5a7'); rect(g, 0, -19, 1, 6, '#655746'); rect(g, 0, -14, 5, 1, '#655746');
    } else if (kind === 'pebble' || kind === 'rock') { shadow(x, y, 9); stone(g, -7, -10, 14, 10, n); if (w > 1) stone(g, 7, -6, 8, 6, n + 1); }
    else if (kind === 'flowers') flowers(g, -10, -3, n);
    else if (kind === 'reeds') {
      for (let i = 0; i < 7; i++) { const rx = -10 + i * 3; const rh = 8 + n % (i + 9); rect(g, rx, -rh, 1, rh, '#557d4b'); rect(g, rx - 1, -rh - 3, 2, 5, '#9b7848'); rect(g, rx + 1, -rh / 2, 2, 1, '#b6c77a'); }
    } else if (kind === 'crate' || kind === 'cache') {
      shadow(x, y, 11); rect(g, -10, -15, 20, 15, '#654f3f'); rect(g, -9, -14, 18, 12, '#b88c55'); rect(g, -10, -18, 20, 4, '#dfb575');
      for (let i = -6; i <= 6; i += 6) rect(g, i, -13, 1, 10, '#8a6745'); rect(g, -9, -4, 18, 2, '#dec18b');
      if (kind === 'cache') { rect(g, -1, -13, 3, 6, '#f3d483'); rect(g, 0, -11, 1, 2, '#746149'); }
    } else if (kind === 'mailbox') {
      shadow(x, y, 8); rect(g, -2, -15, 4, 16, '#775743'); rect(g, -8, -27, 17, 13, '#3f7067'); rect(g, -6, -29, 13, 2, '#86aa83');
      rect(g, -6, -25, 12, 2, '#bed0a0'); rect(g, -5, -21, 11, 2, '#294c4a'); rect(g, 8, -31, 2, 17, '#805744'); rect(g, 10, -31, 7, 5, '#d7815d'); rect(g, -6, -15, 12, 2, '#e2bc79');
    } else if (kind === 'bench') {
      shadow(x, y, 20); for (const bx of [-16, 13]) { rect(g, bx, -15, 3, 17, '#645547'); rect(g, bx + 1, 0, 5, 2, '#4d584a'); }
      for (const by of [-18, -13, -6]) { rect(g, -20, by, 40, 4, '#9d7749'); rect(g, -20, by, 40, 1, '#d4b378'); } rect(g, -20, -2, 40, 2, '#755b40');
    } else if (kind === 'fence') {
      for (let i = 0; i < w * TILE; i += 18) { rect(g, i - 10, -20, 4, 21, '#785e40'); rect(g, i - 10, -22, 4, 3, '#c4a673'); }
      rect(g, -10, -16, w * TILE, 3, '#bd9a62'); rect(g, -10, -7, w * TILE, 3, '#937243');
    } else if (kind === 'stump') {
      shadow(x, y, 12); g.ellipse(0, -3, 11, 5).fill('#735b40'); rect(g, -9, -12, 18, 10, '#967044'); g.ellipse(0, -12, 10, 5).fill('#d9b976'); g.ellipse(0, -12, 6, 3).stroke({ color: '#ac8955', width: 1 }); rect(g, 1, -15, 1, 5, '#ac8955');
    } else if (kind === 'waterfall') {
      const ww = w * TILE; const hh = h * TILE; g.position.set(tx * TILE, ty * TILE); g.zIndex = (ty + h) * TILE;
      rect(g, 0, 0, ww, hh, '#80c7cc');
      for (let i = 0; i < ww; i += 6) { rect(g, i, 0, i % 12 ? 2 : 4, hh, i % 12 ? '#caeee3' : '#edf8df'); }
      g.ellipse(ww / 2, hh + 1, ww * 0.7, 6).fill({ color: '#c5ede4', alpha: 0.7 });
      for (let i = 0; i < 5; i++) { const spray = new Graphics(); rect(spray, 0, 0, 2, 4, '#f3ffe8'); spray.position.set(tx * TILE + 3 + i * ww / 5, ty * TILE + hh / 2); actors.addChild(spray); spray.zIndex = g.zIndex + 1; ambient.push({ sprite: spray, type: 'fall', phase: i * 1.2, originY: spray.y, range: hh * 0.45 }); }
    } else if (kind === 'telescope') {
      shadow(x, y, 13); g.poly([-9, 1, 0, -16, 8, 1]).stroke({ color: '#75634e', width: 2 });
      g.poly([-13, -26, -9, -32, 10, -20, 7, -15]).fill('#b59051'); g.poly([-13, -26, -9, -32, -5, -29, -9, -23]).fill('#e4ca82'); g.circle(-11, -28, 3).fill('#75b0b4');
    } else if (kind === 'waystone') { shadow(x, y, 12); stone(g, -10, -28, 20, 28, n); rect(g, -3, -20, 7, 2, '#6b8d7e'); rect(g, 0, -23, 2, 8, '#6b8d7e'); }
    return g;
  }
  function crag(x, y, w, h) {
    const rock = new Graphics(); rock.position.set(x, y); rock.zIndex = y + h; actors.addChild(rock);
    shadow(x + w / 2, y + h, w / 2, 9);
    const cool = region.biome === 'highlands' || archive;
    const face = cool ? '#969b98' : '#a2977b'; const light = cool ? '#b3b5a7' : '#beb18d';
    const shade = cool ? '#757f7c' : '#847b62'; const seam = cool ? '#68736f' : '#756d56';
    rock.poly([0, 5, 4, 1, w - 5, 0, w, 5, w, h - 3, w - 4, h, 3, h, 0, h - 4]).fill(shade);
    const cap = Math.min(12, Math.max(5, Math.round(h * 0.12)));
    // Connected shelves span the whole cliff; short cracks never form vertical columns.
    for (let by = cap; by < h - 2;) {
      const n = groundNoise(x, y + by, 17); const depth = 11 + n % 12;
      const bottom = Math.min(h - 2, by + depth); const upper = []; const lower = [];
      for (let bx = 1; bx < w;) {
        const bend = groundNoise(x + bx, y + by, 23) % 5 - 2;
        upper.push(bx, Math.max(cap - 1, by + bend));
        lower.unshift(bx, Math.min(h - 2, bottom + bend));
        if (bx === w - 1) break;
        bx = Math.min(w - 1, bx + 17 + groundNoise(x + bx, y + by) % 23);
      }
      rock.poly([...upper, ...lower]).fill(n % 3 === 0 ? light : face);
      for (let i = 0; i < upper.length - 2; i += 2) {
        const ax = upper[i]; const ay = upper[i + 1]; const bx = upper[i + 2]; const by2 = upper[i + 3];
        rock.poly([ax, ay, bx, by2, bx, by2 + 2, ax, ay + 2]).fill(shade);
        if ((n + i) % 3 === 0) {
          const joint = Math.min(bx - 2, ax + 5 + (n + i) % 9);
          const base = Math.min(h - 3, ay + 3);
          const tip = Math.min(h - 2, base + 3 + n % 4);
          rock.poly([joint, base, joint + 2, base, joint, tip, joint - 1, tip]).fill(seam);
        }
      }
      by = bottom;
    }
    const top = [0, -3, w, -3, w, cap - 1];
    for (let bx = w; bx >= 0; bx -= 6) top.push(bx, cap - 2 + groundNoise(x + bx, y, 29) % 4);
    top.push(0, cap - 1);
    rock.poly(top).fill(p.grass);
    for (let bx = 3; bx < w - 3; bx += 19 + groundNoise(x + bx, y) % 13) {
      const n = groundNoise(x + bx, y, 31); const lip = Math.min(w - bx - 1, 7 + n % 12);
      rect(rock, bx, -3, lip, 1, p.light);
      if (n % 3 === 0) {
        const mossY = cap - 2; const mossH = Math.min(h - mossY, 4 + n % 7);
        rect(rock, bx, mossY, Math.min(4, w - bx), mossH, p.dark);
        rect(rock, bx + 1, mossY, Math.min(2, w - bx - 1), Math.max(1, mossH - 2), p.grass);
      }
    }
  }
  function tree(x, y, scale = 1) {
    const n = groundNoise(Math.round(x), Math.round(y), fieldSeed);
    const widthRatio = 0.82 + (n % 17) / 100; const heightRatio = 0.89 + (n >>> 5) % 12 / 100;
    const offset = ((n >>> 9) % 7 - 3) * (1 - widthRatio) * 3;
    shadow(x, y - 2, 20 * scale, 7 * scale);
    ground.ellipse(x, y - 2, 17 * scale, 5 * scale).fill({ color: p.dark, alpha: 0.08 });
    const sprite = asset(treeArt, x + offset, y + 8, 72 * scale * widthRatio, 86 * scale * heightRatio, y);
    const tints = orchard ? [0xffedc4, 0xe6edb8, 0xf5d4b4, 0xffffff]
      : forest ? [0xc7dfbf, 0xe3edcf, 0xd3e6c6, 0xffffff] : [0xe6e9c6, 0xd4e3ca, 0xffedcd, 0xffffff];
    sprite.tint = tints[n % tints.length];
    if (n & 32) sprite.scale.x *= -1;
    if (swayingTrees < 16 && n % 3 === 0) { ambient.push({ sprite, type: 'tree', phase: x * 0.03 + y * 0.07 }); swayingTrees++; }
    return sprite;
  }
  function building(r) {
    const kind = r.art || r.kind;
    if (settlement(kind, r.x - 0.15, r.y, r.w + 0.3, r.h, r.tint)) return;
    const x = (r.x + r.w / 2) * TILE; const y = (r.y + r.h) * TILE;
    const texture = kind === 'mill' ? millArt : kind === 'observatory' ? observatoryArt : cottageArt;
    const w = r.w * TILE + 22; const h = w * texture.height / texture.width;
    shadow(x, y, w * 0.45, 12);
    const sprite = asset(texture, x, y + 4, w, h, y);
    if (r.tint || archive) sprite.tint = r.tint || '#d6cddf';
  }
  for (const r of region.solid || []) {
    if (r.kind === 'furniture') {
      if (r.art === 'wall') roomWall(r.x, r.y, r.w, r.h);
      else if (!settlement(r.art, r.x, r.y, r.w, r.h, r.tint)) smallProp(r.art, r.x, r.y, r.w, r.h);
    } else if (r.kind === 'building' || ['mill', 'observatory', 'house'].includes(r.kind)) building(r);
    else if (r.kind === 'trees' || forest) {
      for (let ty = r.y; ty < r.y + r.h; ty += 2) for (let tx = r.x; tx < r.x + r.w; tx += 2) tree((tx + 0.8) * TILE, (ty + 1.9) * TILE, 0.9 + groundNoise(tx, ty) % 13 / 100);
    } else if (r.kind === 'rock' || r.kind === 'ruins' || ridge) crag(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE);
    else building(r);
  }
  for (const r of region.terrain || []) if (r.kind === 'bridge' && r.w > r.h && r.w >= 3) {
    const x = (r.x + r.w / 2) * TILE; const top = r.y * TILE; const w = r.w * TILE + 12;
    // The facade sits below its walkable deck; keep the trainer visible on the crossing.
    asset(bridgeArt, x, top + r.h * TILE + 18, w, r.h * TILE + 34, -1);
  }
  if (!indoor) for (let x = 0; x < width; x += 2) {
    if (ridge) { crag(x * TILE, 0, TILE * 2, TILE); crag(x * TILE, (height - 1) * TILE, TILE * 2, TILE); }
    else { tree((x + 0.4) * TILE, TILE * 0.9); tree((x + 0.5) * TILE, height * TILE + 22); }
  }
  if (!indoor) for (let y = 2; y < height - 1; y += 2) {
    if (ridge) { crag(0, y * TILE, TILE, TILE * 2); crag((width - 1) * TILE, y * TILE, TILE, TILE * 2); }
    else { tree(2, (y + 1) * TILE); tree(width * TILE - 2, (y + 1) * TILE); }
  }
  for (const d of region.decorations || []) {
    if (['flowers', 'pebble', 'reeds'].includes(d.kind)) {
      for (let dy = 0; dy < (d.h || 1); dy += 1.5) for (let dx = 0; dx < (d.w || 1); dx += 1.5) {
        smallProp(d.kind, d.x + dx, d.y + dy);
      }
    } else smallProp(d.kind, d.x, d.y, d.w || 1, d.h || 1);
  }
  // Small ground details are fixed and bounded, not a per-frame particle population.
  if (!indoor) for (let y = 2; y < height - 2; y++) for (let x = 2; x < width - 2; x++) {
    const n = groundNoise(x, y, 7); const kind = tileKind(x, y);
    const meadow = landscapeValue(x, y, fieldSeed);
    if (kind === 'grass' && meadow > 0.57 && n % (orchard ? 7 : 13) === 0) smallProp('flowers', x, y);
    else if (kind !== 'water' && kind !== 'bridge' && n % 79 === 0) smallProp('pebble', x, y);
    else if (kind === 'grass' && [tileKind(x - 1, y), tileKind(x + 1, y), tileKind(x, y - 1), tileKind(x, y + 1)].some(water) && n % 3 === 0) smallProp('reeds', x, y);
  }
  for (const link of region.traversals || []) {
    const g = new Graphics(); const x = (link.from.x + 0.5) * TILE; const y = (link.from.y + 0.5) * TILE;
    if (link.kind === 'climb') {
      const endY = (link.to.y + 0.5) * TILE; const top = Math.min(y, endY); const bottom = Math.max(y, endY);
      rect(g, x - 6, top, 2, bottom - top, '#795e46'); rect(g, x + 5, top, 2, bottom - top, '#795e46');
      for (let ry = top + 3; ry < bottom; ry += 7) { rect(g, x - 5, ry, 10, 2, '#d4b37b'); rect(g, x - 5, ry + 2, 10, 1, '#94734f'); }
      g.zIndex = bottom + 1;
    } else {
      g.poly([x - 4, y + 3, x, y - 2, x + 4, y + 3]).stroke({ color: '#e9dda8', width: 1.5 }); g.zIndex = -1;
    }
    actors.addChild(g);
  }
  for (const object of regionObjects(state)) {
    if (object.hiddenFlag && state.flags[object.hiddenFlag]) continue;
    if (object.id === 'shard' && state.flags.shardFound) continue;
    if ((object.id === 'static' || object.id === 'wisp') && state.flags.wispDefeated) continue;
    const x = (object.x + 0.5) * TILE; const y = (object.y + 1) * TILE;
    if (object.transport) {
      const locked = exitLocked(state, object);
      const g = new Graphics(); g.position.set(x, y); g.zIndex = y + 1; actors.addChild(g);
      if (object.transport === 'ferry') {
        const berth = object.berth;
        if (berth) settlement('boat', berth.x, berth.y, berth.w, berth.h, locked ? '#a9aaa0' : '#ffffff');
        for (let py = -20; py < 2; py += 5) { rect(g, -12, py, 24, 4, '#ac8354'); rect(g, -11, py, 22, 1, '#ddbd84'); }
        rect(g, -13, -29, 4, 32, '#70503a'); rect(g, 10, -29, 4, 32, '#70503a');
        if (locked) { rect(g, -11, -22, 24, 5, '#a05c45'); rect(g, -10, -22, 22, 1, '#e3bc83'); }
        else g.moveTo(-11, -21).lineTo(-11, -8).stroke({ color: '#d6ba7b', width: 2 });
      } else {
        for (const px of [-13, 10]) { rect(g, px, -56, 4, 58, '#715a43'); rect(g, px + 1, -55, 1, 53, '#d0b17a'); }
        rect(g, -16, -57, 33, 5, '#a18555'); rect(g, -15, -57, 31, 1, '#ead093');
        g.circle(0, -48, 5).fill('#58665e'); g.circle(0, -48, 2).fill('#c3bc95');
        for (const px of [-7, 7]) rect(g, px, -48, 1, 39, '#d7c28d');
        for (let py = -10; py < 2; py += 4) rect(g, -10, py, 21, 3, '#bb945d');
        rect(g, -10, -21, 2, 14, '#866745'); rect(g, 9, -21, 2, 14, '#866745');
        if (locked) rect(g, -9, -20, 19, 3, '#9c7960');
      }
      rect(g, 13, -37, 3, 39, '#705b42'); rect(g, 9, -43, 11, 9, '#555c50');
      rect(g, 11, -41, 7, 5, locked ? '#9a7765' : '#f5d17d');
      if (locked) { rect(g, 13, -27, 6, 5, '#dbb677'); rect(g, 14, -29, 4, 3, '#91856a'); }
      else ambient.push({ sprite: g, type: 'lantern', phase: x * 0.1 });
    }
    else if (object.appearance) smallProp(object.appearance, object.x, object.y, object.w || 1, object.h || 1);
    else if (object.type === 'exit') {
      const g = new Graphics(); g.position.set(x, y); g.zIndex = y; actors.addChild(g);
      for (const side of [-1, 1]) { stone(g, side * 16 - 5, -28, 10, 28, 0); rect(g, side * 16 - 6, -29, 12, 3, '#e0d5ac'); }
      rect(g, -19, -34, 38, 5, '#ac9369'); rect(g, -17, -34, 34, 1, '#e6cc8c');
    } else if (object.type === 'landmark' || /lantern|relay/.test(object.id)) {
      const g = new Graphics(); g.position.set(x, y); g.zIndex = y; actors.addChild(g); shadow(x, y, 11);
      stone(g, -9, -6, 18, 6, 0); rect(g, -2, -40, 4, 34, '#a58652'); rect(g, -7, -44, 14, 14, '#776c50');
      const lit = !(object.id === 'lantern' && !state.flags.questComplete || object.id === 'relay' && !state.flags.relayRestored);
      rect(g, -5, -42, 10, 10, lit ? '#f4d88a' : '#769891'); rect(g, -7, -45, 14, 3, '#c6a461'); rect(g, -1, -49, 2, 4, '#ebc579');
      if (lit) ambient.push({ sprite: g, type: 'lantern', phase: x * 0.1 });
    } else if (object.type === 'npc') {
      const npc = new Sprite(getFrame(npcAtlas, object.npcFrame ?? (object.id === 'guide' ? 0 : object.id === 'ranger' ? 1 : 2), 0, 3, 1)); npc.anchor.set(0.5, 0.91); npc.width = 44; npc.height = 44; npc.position.set(x, y); npc.zIndex = y; actors.addChild(npc);
      if (object.tint) npc.tint = object.tint;
      if (object.activity) ambient.push({ sprite: npc, type: 'npc', phase: x * 0.1, originY: y });
    } else if (['rest', 'board', 'arena', 'sign', 'practice', 'circuit', 'lore'].includes(object.type)) {
      if (object.type === 'rest') smallProp('bench', object.x, object.y);
      else { const g = new Graphics(); rect(g, -2, -18, 4, 19, '#755b42'); rect(g, -14, -31, 28, 18, '#846747'); rect(g, -13, -30, 26, 15, '#dfc393'); rect(g, -11, -29, 22, 1, '#f8e2b2'); rect(g, -9, -25, 18, 2, '#8e7653'); rect(g, -9, -20, 13, 2, '#8e7653'); g.position.set(x, y); g.zIndex = y; actors.addChild(g); }
    } else if (object.type === 'enemy' || object.type === 'boss' || object.encounterId) {
      const enemy = new Sprite(getFrame(enemyAtlas, object.encounterId === 'archive-warden' ? 1 : 0, 0, 2, 1)); enemy.anchor.set(0.5, 0.9); enemy.width = 44; enemy.height = 44; enemy.position.set(x, y); enemy.zIndex = y; actors.addChild(enemy);
    } else if (object.type === 'item' || object.type === 'pickup' || object.discoveryFlag || object.id === 'shard') {
      const icon = new Graphics(); rect(icon, -4, -21, 8, 15, '#93d7df'); rect(icon, -7, -18, 14, 8, '#b6edf0'); rect(icon, -2, -24, 4, 3, '#fdf1bd'); icon.position.set(x, y); icon.zIndex = y; actors.addChild(icon);
    }
    const discovered = object.discoveryFlag && state.flags[object.discoveryFlag];
    if (!discovered && !(object.task && state.flags[object.task.flag]) && !object.appearance && ['npc', 'enemy', 'boss', 'item', 'landmark'].includes(object.type)) { const marker = new Graphics(); marker.poly([-3, 0, 3, 0, 0, 4]).fill('#ffe298'); marker.position.set(x, y - 39); marker.zIndex = y + 1; actors.addChild(marker); }
  }

  const cloudShade = new Container(); world.addChildAt(cloudShade, 1);
  const cloudCount = indoor ? 0 : forest || archive ? 2 : 4;
  for (let i = 0; i < cloudCount; i++) {
    const n = groundNoise(i, fieldSeed, 19); const cloud = new Graphics();
    cloud.poly([-78, -12, -56, -12, -56, -25, -26, -25, -26, -32, 16, -32, 16, -22, 47, -22, 47, -10, 76, -10, 76, 8, 49, 8, 49, 20, 4, 20, 4, 25, -39, 25, -39, 13, -78, 13]).fill('#344f63');
    cloud.scale.set(1.3 + n % 8 / 10); cloud.alpha = forest ? 0.06 : 0.045;
    cloud.position.set((0.18 + i * 0.21) * width * TILE, (0.2 + n % 60 / 100) * height * TILE);
    cloudShade.addChild(cloud);
    ambient.push({ sprite: cloud, type: 'cloud', phase: i * 2.3, originX: cloud.x, originY: cloud.y });
  }
  if (!indoor && (forest || archive || orchard || region.biome === 'riverlands')) {
    const motes = new Container(); world.addChild(motes);
    const glow = forest || archive;
    for (let i = 0; i < (glow ? 22 : 16); i++) {
      const n = groundNoise(i, fieldSeed, 31); const mote = new Graphics();
      if (glow) { rect(mote, -2, -2, 5, 5, { color: '#f5db86', alpha: 0.13 }); rect(mote, 0, 0, 1, 1, '#fff1bc'); }
      else { rect(mote, 0, 0, 2, 1, orchard ? '#f5dbc0' : '#e8e9b9'); rect(mote, 1, -1, 1, 1, '#fff1cf'); }
      mote.position.set((2 + n % (width - 4)) * TILE, (2 + (n >>> 8) % (height - 4)) * TILE);
      motes.addChild(mote);
      ambient.push({ sprite: mote, type: 'mote', phase: i * 2.1, originX: mote.x, originY: mote.y, glow });
    }
  }

  function fieldPose(column, row) {
    const bounds = fieldPoseBounds(column, row, fieldAtlas.width, fieldAtlas.height);
    const texture = new Texture({ source: fieldAtlas.source, frame: new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height) }); frames.push(texture);
    return { ...bounds, texture };
  }
  const playerFrames = [0, 1, 2, 3].map((row) => fieldPose(0, row));
  const companionFrames = [0, 1, 2, 3].map((row) => state.activeId === 'mossback'
    ? { texture: getFrame(mossbackArt, 0, 0, 1, 1), offsetX: 0, baseline: mossbackArt.height * 0.94, cellWidth: mossbackArt.width, cellHeight: mossbackArt.height }
    : fieldPose(COLUMNS[state.activeId] || 1, row));
  const scenery = actors.children.map(object => {
    const { x, y, width, height } = object.getBounds();
    return { object, bounds: { x, y, width, height } };
  });
  function walker(poses, w, h) {
    const actor = new Container(); const shadow = new Graphics();
    shadow.ellipse(0, 1, w * 0.22, 2.2).fill({ color: '#334438', alpha: 0.25 });
    const rig = new Container(); const body = new Sprite(); const left = new Sprite(); const right = new Sprite();
    const parts = poses.map(pose => {
      const texture = pose.texture;
      const { x, y, width: fw, height: fh } = texture.frame;
      // Overlap the hip beneath the torso so the running stride cannot open a seam.
      const split = Math.round(fh * 0.73); const middle = Math.round(fw / 2);
      const textures = [[x, y, fw, Math.round(fh * 0.85)], [x, y + split, middle, fh - split], [x + middle, y + split, fw - middle, fh - split]].map(([px, py, pw, ph]) => {
        const part = new Texture({ source: texture.source, frame: new Rectangle(px, py, pw, ph) }); frames.push(part); return part;
      });
      return { textures, x: -w / 2 + pose.offsetX * w / pose.cellWidth, y: -pose.baseline * h / pose.cellHeight,
        scaleX: w / pose.cellWidth, scaleY: h / pose.cellHeight, middle, split };
    });
    rig.addChild(left, right, body); actor.addChild(shadow, rig);
    actor.parts = parts; actor.body = body; actor.left = left; actor.right = right; actor.rig = rig; actor.shadow = shadow; actor.row = -1;
    actor.pose = {}; actor.stride = {};
    return actor;
  }
  const follower = walker(companionFrames, 34, 35);
  const player = walker(playerFrames, 37, 42);
  actors.addChild(follower, player);
  const prints = Array.from({ length: 12 }, () => {
    const print = new Graphics(); print.ellipse(0, 0, 1.1, 0.6).fill(p.dark); print.alpha = 0; print.life = 0; actors.addChild(print); return print;
  });
  return { world, player, follower, frames, ambient, scenery, prints, printIndex: 0, time: 0, width: width * TILE, height: height * TILE };
}

function poseWalker(actor, facing, phase, walking, running, reduced, delta) {
  const row = DIRECTIONS[facing] ?? 0;
  if (row !== actor.row) {
    actor.layout = actor.parts[row];
    [actor.body.texture, actor.left.texture, actor.right.texture] = actor.layout.textures;
    for (const sprite of [actor.body, actor.left, actor.right]) sprite.scale.set(actor.layout.scaleX, actor.layout.scaleY);
    actor.row = row;
  }
  const target = stridePose(walking ? phase : 0, facing, running, reduced, actor.stride);
  const ratio = reduced || walking ? 1 : Math.min(1, delta / 65);
  for (const key in target) actor.pose[key] = (actor.pose[key] || 0) + (target[key] - (actor.pose[key] || 0)) * ratio;
  const p = actor.pose; const layout = actor.layout;
  actor.left.position.set(layout.x + p.leftX, layout.y + layout.split * layout.scaleY + p.leftY);
  actor.right.position.set(layout.x + layout.middle * layout.scaleX + p.rightX, layout.y + layout.split * layout.scaleY + p.rightY);
  actor.body.position.set(layout.x + p.bodyX, layout.y + p.bodyY); actor.body.rotation = p.rotation; actor.zIndex = actor.y;
}

function crossingPose(actor, traversal, progress, reduced, delta) {
  const pose = traversalPose(traversal, progress, actor.crossingPose || (actor.crossingPose = {}));
  actor.position.set(pose.x, pose.y);
  poseWalker(actor, pose.facing, progress * Math.PI * 6, traversal.kind === 'climb' && progress < 1, false, reduced, delta);
  actor.rig.y = reduced ? 0 : -pose.lift;
  actor.zIndex = Math.max(traversal.from.y, traversal.to.y) * TILE + TILE;
  actor.shadow.scale.set(1 - pose.lift / 100, 1 - pose.lift / 80);
  actor.shadow.alpha = 1 - pose.lift / 50;
}

function advanceCrossing(scene, current, reduced, delta) {
  const link = current.traversal;
  if (!scene.crossing || scene.crossing.id !== link.id) {
    scene.crossing = { ...link, elapsed: 0, timeline: {}, followerStart: { x: scene.follower.x, y: scene.follower.y },
      landing: followerTile(link.to.x, link.to.y, current.facing, (x, y) => isAdventureWalkable(current, x, y)) };
  }
  const crossing = scene.crossing; const duration = TRAVERSAL_DURATION_MS[link.kind];
  crossing.elapsed += delta;
  const timeline = crossingTimeline(crossing.elapsed, duration, reduced, crossing.timeline);
  crossingPose(scene.player, link, timeline.player, reduced, delta);
  crossingPose(scene.follower, link, timeline.follower, reduced, delta);
  if (timeline.approach < 1) {
    const ratio = timeline.approach;
    scene.follower.position.set(crossing.followerStart.x + (scene.follower.x - crossing.followerStart.x) * ratio, crossing.followerStart.y + (scene.follower.y - crossing.followerStart.y) * ratio);
    poseWalker(scene.follower, current.facing, ratio * Math.PI, true, false, reduced, delta);
  } else if (timeline.settle > 0) {
    const ratio = timeline.settle;
    scene.follower.x += ((crossing.landing.x + 0.5) * TILE - scene.follower.x) * ratio;
    scene.follower.y += ((crossing.landing.y + 0.95) * TILE - scene.follower.y) * ratio;
    poseWalker(scene.follower, current.facing, ratio * Math.PI, ratio < 1, false, reduced, delta);
  }
  if (!timeline.done) return null;
  scene.targetX = scene.player.x; scene.targetY = scene.player.y;
  scene.distance = scene.travel = scene.moveStart = Math.abs(scene.player.x - scene.follower.x) + Math.abs(scene.player.y - scene.follower.y);
  scene.trail = [{ x: scene.follower.x, y: scene.follower.y, distance: 0 }, { x: scene.player.x, y: scene.player.y, distance: scene.distance }];
  scene.progress = 1; scene.crossing = null; scene.completedTraversal = link;
  return link.id;
}

export default function AdventureScene({ state, motion = {}, onTraversalEnd }) {
  const hostRef = useRef(null); const appRef = useRef(null); const sceneRef = useRef(null); const stateRef = useRef(state);
  const motionRef = useRef(motion); const focusedRef = useRef(true);
  const traversalEndRef = useRef(onTraversalEnd); traversalEndRef.current = onTraversalEnd;
  const [ready, setReady] = useState(false); const [error, setError] = useState(''); const [attempt, setAttempt] = useState(0);
  stateRef.current = state;
  motionRef.current = motion;
  const milestoneKey = JSON.stringify(state.flags);

  useEffect(() => {
    setReady(false);
    let disposed = false; let initialized = false; let observer;
    const app = new Application();
    async function start() {
      try {
        const art = await loadArt();
        if (disposed) return;
        art.forEach(texture => { texture.source.scaleMode = 'nearest'; });
        await app.init({ width: hostRef.current?.clientWidth || 640, height: hostRef.current?.clientHeight || 400, antialias: false, background: '#527c62', resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true });
        initialized = true;
        if (disposed) { app.destroy(true, { children: true }); return; }
        appRef.current = app;
        app.canvas.style.width = '100%'; app.canvas.style.height = '100%'; app.canvas.style.imageRendering = 'pixelated';
        hostRef.current.appendChild(app.canvas);
        const resize = () => {
          if (disposed || !hostRef.current) return;
          app.renderer.resize(Math.max(1, hostRef.current.clientWidth), Math.max(1, hostRef.current.clientHeight));
          app.canvas.style.width = '100%'; app.canvas.style.height = '100%';
        };
        observer = new ResizeObserver(resize); observer.observe(hostRef.current);
        const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        app.ticker.maxFPS = 60;
        app.ticker.add((ticker) => {
          const scene = sceneRef.current;
          if (!scene || motionRef.current.paused || document.hidden || !focusedRef.current) return;
          const current = stateRef.current; const targetX = (current.x + 0.5) * TILE; const targetY = (current.y + 0.95) * TILE;
          const reduced = reducedQuery.matches;
          const delta = Math.min(ticker.deltaMS, 40); const running = Boolean(motionRef.current.running);
          if (current.traversal && current.traversal !== scene.completedTraversal) {
            const completed = advanceCrossing(scene, current, reduced, delta);
            if (completed) traversalEndRef.current?.(completed);
          } else {
            for (const actor of [scene.player, scene.follower]) { actor.rig.y = 0; actor.shadow.scale.set(1); actor.shadow.alpha = 1; }
            if (targetX !== scene.targetX || targetY !== scene.targetY) {
              const distance = Math.abs(targetX - scene.targetX) + Math.abs(targetY - scene.targetY);
              if (distance > TILE) {
                scene.trail = [{ x: targetX, y: targetY, distance: 0 }]; scene.distance = scene.travel = scene.moveStart = 0;
              } else {
                scene.moveStart = scene.travel;
                scene.distance += distance; scene.trail.push({ x: targetX, y: targetY, distance: scene.distance });
              }
              scene.duration = stepDuration(running, terrainAt(current.locationId, Math.floor(scene.targetX / TILE), Math.floor(scene.targetY / TILE)));
              scene.targetX = targetX; scene.targetY = targetY; scene.progress = distance > TILE ? 1 : 0;
            }
            const wasWalking = scene.progress < 1;
            scene.progress = Math.min(1, scene.progress + delta / scene.duration);
            scene.travel = scene.moveStart + (scene.distance - scene.moveStart) * scene.progress;
            sampleTrail(scene.trail, scene.travel, scene.playerPoint);
            scene.player.position.set(scene.playerPoint.x, scene.playerPoint.y);
            poseWalker(scene.player, wasWalking ? scene.playerPoint.facing : current.facing, scene.travel / TILE * Math.PI, wasWalking, running, reduced, delta);
            const followerDistance = Math.max(0, scene.travel - TILE);
            sampleTrail(scene.trail, followerDistance, scene.followerPoint);
            scene.follower.position.set(scene.followerPoint.x, scene.followerPoint.y);
            poseWalker(scene.follower, scene.followerPoint.facing, followerDistance / TILE * Math.PI, wasWalking && followerDistance > 0, running, reduced, delta);
            while (scene.trail.length > 2 && scene.trail[1].distance < followerDistance) scene.trail.shift();
            if (wasWalking && scene.progress === 1 && !reduced) {
              const print = scene.prints[scene.printIndex++ % scene.prints.length];
              const offset = Math.round(scene.distance / TILE) % 2 ? -2 : 2; const horizontal = current.facing === 'left' || current.facing === 'right';
              print.position.set(targetX + (horizontal ? 0 : offset), targetY + 1 + (horizontal ? offset : 0)); print.zIndex = targetY - 2; print.life = 650;
            }
          }
          scene.time += delta;
          for (const print of scene.prints) { print.life = reduced ? 0 : Math.max(0, print.life - delta); print.alpha = print.life / 650 * 0.2; }
          for (const item of scene.ambient) {
            const wave = reduced ? 0 : Math.sin(scene.time / (item.type === 'tree' ? 1100 : 430) + item.phase);
            if (item.type === 'cloud') {
              item.sprite.x = item.originX + (reduced ? 0 : Math.sin(scene.time / 22000 + item.phase) * 32);
              item.sprite.y = item.originY + (reduced ? 0 : Math.sin(scene.time / 29000 + item.phase) * 9);
            } else if (item.type === 'mote') {
              item.sprite.x = item.originX + Math.sin(scene.time / 2600 + item.phase) * 7;
              item.sprite.y = item.originY + Math.sin(scene.time / 3400 + item.phase) * 5;
              item.sprite.alpha = reduced ? 0 : (item.glow ? 0.3 : 0.18) + (Math.sin(scene.time / 1700 + item.phase) + 1) * 0.22;
            } else if (item.type === 'npc') item.sprite.y = item.originY + (reduced ? 0 : Math.sin(scene.time / 900 + item.phase) * 0.45);
            else if (item.type === 'tree') item.sprite.rotation = wave * 0.004;
            else if (item.type === 'water') { item.sprite.x = item.originX + wave * 3; item.sprite.alpha = 0.35 + wave * 0.15; }
            else if (item.type === 'fall') { item.sprite.y = item.originY + (reduced ? 0 : Math.sin(scene.time / 350 + item.phase) * item.range); item.sprite.alpha = reduced ? 0 : 0.6; }
            else item.sprite.alpha = 0.95 + wave * 0.05;
          }
          const zoom = Math.max(1, Math.min(3, motionRef.current.zoom ?? (app.screen.width < 600 ? 2 : 3)));
          scene.world.scale.set(zoom);
          const vw = app.screen.width / zoom; const vh = app.screen.height / zoom;
          const cx = cameraAxis(scene.player.x, scene.width, vw); const cy = cameraAxis(scene.player.y, scene.height, vh);
          const ratio = reduced || scene.cameraX === undefined ? 1 : 1 - Math.exp(-delta / 90);
          scene.cameraX = cameraAxis((scene.cameraX ?? cx) + (cx - (scene.cameraX ?? cx)) * ratio, scene.width, vw);
          scene.cameraY = cameraAxis((scene.cameraY ?? cy) + (cy - (scene.cameraY ?? cy)) * ratio, scene.height, vh);
          scene.world.position.set(Math.round(app.screen.width / 2 - scene.cameraX * zoom), Math.round(app.screen.height / 2 - scene.cameraY * zoom));
          const left = scene.cameraX - vw / 2 - 100; const top = scene.cameraY - vh / 2 - 100;
          for (const { object, bounds } of scene.scenery) object.renderable = bounds.x + bounds.width >= left && bounds.x <= left + vw + 200 && bounds.y + bounds.height >= top && bounds.y <= top + vh + 200;
        });
        setError(''); setReady(true);
      } catch (err) { if (!disposed) setError(err.message || 'The map artwork could not load.'); }
    }
    start();
    return () => {
      disposed = true; observer?.disconnect();
      if (initialized && !app.renderer?.destroyed) app.destroy(true, { children: true });
      sceneRef.current?.frames.forEach((texture) => texture.destroy(false));
      sceneRef.current = null; appRef.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    if (!ready || !appRef.current) return;
    let cancelled = false;
    loadArt().then((art) => {
      if (cancelled || !appRef.current) return;
      const old = sceneRef.current;
      if (old) { appRef.current.stage.removeChild(old.world); old.world.destroy({ children: true }); old.frames.forEach((texture) => texture.destroy(false)); }
      const scene = drawWorld(stateRef.current, ...art);
      appRef.current.renderer.background.color = ADVENTURE_REGIONS[stateRef.current.locationId].outdoor === false ? '#302d2c' : '#527c62';
      scene.player.position.set((stateRef.current.x + 0.5) * TILE, (stateRef.current.y + 0.95) * TILE);
      const arrival = followerTile(stateRef.current.x, stateRef.current.y, stateRef.current.facing, (x, y) => isAdventureWalkable(stateRef.current, x, y));
      scene.follower.position.set((arrival.x + 0.5) * TILE, (arrival.y + 0.95) * TILE);
      scene.targetX = scene.player.x; scene.targetY = scene.player.y;
      scene.distance = scene.travel = scene.moveStart = Math.abs(scene.player.x - scene.follower.x) + Math.abs(scene.player.y - scene.follower.y); scene.progress = 1; scene.duration = WALK_STEP_MS;
      scene.trail = [{ x: scene.follower.x, y: scene.follower.y, distance: 0 }, { x: scene.player.x, y: scene.player.y, distance: scene.distance }]; scene.followerPoint = {}; scene.playerPoint = {};
      scene.locationId = stateRef.current.locationId;
      if (old?.locationId === scene.locationId) {
        for (const key of ['targetX', 'targetY', 'moveStart', 'distance', 'travel', 'progress', 'duration', 'trail', 'cameraX', 'cameraY']) scene[key] = old[key];
        sampleTrail(scene.trail, scene.travel, scene.playerPoint); scene.player.position.set(scene.playerPoint.x, scene.playerPoint.y);
        sampleTrail(scene.trail, Math.max(0, scene.travel - TILE), scene.followerPoint); scene.follower.position.set(scene.followerPoint.x, scene.followerPoint.y);
      }
      poseWalker(scene.player, stateRef.current.facing, 0, false, false, true, 0);
      poseWalker(scene.follower, stateRef.current.facing, 0, false, false, true, 0);
      const zoom = Math.max(1, Math.min(3, motionRef.current.zoom ?? (appRef.current.screen.width < 600 ? 2 : 3)));
      scene.world.scale.set(zoom);
      scene.cameraX = cameraAxis(scene.player.x, scene.width, appRef.current.screen.width / zoom);
      scene.cameraY = cameraAxis(scene.player.y, scene.height, appRef.current.screen.height / zoom);
      scene.world.position.set(Math.round(appRef.current.screen.width / 2 - scene.cameraX * zoom), Math.round(appRef.current.screen.height / 2 - scene.cameraY * zoom));
      sceneRef.current = scene; appRef.current.stage.addChild(scene.world);
    });
    return () => { cancelled = true; };
  }, [ready, state.locationId, state.activeId, milestoneKey]);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden || motionRef.current.paused || !focusedRef.current) appRef.current?.ticker.stop(); else appRef.current?.ticker.start(); };
    const onBlur = () => { focusedRef.current = false; appRef.current?.ticker.stop(); };
    const onFocus = () => { focusedRef.current = true; onVisibility(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur); window.addEventListener('focus', onFocus);
    return () => { document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus); };
  }, []);

  useEffect(() => {
    if (motion.paused || document.hidden || !focusedRef.current) appRef.current?.ticker.stop(); else appRef.current?.ticker.start();
  }, [motion.paused, ready]);

  return <div className="journey-world-canvas" ref={hostRef} role="group" tabIndex={-1} aria-label={`${ADVENTURE_REGIONS[state.locationId].name}. Trainer at column ${state.x}, row ${state.y}. Use movement controls and interact with nearby landmarks.`}>
    {!ready && <div className="journey-scene-loading" role={error ? 'alert' : 'status'}>{error ? 'The map artwork could not be loaded. Check your connection, then retry.' : 'Unfolding the map…'}{error && <><button className="journey-button" onClick={() => { setReady(false); setAttempt((value) => value + 1); }}>Retry artwork</button><button className="journey-button" onClick={() => window.location.reload()}>Reload Cogimon</button></>}</div>}
  </div>;
}
