import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LOGICAL_W, LOGICAL_H } from './constants';
import { useStage } from './StageContext';

/**
 * Letterboxed 960×540 wrapper. One CSS transform scales canvas + DOM overlay
 * together so they cannot desync. Screen shake applies to this wrapper.
 */
export default function Letterbox({ children, shake, className = '' }) {
  const hostRef = useRef(null);
  const { setLayout } = useStage();
  const reducedMotion = useReducedMotion();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const s = Math.min(rect.width / LOGICAL_W, rect.height / LOGICAL_H);
      setScale(s);
      const offsetX = (rect.width - LOGICAL_W * s) / 2;
      const offsetY = (rect.height - LOGICAL_H * s) / 2;
      setLayout({ scale: s, offsetX, offsetY, width: rect.width, height: rect.height });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [setLayout]);

  return (
    <div
      ref={hostRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
      }}
    >
      <div
        className="relative shrink-0"
        style={{ width: LOGICAL_W * scale, height: LOGICAL_H * scale }}
      >
        {/* CSS scale — shared by canvas + DOM overlay */}
        <div
          style={{
            width: LOGICAL_W,
            height: LOGICAL_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Shake moves both layers as one object */}
          <motion.div
            className="relative w-full h-full"
            animate={
              shake && !reducedMotion
                ? {
                    x: [0, -shake.amp, shake.amp, -shake.amp * 0.6, shake.amp * 0.6, -shake.amp * 0.25, shake.amp * 0.25, 0],
                    y: [0, shake.amp * 0.35, -shake.amp * 0.35, shake.amp * 0.2, -shake.amp * 0.2, 0, 0, 0],
                  }
                : { x: 0, y: 0 }
            }
            transition={{ duration: 0.5 }}
            key={shake?.id ?? 'still'}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
