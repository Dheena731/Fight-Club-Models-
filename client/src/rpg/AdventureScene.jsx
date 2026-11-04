import { useEffect, useRef, useState } from 'react';
import { Application, Assets, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { ADVENTURE_REGIONS } from '../../../shared/rpg/adventureContent.js';
import { isAdventureWalkable, regionObjects } from '../../../shared/rpg/adventure.js';
import { WALK_STEP_MS, RUN_STEP_MS } from '../lib/adventureMovement.js';
import { cameraAxis, fieldPoseBounds, followerTile, sampleTrail, stridePose } from '../lib/adventureAnimation.js';

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
  const forest = state.locationId === 'grove'; const archive = state.locationId === 'archive'; const ridge = region.biome === 'sunward';
  const p = region.fieldPalette || (archive ? { grass: '#7b8f91', grass2: '#829697', path: '#c0b8a2', dark: '#526a70', light: '#b5c8b8' }
    : forest ? { grass: '#65986a', grass2: '#6e9f70', path: '#c9b17a', dark: '#38775b', light: '#a4c77b' }
      : { grass: '#8ab773', grass2: '#92bb77', path: '#dfbe7d', dark: '#5e945e', light: '#c1d895' });
  const world = new Container();
  const ground = new Graphics();
  world.addChild(ground);
  const actors = new Container(); actors.sortableChildren = true;
  world.addChild(actors);
  const frames = []; const ambient = [];
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
    actors.addChild(sprite);
    if (column === 0 && row === 1 && ambient.length < 14) ambient.push({ sprite, type: 'tree', phase: x * 0.03 + y * 0.07 });
    return sprite;
  }
  function crag(x, y, w, h) {
    const rock = new Graphics();
    rect(rock, 0, 0, w, h, '#796f66'); rect(rock, 0, 0, w, 5, p.light);
    rect(rock, 0, 5, w, 5, '#a79a7a'); rect(rock, 0, h - 6, w, 6, '#5d5b53');
    for (let bx = 12; bx < w; bx += 26) rect(rock, bx, 11 + bx % 13, 2, Math.max(3, h - 23), '#625f54');
    rock.position.set(x, y); rock.zIndex = y + h; actors.addChild(rock);
  }
  for (const r of region.solid || []) {
    const x = (r.x + r.w / 2) * TILE; const y = (r.y + r.h) * TILE;
    if (ridge && r.kind !== 'trees') crag(r.x * TILE, r.y * TILE - 10, r.w * TILE, r.h * TILE + 10);
    else if (r.w >= 4 && !forest) prop(archive ? 2 : r.x > width / 2 ? 1 : 0, 0, x, y + 6, r.w * TILE + 20, Math.max(90, r.h * TILE + 55));
    else {
      for (let tx = r.x; tx < r.x + r.w; tx += 2) prop(0, 1, (tx + 1) * TILE, y + 8, 77, 92);
    }
  }
  // The border is collidable; the silhouette makes the same boundary visible.
  for (let x = 0; x < width; x += 2) {
    if (ridge) { crag(x * TILE, 0, TILE * 2, TILE); crag(x * TILE, (height - 1) * TILE, TILE * 2, TILE); }
    else { prop(0, 1, (x + 0.5) * TILE, TILE * 1.5, 70, 82); prop(0, 1, (x + 0.5) * TILE, height * TILE + 25, 70, 82); }
  }
  for (let y = 2; y < height - 1; y += 2) {
    if (ridge) { crag(0, y * TILE, TILE, TILE * 2); crag((width - 1) * TILE, y * TILE, TILE, TILE * 2); }
    else { prop(0, 1, 0, (y + 1) * TILE, 68, 82); prop(0, 1, width * TILE, (y + 1) * TILE, 68, 82); }
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
      else ambient.push({ sprite: lantern, type: 'lantern', phase: x * 0.1 });
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

  function fieldPose(column, row) {
    const bounds = fieldPoseBounds(column, row, fieldAtlas.width, fieldAtlas.height);
    const texture = new Texture({ source: fieldAtlas.source, frame: new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height) }); frames.push(texture);
    return { ...bounds, texture };
  }
  const playerFrames = [0, 1, 2, 3].map((row) => fieldPose(0, row));
  const companionFrames = [0, 1, 2, 3].map((row) => state.activeId === 'mossback'
    ? { texture: getFrame(mossbackArt, 0, 0, 1, 1), offsetX: 0, baseline: mossbackArt.height * 0.94, cellWidth: mossbackArt.width, cellHeight: mossbackArt.height }
    : fieldPose(COLUMNS[state.activeId] || 1, row));
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
    actor.parts = parts; actor.body = body; actor.left = left; actor.right = right; actor.row = -1;
    actor.pose = {}; actor.stride = {};
    return actor;
  }
  const follower = walker(companionFrames, 34, 35);
  const player = walker(playerFrames, 37, 42);
  actors.addChild(follower, player);
  const prints = Array.from({ length: 12 }, () => {
    const print = new Graphics(); print.ellipse(0, 0, 1.1, 0.6).fill(p.dark); print.alpha = 0; print.life = 0; actors.addChild(print); return print;
  });
  return { world, player, follower, frames, ambient, prints, printIndex: 0, time: 0, width: width * TILE, height: height * TILE };
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

