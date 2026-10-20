import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import { bakeAllTextures } from '../stage/bakeTextures';
import { HERO_CREATURE } from '../components/creatures/pixelData';
import { REGIONS, TILE, WORLD_SIZE } from '../../../shared/rpg/world.js';

const DESKTOP = { width: 640, height: 384 };
const PORTRAIT = { width: 384, height: 544 };

function block(graphics, x, y, width, height, color) {
  graphics.rect(x, y, width, height).fill(color);
}

function drawRegion(region, state, textures) {
  const scene = new Container();
  const ground = new Graphics();
  scene.addChild(ground);

  for (let y = 0; y < WORLD_SIZE.height; y++) {
    for (let x = 0; x < WORLD_SIZE.width; x++) {
      const px = x * TILE;
      const py = y * TILE;
      const edge = x === 0 || y === 0 || x === WORLD_SIZE.width - 1 || y === WORLD_SIZE.height - 1;
      const path = region.path.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
      const color = edge ? region.palette.edge : path ? region.palette.path : (x + y) % 2 ? region.palette.ground : region.palette.alt;
      block(ground, px, py, TILE, TILE, color);
      if (!edge && !path && (x * 7 + y * 11) % 13 === 0) {
        block(ground, px + 5, py + 21, 4, 3, region.palette.wall);
        block(ground, px + 20, py + 16, 3, 5, region.palette.wall);
      }
      if (path && (x + y * 5) % 7 === 0) block(ground, px + 12, py + 6, 3, 2, region.palette.glow);
    }
  }

  for (const r of region.solid) {
    const px = r.x * TILE;
    const py = r.y * TILE;
    block(ground, px + 3, py + 9, r.w * TILE - 6, r.h * TILE - 9, region.palette.edge);
    block(ground, px, py, r.w * TILE, r.h * TILE - 5, region.palette.wall);
    block(ground, px + 4, py + 4, r.w * TILE - 8, 4, region.palette.alt);
    for (let i = 0; i < r.w; i++) {
      block(ground, px + i * TILE + 10, py + r.h * TILE - 16, 12, 8, region.palette.glow);
    }
  }

  for (const object of region.objects) {
    if (object.id === 'shard' && state.flags.shardFound) continue;
    if (object.id === 'static' && state.flags.wispDefeated) continue;
    const x = object.x * TILE;
    const y = object.y * TILE;
    const shape = new Graphics();
    if (object.type === 'npc') {
      block(shape, x + 8, y + 13, 16, 14, object.color);
      block(shape, x + 10, y + 5, 12, 12, '#f4dcc1');
      block(shape, x + 10, y + 4, 12, 4, object.color);
      block(shape, x + 12, y + 13, 2, 2, '#17212e');
      block(shape, x + 18, y + 13, 2, 2, '#17212e');
    } else if (object.type === 'exit' || object.type === 'arena') {
      block(shape, x + 2, y + 7, 28, 25, region.palette.edge);
      block(shape, x + 5, y + 10, 22, 22, object.color);
      block(shape, x + 9, y + 15, 14, 17, region.palette.edge);
      block(shape, x + 13, y + 24, 6, 3, object.color);
    } else if (object.type === 'enemy') {
      block(shape, x + 6, y + 9, 20, 19, object.color);
      block(shape, x + 9, y + 5, 14, 6, '#ffd8ef');
      block(shape, x + 11, y + 16, 3, 3, '#161326');
      block(shape, x + 19, y + 16, 3, 3, '#161326');
    } else {
      block(shape, x + 9, y + 8, 14, 20, object.color);
      block(shape, x + 12, y + 2, 8, 7, '#fff6d0');
      block(shape, x + 12, y + 14, 8, 5, region.palette.edge);
      if (object.id === 'lantern' && state.flags.questComplete) {
        block(shape, x + 4, y + 3, 3, 23, object.color);
        block(shape, x + 25, y + 3, 3, 23, object.color);
      }
    }
    scene.addChild(shape);
  }

  const player = new Sprite(textures.get(HERO_CREATURE[state.heroId]));
  player.anchor.set(0.5, 0.9);
  player.scale.set(0.38);
  scene.addChild(player);

  const label = new Text({
    text: region.name.toUpperCase(),
    style: new TextStyle({ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 12, fill: region.palette.glow }),
  });
  label.x = 14;
  label.y = 10;
  scene.addChild(label);
  return { scene, player };
}

