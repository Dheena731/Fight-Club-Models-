import { useEffect, useRef, useState } from 'react';
import { Application, Assets, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { ADVENTURE_REGIONS } from '../../../shared/rpg/adventureContent.js';
import { regionObjects } from '../../../shared/rpg/adventure.js';

const TILE = 24;
const DIRECTIONS = { south: 0, down: 0, west: 1, left: 1, east: 2, right: 2, north: 3, up: 3 };
const COLUMNS = { emberquill: 1, kitewhisk: 2, duplet: 3 };
let assetsPromise;

function loadArt() {
  if (!assetsPromise) assetsPromise = Promise.all([
    Assets.load('/assets/frontier/field-atlas.png'),
    Assets.load('/assets/frontier/environment-atlas.png'),
    Assets.load('/assets/frontier/portraits/mossback.png'),
    Assets.load('/assets/frontier/npc-atlas.png'),
    Assets.load('/assets/frontier/enemy-atlas.png'),
  ]).catch((error) => { assetsPromise = null; throw error; });
  return assetsPromise;
}

function frame(atlas, column, row, columns, rows) {
  const x = Math.round(column * atlas.width / columns); const y = Math.round(row * atlas.height / rows);
  const right = Math.round((column + 1) * atlas.width / columns); const bottom = Math.round((row + 1) * atlas.height / rows);
  return new Texture({ source: atlas.source, frame: new Rectangle(x, y, right - x, bottom - y) });
}

function rect(graphics, x, y, w, h, color) { graphics.rect(x, y, w, h).fill(color); }

function drawWorld(state, fieldAtlas, environmentAtlas, mossbackArt, npcAtlas, enemyAtlas) {
  const region = ADVENTURE_REGIONS[state.locationId];
  const width = region.width || 20; const height = region.height || 12;
  const forest = state.locationId === 'grove'; const archive = state.locationId === 'archive';
  const p = archive ? { grass: '#7b8f91', grass2: '#829697', path: '#c0b8a2', dark: '#526a70', light: '#b5c8b8' }
    : forest ? { grass: '#65986a', grass2: '#6e9f70', path: '#c9b17a', dark: '#38775b', light: '#a4c77b' }
      : { grass: '#8ab773', grass2: '#92bb77', path: '#dfbe7d', dark: '#5e945e', light: '#c1d895' };
  const world = new Container();
  const ground = new Graphics();
  world.addChild(ground);
  const actors = new Container(); actors.sortableChildren = true;
  world.addChild(actors);
  const frames = [];
  const getFrame = (...args) => { const texture = frame(...args); frames.push(texture); return texture; };
  const onPath = (x, y) => region.path?.some((r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const edge = x === 0 || y === 0 || x === width - 1 || y === height - 1;
    const path = onPath(x, y);
    const px = x * TILE; const py = y * TILE;
    rect(ground, px, py, TILE, TILE, edge ? p.dark : path ? p.path : (x + y) % 3 ? p.grass : p.grass2);
    if (!edge && !path) {
      if ((x * 13 + y * 7) % 5 === 0) {
        rect(ground, px + 5, py + 17, 2, 3, p.dark); rect(ground, px + 8, py + 15, 2, 5, p.dark);
        rect(ground, px + 7, py + 14, 2, 2, p.light);
      }
      if ((x * 7 + y * 13) % 23 === 0) {
        rect(ground, px + 15, py + 8, 3, 3, '#f7e6a2'); rect(ground, px + 16, py + 7, 1, 5, '#f8f4e3');
        rect(ground, px + 15, py + 12, 1, 3, p.dark);
      }
    } else if (path && (x + y * 3) % 4 === 0) {
      rect(ground, px + 4, py + 10, 4, 2, '#c59f68'); rect(ground, px + 15, py + 18, 3, 2, '#edd29b');
    }
  }

  function prop(column, row, x, y, w, h) {
    const sprite = new Sprite(getFrame(environmentAtlas, column, row, 3, 2));
    sprite.anchor.set(0.5, 1); sprite.position.set(x, y); sprite.width = w; sprite.height = h; sprite.zIndex = y;
    actors.addChild(sprite); return sprite;
  }
  for (const r of region.solid || []) {
    const x = (r.x + r.w / 2) * TILE; const y = (r.y + r.h) * TILE;
    if (r.w >= 4 && !forest) prop(archive ? 2 : r.x > width / 2 ? 1 : 0, 0, x, y + 6, r.w * TILE + 20, Math.max(90, r.h * TILE + 55));
    else {
      for (let tx = r.x; tx < r.x + r.w; tx += 2) prop(0, 1, (tx + 1) * TILE, y + 8, 77, 92);
    }
  }
  // The border is collidable in the rules; trees give that boundary a natural silhouette.
  for (let x = 0; x < width; x += 2) {
    prop(0, 1, (x + 0.5) * TILE, TILE * 1.5, 70, 82);
    prop(0, 1, (x + 0.5) * TILE, height * TILE + 25, 70, 82);
  }
  for (let y = 2; y < height - 1; y += 2) {
    prop(0, 1, 0, (y + 1) * TILE, 68, 82); prop(0, 1, width * TILE, (y + 1) * TILE, 68, 82);
  }

  for (const object of regionObjects(state)) {
    if (object.hiddenFlag && state.flags[object.hiddenFlag]) continue;
    if (object.id === 'shard' && state.flags.shardFound) continue;
    if ((object.id === 'static' || object.id === 'wisp') && state.flags.wispDefeated) continue;
    const x = (object.x + 0.5) * TILE; const y = (object.y + 1) * TILE;
    if (object.type === 'exit') { prop(2, 1, x, y + 8, 55, 65); continue; }
    if (object.type === 'landmark' || /lantern|relay/.test(object.id)) {
      const lantern = prop(1, 1, x, y, 37, 70);
      if (object.id === 'lantern' && !state.flags.questComplete || object.id === 'relay' && !state.flags.relayRestored) lantern.tint = '#667c87';
      continue;
    }
    if (['npc', 'rest', 'board', 'arena', 'sign', 'practice', 'circuit', 'lore'].includes(object.type)) {
      if (object.type === 'npc') {
        const npc = new Sprite(getFrame(npcAtlas, object.id === 'guide' ? 0 : object.id === 'ranger' ? 1 : 2, 0, 3, 1)); npc.anchor.set(0.5, 0.91); npc.width = 44; npc.height = 44; npc.position.set(x, y); npc.zIndex = y;
        actors.addChild(npc);
      } else {
        const sign = new Graphics(); rect(sign, -2, -15, 4, 17, '#755141'); rect(sign, -13, -28, 26, 18, object.type === 'rest' ? '#e8b1aa' : '#f6e0aa');
        rect(sign, -10, -25, 20, 2, '#976f4f'); rect(sign, -8, -20, 16, 2, '#976f4f'); sign.position.set(x, y); sign.zIndex = y; actors.addChild(sign);
      }
    } else {
      if (object.type === 'enemy' || object.type === 'boss' || object.encounterId) {
        const enemy = new Sprite(getFrame(enemyAtlas, object.encounterId === 'archive-warden' ? 1 : 0, 0, 2, 1));
        enemy.anchor.set(0.5, 0.9); enemy.width = 44; enemy.height = 44; enemy.position.set(x, y); enemy.zIndex = y; actors.addChild(enemy);
      } else {
        const icon = new Graphics();
        rect(icon, -4, -21, 8, 15, '#93d7df'); rect(icon, -7, -18, 14, 8, '#b6edf0'); rect(icon, -2, -24, 4, 3, '#fdf1bd');
        icon.position.set(x, y); icon.zIndex = y; actors.addChild(icon);
      }
    }
    const marker = new Graphics(); marker.poly([-3, 0, 3, 0, 0, 4]).fill('#ffe298'); marker.position.set(x, y - 39); marker.zIndex = y + 1; actors.addChild(marker);
  }

  const playerFrames = [0, 1, 2, 3].map((row) => getFrame(fieldAtlas, 0, row, 4, 4));
  const companionFrames = [0, 1, 2, 3].map((row) => state.activeId === 'mossback'
    ? getFrame(mossbackArt, 0, 0, 1, 1) : getFrame(fieldAtlas, COLUMNS[state.activeId] || 1, row, 4, 4));
  const follower = new Sprite(companionFrames[0]); follower.anchor.set(0.5, 0.88); follower.width = 34; follower.height = 35;
  const player = new Sprite(playerFrames[0]); player.anchor.set(0.5, 0.88); player.width = 37; player.height = 42;
  actors.addChild(follower, player);
  return { world, player, follower, playerFrames, companionFrames, frames, width: width * TILE, height: height * TILE };
}

export default function AdventureScene({ state }) {
  const hostRef = useRef(null); const appRef = useRef(null); const sceneRef = useRef(null); const stateRef = useRef(state);
  const [ready, setReady] = useState(false); const [error, setError] = useState(''); const [attempt, setAttempt] = useState(0);
  stateRef.current = state;
  const milestoneKey = JSON.stringify(state.flags);

  useEffect(() => {
    let disposed = false; let initialized = false; let observer;
    const app = new Application();
    async function start() {
      try {
        const [field, environment] = await loadArt();
        if (disposed) return;
        field.source.scaleMode = 'nearest'; environment.source.scaleMode = 'nearest';
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
          if (!scene) return;
          const current = stateRef.current; const targetX = (current.x + 0.5) * TILE; const targetY = (current.y + 0.95) * TILE;
          const reduced = reducedQuery.matches;
          const ratio = reduced ? 1 : Math.min(1, ticker.deltaMS / 55);
          const previousX = scene.player.x; const previousY = scene.player.y;
          scene.player.x += (targetX - scene.player.x) * ratio; scene.player.y += (targetY - scene.player.y) * ratio;
          const walking = Math.abs(targetX - scene.player.x) + Math.abs(targetY - scene.player.y) > 0.5;
          const row = DIRECTIONS[current.facing] ?? 0;
          scene.player.texture = scene.playerFrames[row]; scene.player.zIndex = scene.player.y;
          if (walking) {
            scene.follower.x += (previousX - scene.follower.x) * Math.min(1, ticker.deltaMS / 100);
            scene.follower.y += (previousY - scene.follower.y) * Math.min(1, ticker.deltaMS / 100);
          }
          scene.follower.texture = scene.companionFrames[row]; scene.follower.zIndex = scene.follower.y;
          const zoom = app.screen.width < 600 ? 2 : 3;
          scene.world.scale.set(zoom);
          const vw = app.screen.width / zoom; const vh = app.screen.height / zoom;
          const cx = Math.max(vw / 2, Math.min(scene.width - vw / 2, scene.player.x));
          const cy = Math.max(vh / 2, Math.min(scene.height - vh / 2, scene.player.y));
          scene.world.position.set(Math.round(app.screen.width / 2 - cx * zoom), Math.round(app.screen.height / 2 - cy * zoom));
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
    loadArt().then(([field, environment, mossbackArt, npcAtlas, enemyAtlas]) => {
      if (cancelled || !appRef.current) return;
      const old = sceneRef.current;
      if (old) { appRef.current.stage.removeChild(old.world); old.world.destroy({ children: true }); old.frames.forEach((texture) => texture.destroy(false)); }
      const scene = drawWorld(stateRef.current, field, environment, mossbackArt, npcAtlas, enemyAtlas);
      scene.player.position.set((stateRef.current.x + 0.5) * TILE, (stateRef.current.y + 0.95) * TILE);
      scene.follower.position.set(scene.player.x, scene.player.y + TILE);
      sceneRef.current = scene; appRef.current.stage.addChild(scene.world);
    });
    return () => { cancelled = true; };
  }, [ready, state.locationId, state.activeId, milestoneKey]);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) appRef.current?.ticker.stop(); else appRef.current?.ticker.start(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return <div className="journey-world-canvas" ref={hostRef} role="img" aria-label={`${ADVENTURE_REGIONS[state.locationId].name}. Trainer at column ${state.x}, row ${state.y}. Use movement controls and interact with nearby landmarks.`}>
    {!ready && <div className="journey-scene-loading" role="status">{error || 'Unfolding the map…'}{error && <button className="journey-button" onClick={() => { setReady(false); setAttempt((value) => value + 1); }}>Retry artwork</button>}</div>}
  </div>;
}
