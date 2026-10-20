import { useEffect, useRef } from 'react';
import { useStage } from './StageContext';

/** Mounts the Pixi canvas into the letterbox (z0 stage layer). */
export default function PixiCanvas() {
  const { attachCanvas, ready } = useStage();
  const ref = useRef(null);

  useEffect(() => {
    if (ready && ref.current) attachCanvas(ref.current);
  }, [ready, attachCanvas]);

  return (
    <div
      ref={ref}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