export default function AdventureScene({ state, motion = {} }) {
  const hostRef = useRef(null); const appRef = useRef(null); const sceneRef = useRef(null); const stateRef = useRef(state);
  const motionRef = useRef(motion); const focusedRef = useRef(true);
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
          if (targetX !== scene.targetX || targetY !== scene.targetY) {
            const distance = Math.abs(targetX - scene.targetX) + Math.abs(targetY - scene.targetY);
            if (distance > TILE) {
              scene.trail = [{ x: targetX, y: targetY, distance: 0 }]; scene.distance = scene.travel = scene.moveStart = 0;
            } else {
              scene.moveStart = scene.travel;
              scene.distance += distance; scene.trail.push({ x: targetX, y: targetY, distance: scene.distance });
            }
            scene.targetX = targetX; scene.targetY = targetY; scene.progress = distance > TILE ? 1 : 0; scene.duration = running ? RUN_STEP_MS : WALK_STEP_MS;
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
          scene.time += delta;
          for (const print of scene.prints) { print.life = reduced ? 0 : Math.max(0, print.life - delta); print.alpha = print.life / 650 * 0.2; }
          for (const item of scene.ambient) {
            const wave = reduced ? 0 : Math.sin(scene.time / (item.type === 'tree' ? 1100 : 430) + item.phase);
            if (item.type === 'tree') item.sprite.rotation = wave * 0.004;
            else item.sprite.alpha = 0.95 + wave * 0.05;
          }
          const zoom = app.screen.width < 600 ? 2 : 3;
          scene.world.scale.set(zoom);
          const vw = app.screen.width / zoom; const vh = app.screen.height / zoom;
          const cx = cameraAxis(scene.player.x, scene.width, vw); const cy = cameraAxis(scene.player.y, scene.height, vh);
          const ratio = reduced || scene.cameraX === undefined ? 1 : 1 - Math.exp(-delta / 90);
          scene.cameraX = cameraAxis((scene.cameraX ?? cx) + (cx - (scene.cameraX ?? cx)) * ratio, scene.width, vw);
          scene.cameraY = cameraAxis((scene.cameraY ?? cy) + (cy - (scene.cameraY ?? cy)) * ratio, scene.height, vh);
          scene.world.position.set(Math.round(app.screen.width / 2 - scene.cameraX * zoom), Math.round(app.screen.height / 2 - scene.cameraY * zoom));
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
      const zoom = appRef.current.screen.width < 600 ? 2 : 3;
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

  return <div className="journey-world-canvas" ref={hostRef} role="img" aria-label={`${ADVENTURE_REGIONS[state.locationId].name}. Trainer at column ${state.x}, row ${state.y}. Use movement controls and interact with nearby landmarks.`}>
    {!ready && <div className="journey-scene-loading" role="status">{error || 'Unfolding the map…'}{error && <button className="journey-button" onClick={() => { setReady(false); setAttempt((value) => value + 1); }}>Retry artwork</button>}</div>}
  </div>;
}
