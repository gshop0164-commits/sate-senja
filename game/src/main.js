// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused and game over.
//
// A click on the floor sets a walk target; the cook walks there, and when they arrive
// the world uses whatever station stands there. Keys steer directly and E uses the
// station in front of the cook.
//
// ?seed=N fixes the night's orders. ?shot=start|play|serve|end (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot.
import { BEST_KEY, SHIFT_SECONDS, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_EXPIRED, EVENT_OVER, EVENT_REFUSED, EVENT_SERVED } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_USE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;
/** How close the cook must get to a click target before the walk ends. */
const ARRIVE = 10;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, renderer.toField);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  // Read-only handle for automated play tests (and the curious): the live state.
  window.__sate = { get state() { return world.state; } };

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Bermain. 3 hati. Antar pesanan sebelum waktu habis.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    announce(`Malam selesai. ${world.state.coins} koin, ${world.state.served} pesanan terantar. Terbaik ${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Bermain.');
    } else if (actions & ACTION_USE && screen === SCREEN_PLAY) {
      world.use();
    }
  }

  function moveFromInput() {
    const keys = input.keys();
    if (keys.x !== 0 || keys.y !== 0) return keys;
    const target = input.walkTarget();
    if (!target) return { x: 0, y: 0 };
    const dx = target.x - world.state.chef.x;
    const dy = target.y - world.state.chef.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= ARRIVE) {
      input.clearWalk();
      world.use();
      return { x: 0, y: 0 };
    }
    return { x: dx / distance, y: dy / distance };
  }

  function step() {
    const move = screen === SCREEN_PLAY ? moveFromInput() : { x: 0, y: 0 };
    const events = world.step(STEP, move);
    if (events & EVENT_SERVED) announce(`Terantar! ${world.state.coins} koin.`);
    else if (events & EVENT_REFUSED) announce('Pesanan ditolak: bukan yang dipesan.');
    else if (events & EVENT_EXPIRED) announce(`Pelanggan pergi. ${world.state.hearts} hati tersisa.`);
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    // The shift clock never runs on the title screen: the world is frozen there and
    // only the renderer's own ambient clock animates the dusk, smoke and embers.
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting skewers burn unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Sate Senja. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
