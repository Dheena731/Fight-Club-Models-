/**
 * Convert logical stage coords → CSS px relative to the letterboxed overlay.
 * Because one transform scales canvas + overlay together, CSS left/top in
 * logical units (applied inside the 960×540 wrapper) stay pinned.
 *
 * When calling from outside the wrapper, pass scale + offset from Letterbox.
 */
export function projectLogical(x, y, { scale = 1, offsetX = 0, offsetY = 0 } = {}) {
  return {
    left: offsetX + x * scale,
    top: offsetY + y * scale,
  };
}

/**
 * Hook-friendly projection using the stage layout from StageContext.
 * Inside the letterbox wrapper (already at logical size), use scale=1.
 */
export function useStageProjection(layout) {
  const scale = layout?.scale ?? 1;
  const offsetX = layout?.offsetX ?? 0;
  const offsetY = layout?.offsetY ?? 0;

  return (x, y) => projectLogical(x, y, { scale, offsetX, offsetY });
}