export default function WorldScene({ state }) {
  const { locationId, heroId, x, y } = state;
  const { shardFound, wispDefeated, questComplete } = state.flags;
  const hostRef = useRef(null);
  const appRef = useRef(null);
  const worldRef = useRef(null);
  const playerRef = useRef(null);
  const texturesRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [portrait, setPortrait] = useState(() => window.matchMedia('(max-width: 600px)').matches);

  useEffect(() => {
    const onResize = () => setPortrait(window.matchMedia('(max-width: 600px)').matches);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let disposed = false;
    const app = new Application();
    async function start() {
      try {
        const size = window.matchMedia('(max-width: 600px)').matches ? PORTRAIT : DESKTOP;
        await app.init({ width: size.width, height: size.height, antialias: false, background: '#091722',
          resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true });
        if (disposed) { app.destroy(true, { children: true }); return; }
        appRef.current = app;
        texturesRef.current = bakeAllTextures();
        app.canvas.style.width = '100%';
        app.canvas.style.height = '100%';
        app.canvas.style.display = 'block';
        app.canvas.style.imageRendering = 'pixelated';
        hostRef.current?.appendChild(app.canvas);
        setReady(true);
      } catch (err) {
        if (!disposed) setError(err.message || 'The world could not load.');
      }
    }
    start();
    return () => {
      disposed = true;
      setReady(false);
      appRef.current?.destroy(true, { children: true });
      appRef.current = null;
      worldRef.current = null;
      playerRef.current = null;
      texturesRef.current?.forEach((texture) => texture.destroy(true));
      texturesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !appRef.current) return;
    const size = portrait ? PORTRAIT : DESKTOP;
    appRef.current.renderer.resize(size.width, size.height);
    // Pixi autoDensity assigns a fixed CSS size on resize. Let the canvas fill
    // the responsive frame; only its backing resolution is fixed to pixel units.
    appRef.current.canvas.style.width = '100%';
    appRef.current.canvas.style.height = '100%';
  }, [ready, portrait]);

  useEffect(() => {
    const app = appRef.current;
    if (!ready || !app || !texturesRef.current) return;
    if (worldRef.current && !worldRef.current.destroyed) {
      app.stage.removeChild(worldRef.current);
      worldRef.current.destroy({ children: true });
    }
    const { scene, player } = drawRegion(REGIONS[locationId], {
      heroId, flags: { shardFound, wispDefeated, questComplete },
    }, texturesRef.current);
    app.stage.addChild(scene);
    worldRef.current = scene;
    playerRef.current = player;
    // The scene is redrawn for region and milestone changes, never per animation frame.
  }, [ready, locationId, heroId, shardFound, wispDefeated, questComplete]);

  useEffect(() => {
    const scene = worldRef.current;
    const player = playerRef.current;
    if (!scene || !player || scene.destroyed || player.destroyed || !appRef.current) return;
    player.x = (x + 0.5) * TILE;
    player.y = (y + 0.9) * TILE;
    const zoom = portrait ? 2 : 1.3;
    scene.scale.set(zoom);
    const viewW = appRef.current.screen.width / zoom;
    const viewH = appRef.current.screen.height / zoom;
    const centerX = Math.max(viewW / 2, Math.min(WORLD_SIZE.width * TILE - viewW / 2, player.x));
    const centerY = Math.max(viewH / 2, Math.min(WORLD_SIZE.height * TILE - viewH / 2, player.y));
    scene.pivot.set(centerX, centerY);
    scene.position.set(appRef.current.screen.width / 2, appRef.current.screen.height / 2);
  }, [ready, portrait, x, y, locationId, shardFound, wispDefeated, questComplete]);

  useEffect(() => {
    const onVisibility = () => {
      if (!appRef.current) return;
      if (document.hidden) appRef.current.ticker.stop();
      else appRef.current.ticker.start();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return <div ref={hostRef} className="frontier-canvas" role="img"
    aria-label={`${REGIONS[state.locationId].name} pixel-art map. Use arrow keys or on-screen controls to move.`}>
    {!ready && <div className="frontier-loading">{error || 'Loading the frontier…'}</div>}
  </div>;
}
