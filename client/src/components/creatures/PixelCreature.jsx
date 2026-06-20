import { useEffect, useRef } from 'react';

const PIXEL = 5; // px per grid cell

export default function PixelCreature({ creature, scale = 1, brightness = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!creature || !canvasRef.current) return;
    const { pal, px } = creature;
    const rows = px.length;
    const cols = Math.max(...px.map(r => r.length));
    const canvas = canvasRef.current;
    const size = PIXEL * scale;
    canvas.width = cols * size;
    canvas.height = rows * size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < rows; y++) {
      const row = px[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '_' || ch === ' ') continue;
        const color = pal[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x * size, y * size, size, size);
      }
    }
  }, [creature, scale]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        imageRendering: 'pixelated',
        filter: brightness !== 1 ? `brightness(${brightness})` : undefined,
      }}
    />
  );
}
