import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import PixelCreature from './creatures/PixelCreature';
import { getCreature } from './creatures/pixelData';

// state: 'idle' | 'attack' | 'hurt' | 'ko' | 'win'
export default function FighterSprite({ fighter, state = 'idle', flip = false, scale = 1.5 }) {
  const controls = useAnimation();
  const [brightness, setBrightness] = useState(1);
  const creature = getCreature(fighter?.id ?? fighter?.provider ?? 'custom');

  const dir = flip ? 1 : -1; // flip=true means fighter is on right → attack goes left

  useEffect(() => {
    (async () => {
      switch (state) {
        case 'idle':
          controls.start({
            y: [0, -6, 0],
            transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
          });
          break;

        case 'attack':
          await controls.start({
            x: dir * -28,
            scaleX: flip ? -1.15 : 1.15,
            transition: { duration: 0.12, ease: 'easeOut' },
          });
          await controls.start({
            x: 0,
            scaleX: flip ? -1 : 1,
            transition: { duration: 0.3, ease: 'easeInOut' },
          });
          break;

        case 'hurt':
          setBrightness(3);
          await controls.start({
            x: [0, 10 * (flip ? -1 : 1), -8 * (flip ? -1 : 1), 6 * (flip ? -1 : 1), 0],
            transition: { duration: 0.35, ease: 'easeInOut' },
          });
          setBrightness(1);
          // return to idle
          controls.start({
            y: [0, -6, 0],
            transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
          });
          break;

        case 'ko':
          setBrightness(0.4);
          await controls.start({
            rotate: flip ? -80 : 80,
            y: 20,
            opacity: 0.5,
            transition: { duration: 0.5, ease: 'easeIn' },
          });
          break;

        case 'win':
          await controls.start({
            y: [0, -22, 0, -14, 0, -8, 0],
            transition: { duration: 0.9, ease: 'easeInOut' },
          });
          // back to idle bob
          controls.start({
            y: [0, -6, 0],
            transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
          });
          break;
      }
    })();
  }, [state]);

  // start idle on mount
  useEffect(() => {
    controls.start({
      y: [0, -6, 0],
      transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
    });
  }, []);

  return (
    <motion.div
      animate={controls}
      style={{
        display: 'inline-block',
        transformOrigin: 'bottom center',
        scaleX: flip ? -1 : 1,
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    >
      <PixelCreature creature={creature} scale={scale} brightness={brightness} />
    </motion.div>
  );
}
