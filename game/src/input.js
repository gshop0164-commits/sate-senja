// Keyboard and pointer input for the stall. Arrow keys or WASD steer the cook; E uses
// the station in front of them; Space or Enter starts and confirms; P or Escape pauses.
// A click (or tap) on the floor sets a walk target; when the cook arrives, the world
// checks whether a station is there and uses it — the pointer position is handed to the
// caller in field pixels.
//
// One-shot presses (confirm, pause, use) are queued as bit flags and taken once by the
// loop, so a press between two frames is never lost and never counted twice.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_USE = 4;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const USE = new Set(['KeyE']);

export function createInput(canvas, toField) {
  const held = { up: false, down: false, left: false, right: false };
  let actions = 0;
  // The walk target in field pixels, or null when the cook walks by keys alone.
  let walkTarget = null;

  function press(code) {
    if (UP.has(code)) held.up = true;
    else if (DOWN.has(code)) held.down = true;
    else if (LEFT.has(code)) held.left = true;
    else if (RIGHT.has(code)) held.right = true;
    else if (CONFIRM.has(code)) actions |= ACTION_CONFIRM;
    else if (PAUSE.has(code)) actions |= ACTION_PAUSE;
    else if (USE.has(code)) actions |= ACTION_USE;
    else return false;
    return true;
  }

  function release(code) {
    if (UP.has(code)) held.up = false;
    else if (DOWN.has(code)) held.down = false;
    else if (LEFT.has(code)) held.left = false;
    else if (RIGHT.has(code)) held.right = false;
    else return false;
    return true;
  }

  window.addEventListener('keydown', (event) => {
    if (press(event.code)) {
      walkTarget = null;
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    release(event.code);
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => {
    held.up = false;
    held.down = false;
    held.left = false;
    held.right = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = toField(event.clientX, event.clientY);
    if (!point) {
      actions |= ACTION_CONFIRM;
      return;
    }
    walkTarget = point;
    actions |= ACTION_CONFIRM;
  });

  return {
    /** Steering from held keys: {x, y} each -1, 0 or 1. */
    keys() {
      return {
        x: (held.right ? 1 : 0) - (held.left ? 1 : 0),
        y: (held.down ? 1 : 0) - (held.up ? 1 : 0),
      };
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The click-to-walk target, or null. */
    walkTarget() {
      return walkTarget;
    },
    /** Clear a walk target the cook has reached or abandoned. */
    clearWalk() {
      walkTarget = null;
    },
  };
}
