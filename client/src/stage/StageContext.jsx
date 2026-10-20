import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { Application, Container, Sprite, Text, TextStyle } from 'pixi.js';
import { LOGICAL_W, LOGICAL_H, FLOOR_Y, FIGHTER_A_X, FIGHTER_B_X, SPRITE_SCALE } from './constants';
import { bakeAllTextures } from './bakeTextures';
import { FIGHTER_CREATURE, PROVIDER_CREATURE } from '../components/creatures/pixelData';
import { useGameState, PHASE } from '../game/GameContext';

const StageCtx = createContext(null);

const CRIT_LINES = ['SAVAGE!', 'BRUTAL!', 'ROASTED!', 'FLAWLESS!'];
const CRIT_DAMAGE = 22;

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Owns the Pixi Application for the session. Init once during BOOT.
 * Fighters + damage floats live on the Pixi stage; DOM overlay reads anchors.
 */
export function StageProvider({ children }) {
  const { phase } = useGameState();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [anchors, setAnchors] = useState({
    a: { head: { x: FIGHTER_A_X, y: FLOOR_Y - 100 }, chest: { x: FIGHTER_A_X, y: FLOOR_Y - 50 }, feet: { x: FIGHTER_A_X, y: FLOOR_Y } },
    b: { head: { x: FIGHTER_B_X, y: FLOOR_Y - 100 }, chest: { x: FIGHTER_B_X, y: FLOOR_Y - 50 }, feet: { x: FIGHTER_B_X, y: FLOOR_Y } },
  });
  const [layout, setLayout] = useState({ scale: 1, offsetX: 0, offsetY: 0 });

  const appRef = useRef(null);
  const initPromiseRef = useRef(null);
  const texturesRef = useRef(null);
  const fightersRef = useRef({ a: null, b: null });
  const fxLayerRef = useRef(null);
  const mountElRef = useRef(null);
  const animRef = useRef({ a: { state: 'idle', t: 0, baseX: FIGHTER_A_X }, b: { state: 'idle', t: 0, baseX: FIGHTER_B_X } });
  const dmgIdRef = useRef(0);
  const anchorAccRef = useRef(0);
  const lastAnchorsRef = useRef(null);

  const init = useCallback(async () => {
    if (appRef.current) {
      setReady(true);
      return;
    }
    if (initPromiseRef.current) return initPromiseRef.current;
    const pending = (async () => {
    try {
      const app = new Application();
      await app.init({
        width: LOGICAL_W,
        height: LOGICAL_H,
        background: '#0a0a0f',
        antialias: false,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      texturesRef.current = bakeAllTextures();

      const world = new Container();
      app.stage.addChild(world);

      // Ambient glow placeholders (simple rects behind fighters)
      const floor = new Container();
      world.addChild(floor);

      const fighterLayer = new Container();
      world.addChild(fighterLayer);

      const fxLayer = new Container();
      world.addChild(fxLayer);
      fxLayerRef.current = fxLayer;

      fightersRef.current = { a: null, b: null, layer: fighterLayer };

      // Ticker: idle bob + attack/hurt tweens + anchor publish
      const reduced = prefersReducedMotion();
      app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        const nextAnchors = { a: null, b: null };

        for (const side of ['a', 'b']) {
          const spr = fightersRef.current[side];
          const anim = animRef.current[side];
          if (!spr || !anim) continue;

          anim.t += dt;
          const flip = side === 'b' ? -1 : 1;
          let x = anim.baseX;
          let y = FLOOR_Y;
          let rot = 0;
          let bright = 1;
          let scaleX = SPRITE_SCALE * flip;
          let scaleY = SPRITE_SCALE;
          let alpha = 1;

          if (anim.state === 'idle' && !reduced) {
            y = FLOOR_Y + Math.sin(anim.t * (Math.PI * 2) / 1.8) * -6;
          } else if (anim.state === 'attack') {
            const p = Math.min(1, anim.t / 0.42);
            if (p < 0.28) {
              const k = p / 0.28;
              x = anim.baseX + flip * -28 * k;
              scaleX = SPRITE_SCALE * flip * (1 + 0.15 * k);
            } else {
              const k = (p - 0.28) / 0.72;
              x = anim.baseX + flip * -28 * (1 - k);
              scaleX = SPRITE_SCALE * flip * (1.15 - 0.15 * k);
              if (p >= 1) {
                anim.state = 'idle';
                anim.t = 0;
              }
            }
          } else if (anim.state === 'hurt') {
            const p = Math.min(1, anim.t / 0.35);
            const shake = Math.sin(p * Math.PI * 6) * (1 - p) * 10 * -flip;
            x = anim.baseX + shake;
            bright = p < 0.4 ? 3 : 1;
            if (p >= 1) {
              anim.state = 'idle';
              anim.t = 0;
            }
          } else if (anim.state === 'ko') {
            const p = Math.min(1, anim.t / 0.5);
            rot = (side === 'b' ? -1 : 1) * 80 * (Math.PI / 180) * p;
            y = FLOOR_Y + 20 * p;
            alpha = 0.5 + 0.5 * (1 - p);
            bright = 0.4;
          } else if (anim.state === 'win' && !reduced) {
            const p = Math.min(1, anim.t / 0.9);
            y = FLOOR_Y - Math.abs(Math.sin(p * Math.PI * 3)) * 22 * (1 - p * 0.3);
            if (p >= 1) {
              anim.state = 'idle';
              anim.t = 0;
            }
          }

          spr.x = x;
          spr.y = y;
          spr.rotation = rot;
          spr.scale.set(scaleX, scaleY);
          spr.alpha = alpha;
          spr.tint = bright === 1 ? 0xffffff : bright > 1 ? 0xffffff : 0x666666;
          if (bright > 1) spr.alpha = Math.min(1, 0.7 + bright * 0.1);

          const h = spr.height;
          nextAnchors[side] = {
            head: { x, y: y - h * 0.92 },
            chest: { x, y: y - h * 0.5 },
            feet: { x, y },
          };
        }

        if (nextAnchors.a && nextAnchors.b) {
          // Throttle React anchor publishes (~12fps) to avoid per-frame renders
          anchorAccRef.current += dt;
          if (anchorAccRef.current >= 0.08) {
            anchorAccRef.current = 0;
            const prev = lastAnchorsRef.current;
            const changed = !prev
              || Math.abs(prev.a.head.x - nextAnchors.a.head.x) > 0.5
              || Math.abs(prev.a.head.y - nextAnchors.a.head.y) > 0.5
              || Math.abs(prev.b.head.x - nextAnchors.b.head.x) > 0.5
              || Math.abs(prev.b.head.y - nextAnchors.b.head.y) > 0.5;
            if (changed) {
              lastAnchorsRef.current = nextAnchors;
              setAnchors(nextAnchors);
            }
          }
        }

        // Animate damage floats
        for (const child of [...(fxLayerRef.current?.children ?? [])]) {
          if (!child._dmg) continue;
          child._dmg.age += dt;
          const life = child._dmg.crit ? 1.3 : 1.1;
          const t = child._dmg.age / life;
          child.y = child._dmg.startY - (child._dmg.crit ? 64 : 52) * t;
          child.alpha = 1 - t;
          child.scale.set(child._dmg.startScale * (1 - t * 0.4));
          if (t >= 1) child.destroy({ children: true });
        }
      });

      appRef.current = app;
      setReady(true);
    } catch (err) {
      setError(err.message || String(err));
    }
    })();
    initPromiseRef.current = pending;
    await pending;
    initPromiseRef.current = null;
  }, []);

  useEffect(() => {
    const ticker = appRef.current?.ticker;
    if (!ticker) return;
    if ([PHASE.BOOT, PHASE.TITLE, PHASE.WORLD].includes(phase) || document.hidden) ticker.stop();
    else ticker.start();
  }, [phase, ready]);

  const attachCanvas = useCallback((el) => {
    mountElRef.current = el;
    const app = appRef.current;
    if (!el || !app) return;
    // Clear previous mounts
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(app.canvas);
    app.canvas.style.width = '100%';
    app.canvas.style.height = '100%';
    app.canvas.style.display = 'block';
    app.canvas.style.imageRendering = 'pixelated';
  }, []);

  const setFighters = useCallback((fighterA, fighterB) => {
    const app = appRef.current;
    const textures = texturesRef.current;
    const layer = fightersRef.current.layer;
    if (!app || !textures || !layer) return;

    for (const side of ['a', 'b']) {
      fightersRef.current[side]?.destroy();
      fightersRef.current[side] = null;
    }

    const make = (fighter, side) => {
    const identity = fighter?.id ?? fighter?.provider ?? 'custom';
    const key = FIGHTER_CREATURE[identity] ?? PROVIDER_CREATURE[identity] ?? 'patchbyte';
      const tex = textures.get(key) || textures.get('robot');
      const spr = new Sprite(tex);
      spr.anchor.set(0.5, 1); // feet at origin
      const flip = side === 'b' ? -1 : 1;
      spr.scale.set(SPRITE_SCALE * flip, SPRITE_SCALE);
      const baseX = side === 'a' ? FIGHTER_A_X : FIGHTER_B_X;
      spr.x = baseX;
      spr.y = FLOOR_Y;
      layer.addChild(spr);
      fightersRef.current[side] = spr;
      animRef.current[side] = { state: 'idle', t: 0, baseX };
    };

    if (fighterA) make(fighterA, 'a');
    if (fighterB) make(fighterB, 'b');
  }, []);

  const setSpriteState = useCallback((side, state) => {
    const anim = animRef.current[side];
    if (!anim) return;
    anim.state = state;
    anim.t = 0;
  }, []);

  const spawnDamage = useCallback((side, value) => {
    const fx = fxLayerRef.current;
    const spr = fightersRef.current[side];
    if (!fx || !spr) return;

    const id = dmgIdRef.current++;
    const crit = value >= CRIT_DAMAGE;
    const style = new TextStyle({
      fontFamily: 'Bebas Neue, Impact, sans-serif',
      fontSize: crit ? 40 : 32,
      fill: crit ? '#FACC15' : '#EF4444',
      stroke: { color: '#0a0a0f', width: 3 },
    });
    const label = new Text({ text: `-${value}`, style });
    label.anchor.set(0.5);
    label.x = spr.x;
    label.y = spr.y - spr.height * 0.7;
    label._dmg = {
      age: 0,
      crit,
      startY: label.y,
      startScale: crit ? 1.8 : 1.4,
    };
    label.scale.set(label._dmg.startScale);
    fx.addChild(label);

    if (crit) {
      const callout = new Text({
        text: CRIT_LINES[id % CRIT_LINES.length],
        style: new TextStyle({
          fontFamily: 'Bebas Neue, Impact, sans-serif',
          fontSize: 13,
          fill: '#FACC15',
          letterSpacing: 3,
        }),
      });
      callout.anchor.set(0.5, 0);
      callout.x = 0;
      callout.y = 28;
      label.addChild(callout);
    }
  }, []);

  const clearFx = useCallback(() => {
    const fx = fxLayerRef.current;
    if (!fx) return;
    while (fx.children.length) fx.children[0].destroy();
  }, []);

  // Destroy on unmount
  useEffect(() => () => {
    appRef.current?.destroy(true, { children: true });
    appRef.current = null;
  }, []);

  const value = useMemo(() => ({
    ready,
    error,
    anchors,
    layout,
    setLayout,
    init,
    attachCanvas,
    setFighters,
    setSpriteState,
    spawnDamage,
    clearFx,
  }), [ready, error, anchors, layout, init, attachCanvas, setFighters, setSpriteState, spawnDamage, clearFx]);

  return <StageCtx.Provider value={value}>{children}</StageCtx.Provider>;
}

export function useStage() {
  const ctx = useContext(StageCtx);
  if (!ctx) throw new Error('useStage outside StageProvider');
  return ctx;
}
