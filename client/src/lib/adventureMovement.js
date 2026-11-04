export const WALK_STEP_MS = 180;
export const RUN_STEP_MS = 105;

export const MOVEMENT_KEYS = {
  ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
};

export function createMovementController() {
  const held = new Map();
  let nextStep = 0;
  let lastStep = null;
  let running = false;

  return {
    press(source, movement) {
      if (!held.has(source)) held.set(source, movement);
    },
    release(source) {
      held.delete(source);
      if (!held.size) { nextStep = 0; lastStep = null; }
    },
    setRunning(value) {
      running = value;
      if (lastStep !== null) nextStep = lastStep + (running ? RUN_STEP_MS : WALK_STEP_MS);
    },
    tick(now) {
      if (!held.size || now < nextStep) return null;
      const movement = [...held.values()].at(-1);
      lastStep = now;
      // A delayed frame gets one step; background tabs never accumulate movement.
      nextStep = now + (running ? RUN_STEP_MS : WALK_STEP_MS);
      return movement;
    },
    cancel() {
      held.clear();
      nextStep = 0;
      lastStep = null;
      running = false;
    },
  };
}
