// Sate Senja's rules and state, with no drawing and no browser in it: the cook, the
// charcoal grill and its skewers, the peanut-sauce pot, the plating counter, the serving
// window, the customers' orders and the night rush. step() advances one fixed step and
// returns what happened as bit flags, so the caller can react without the world knowing
// about screens or sound.
//
// A skewer on the grill cooks to half-done, waits for a flip, then cooks to done. Left
// past done it burns, and a burnt skewer is refused everywhere — it goes in the trash.
// A cooked skewer dipped in peanut sauce becomes "kind+kacang". A plate is served only
// when its items match one open order's recipe exactly.

import {
  CHEF, COMBO_WINDOW, FIELD, GRILL, HEARTS, ORDERS, PLATE_MAX, RECIPES,
  SHIFT_SECONDS, SIDES, SKEWERS,
} from './config.js';

export const EVENT_SERVED = 1;
export const EVENT_REFUSED = 2;
export const EVENT_EXPIRED = 4;
export const EVENT_BURNT = 8;
export const EVENT_OVER = 16;

const USE_RANGE = 86;

/**
 * Where every station stands, in field pixels. `use` is the point the cook stands on
 * to reach it; the renderer draws the station around the same centre.
 */
export const STATIONS = [
  { id: 'bin-ayam', kind: 'bin', item: 'ayam', x: 81, y: 270, label: 'Ayam' },
  { id: 'bin-sapi', kind: 'bin', item: 'sapi', x: 171, y: 270, label: 'Sapi' },
  { id: 'bin-tahu', kind: 'bin', item: 'tahu', x: 81, y: 395, label: 'Tahu' },
  { id: 'bin-tempe', kind: 'bin', item: 'tempe', x: 171, y: 395, label: 'Tempe' },
  { id: 'bin-lontong', kind: 'bin', item: 'lontong', x: 66, y: 510, label: 'Lontong' },
  { id: 'bin-timun', kind: 'bin', item: 'timun', x: 126, y: 510, label: 'Timun' },
  { id: 'bin-bawang', kind: 'bin', item: 'bawang', x: 186, y: 510, label: 'Bawang' },
  { id: 'grill', kind: 'grill', x: 470, y: 375, label: 'Panggangan Arang' },
  { id: 'sauce', kind: 'sauce', x: 700, y: 360, label: 'Bumbu Kacang' },
  { id: 'counter', kind: 'counter', x: 810, y: 550, label: 'Meja Saji' },
  { id: 'window', kind: 'window', x: 1150, y: 430, label: 'Jendela Antar' },
  { id: 'trash', kind: 'trash', x: 1000, y: 470, label: 'Tempat Sampah' },
];

/** The station whose use-point is nearest to (x, y), when it is within reach. */
export function stationNear(x, y) {
  let best = null;
  let bestDistance = Infinity;
  for (const station of STATIONS) {
    const distance = Math.hypot(station.x - x, station.y - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = station;
    }
  }
  return bestDistance <= USE_RANGE ? best : null;
}

/** The station whose zone holds the point, for click-to-walk arrivals. */
export function stationAtPoint(x, y) {
  return stationNear(x, y);
}

function makeSkewer(kind) {
  return { kind: 'skewer', skewer: kind, done: 'raw' };
}

function makeSide(kind) {
  return { kind: 'side', side: kind };
}

function makePlate() {
  return { kind: 'plate', items: [] };
}

/** The token a plate item contributes to a recipe match. */
export function itemToken(item) {
  if (item.kind === 'side') return item.side;
  if (item.kind === 'skewer') return item.done === 'sauced' ? `${item.skewer}+kacang` : item.skewer;
  return '';
}

/** True when the plate's items are exactly the recipe's needs, in any order. */
export function plateMatches(plate, recipe) {
  if (plate.items.length !== recipe.needs.length) return false;
  const have = plate.items.map(itemToken).sort();
  const want = [...recipe.needs].sort();
  for (let index = 0; index < want.length; index += 1) {
    if (have[index] !== want[index]) return false;
  }
  return true;
}

export function createWorld(random) {
  const chef = { x: 640, y: 580, carrying: [] };
  const grill = [null, null, null];
  const state = {
    chef,
    grill,
    counterPlate: null,
    orders: [],
    orderTimer: ORDERS.firstAt,
    nextOrderId: 1,
    coins: 0,
    combo: 0,
    comboTimer: 0,
    served: 0,
    refused: 0,
    burnt: 0,
    hearts: HEARTS,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    over: false,
    message: '',
    messageTimer: 0,
  };

  function reset() {
    chef.x = 640;
    chef.y = 580;
    chef.carrying = [];
    for (let index = 0; index < grill.length; index += 1) grill[index] = null;
    state.counterPlate = null;
    state.orders = [];
    state.orderTimer = ORDERS.firstAt;
    state.nextOrderId = 1;
    state.coins = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.served = 0;
    state.refused = 0;
    state.burnt = 0;
    state.hearts = HEARTS;
    state.elapsed = 0;
    state.timeLeft = SHIFT_SECONDS;
    state.over = false;
    state.message = '';
    state.messageTimer = 0;
  }

  function rush() {
    // 0 at the first order, 1 at the end of the shift: the night rush.
    return Math.min(1, state.elapsed / SHIFT_SECONDS);
  }

  function spawnOrder() {
    if (state.orders.length >= ORDERS.maxOpen) return;
    const recipe = RECIPES[Math.floor(random() * RECIPES.length)];
    const patience = ORDERS.patienceStart + (ORDERS.patienceEnd - ORDERS.patienceStart) * rush();
    state.orders.push({
      id: state.nextOrderId,
      recipe,
      patience,
      maxPatience: patience,
    });
    state.nextOrderId += 1;
  }

  function say(text) {
    state.message = text;
    state.messageTimer = 2.5;
  }

  function carriedSkewerIndex(predicate) {
    for (let index = chef.carrying.length - 1; index >= 0; index -= 1) {
      const item = chef.carrying[index];
      if (item.kind === 'skewer' && predicate(item)) return index;
    }
    return -1;
  }

  function useBin(station) {
    if (chef.carrying.length >= CHEF.carryMax) {
      say('Tangan penuh!');
      return;
    }
    if (SKEWERS[station.item]) chef.carrying.push(makeSkewer(station.item));
    else if (SIDES[station.item]) chef.carrying.push(makeSide(station.item));
  }

  function useGrill() {
    const rawIndex = carriedSkewerIndex((item) => item.done === 'raw');
    const freeSlot = grill.findIndex((slot) => slot === null);
    if (rawIndex >= 0 && freeSlot >= 0) {
      const item = chef.carrying.splice(rawIndex, 1)[0];
      grill[freeSlot] = { kind: item.skewer, progress: 0, flipped: false, burn: 0 };
      say(`${SKEWERS[item.skewer].label} naik ke panggangan.`);
      return;
    }
    // Flip the most-cooked skewer that still waits for its flip.
    let flipSlot = -1;
    for (let index = 0; index < grill.length; index += 1) {
      const slot = grill[index];
      if (slot && !slot.flipped && slot.progress >= 50) {
        if (flipSlot < 0 || slot.progress > grill[flipSlot].progress) flipSlot = index;
      }
    }
    if (flipSlot >= 0) {
      grill[flipSlot].flipped = true;
      say('Dibalik! Bakar sisi satunya.');
      return;
    }
    // Take the most-done skewer off the grill.
    let takeSlot = -1;
    for (let index = 0; index < grill.length; index += 1) {
      const slot = grill[index];
      if (slot && slot.progress >= 100 && slot.burn < GRILL.burnSeconds) {
        if (takeSlot < 0 || slot.progress > grill[takeSlot].progress) takeSlot = index;
      }
    }
    if (takeSlot >= 0 && chef.carrying.length < CHEF.carryMax) {
      const slot = grill[takeSlot];
      grill[takeSlot] = null;
      chef.carrying.push({ kind: 'skewer', skewer: slot.kind, done: 'cooked' });
      say(`${SKEWERS[slot.kind].label} matang, angkat!`);
      return;
    }
    // Clear a burnt skewer into the trash.
    for (let index = 0; index < grill.length; index += 1) {
      const slot = grill[index];
      if (slot && slot.burn >= GRILL.burnSeconds) {
        grill[index] = null;
        state.burnt += 1;
        say('Gosong! Dibuang.');
        return;
      }
    }
    if (rawIndex < 0 && freeSlot < 0) say('Panggangan penuh.');
    else if (takeSlot >= 0) say('Tangan penuh!');
    else say('Masih dibakar… tunggu sebentar.');
  }

  function useSauce() {
    const index = carriedSkewerIndex((item) => item.done === 'cooked');
    if (index < 0) {
      say('Bawa sate matang ke sini untuk dicelup.');
      return;
    }
    chef.carrying[index].done = 'sauced';
    say('Celup bumbu kacang — mengkilap!');
  }

  function useCounter() {
    const plateIndex = chef.carrying.findIndex((item) => item.kind === 'plate');
    if (plateIndex >= 0) {
      // Put the carried plate down, or pick the counter plate up instead.
      if (state.counterPlate === null) {
        state.counterPlate = chef.carrying.splice(plateIndex, 1)[0];
        say('Piring diletakkan di meja saji.');
      } else {
        const held = chef.carrying.splice(plateIndex, 1)[0];
        chef.carrying.push(state.counterPlate);
        state.counterPlate = held;
        say('Piring ditukar.');
      }
      return;
    }
    if (chef.carrying.length === 0) {
      if (state.counterPlate) {
        chef.carrying.push(state.counterPlate);
        state.counterPlate = null;
        say('Piring diangkat.');
      } else {
        say('Meja saji kosong.');
      }
      return;
    }
    // Move one carried item onto a plate.
    const item = chef.carrying[chef.carrying.length - 1];
    if (state.counterPlate === null) {
      const plate = makePlate();
      plate.items.push(chef.carrying.pop());
      state.counterPlate = plate;
      say('Piring baru disusun.');
    } else if (state.counterPlate.items.length < PLATE_MAX) {
      state.counterPlate.items.push(chef.carrying.pop());
      say('Ditata di piring.');
    } else {
      say('Piring sudah penuh!');
    }
  }

  function useWindow() {
    const plateIndex = chef.carrying.findIndex((item) => item.kind === 'plate');
    if (plateIndex < 0) {
      say('Bawa piring yang sudah disusun ke jendela antar.');
      return 0;
    }
    const plate = chef.carrying[plateIndex];
    const orderIndex = state.orders.findIndex((order) => plateMatches(plate, order.recipe));
    if (orderIndex < 0) {
      state.refused += 1;
      say('Bukan pesanan ini — periksa papan order!');
      return EVENT_REFUSED;
    }
    const order = state.orders[orderIndex];
    state.orders.splice(orderIndex, 1);
    chef.carrying.splice(plateIndex, 1);
    const speedBonus = Math.round(6 * (order.patience / order.maxPatience));
    state.combo = state.comboTimer > 0 ? Math.min(5, state.combo + 1) : 1;
    state.comboTimer = COMBO_WINDOW;
    const earned = order.recipe.coins + speedBonus + (state.combo - 1) * 4;
    state.coins += earned;
    state.served += 1;
    say(`${order.recipe.name} terantar! +${earned} koin.`);
    return EVENT_SERVED;
  }

  function useTrash() {
    if (chef.carrying.length === 0) {
      say('Tidak ada yang dibuang.');
      return;
    }
    const item = chef.carrying.pop();
    if (item.kind === 'skewer' && item.done === 'burnt') state.burnt += 1;
    say('Dibuang.');
  }

  /** Use the station nearest the cook, when one is in reach. Returns event flags. */
  function use() {
    const station = stationNear(chef.x, chef.y);
    if (!station) return 0;
    if (station.kind === 'bin') useBin(station);
    else if (station.kind === 'grill') useGrill();
    else if (station.kind === 'sauce') useSauce();
    else if (station.kind === 'counter') useCounter();
    else if (station.kind === 'window') return useWindow();
    else if (station.kind === 'trash') useTrash();
    return 0;
  }

  /**
   * One fixed step. `move` is {x, y} steering (-1..1 each); the cook walks the floor
   * and never leaves it. Returns event flags.
   */
  function step(dt, move) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);

    const length = Math.hypot(move.x, move.y);
    const nx = length > 0 ? move.x / length : 0;
    const ny = length > 0 ? move.y / length : 0;
    chef.x = Math.min(1252, Math.max(28, chef.x + nx * CHEF.speed * dt));
    chef.y = Math.min(FIELD.floorBottom, Math.max(FIELD.floorTop, chef.y + ny * CHEF.speed * dt));

    if (state.messageTimer > 0) state.messageTimer = Math.max(0, state.messageTimer - dt);
    if (state.comboTimer > 0) {
      state.comboTimer = Math.max(0, state.comboTimer - dt);
      if (state.comboTimer === 0) state.combo = 0;
    }

    // The grill never waits: skewers cook, then burn.
    for (let index = 0; index < grill.length; index += 1) {
      const slot = grill[index];
      if (!slot) continue;
      if (!slot.flipped) {
        slot.progress = Math.min(50, slot.progress + (100 / GRILL.halfSeconds) * dt);
      } else if (slot.progress < 100) {
        slot.progress = Math.min(100, slot.progress + (100 / GRILL.doneSeconds) * dt);
      } else {
        slot.burn += dt;
        if (slot.burn >= GRILL.burnSeconds) {
          grill[index] = null;
          state.burnt += 1;
          events |= EVENT_BURNT;
          say('Ada sate gosong di panggangan!');
        }
      }
    }

    // New customers arrive faster as the night rush builds.
    state.orderTimer -= dt;
    if (state.orderTimer <= 0) {
      spawnOrder();
      const interval = ORDERS.intervalStart + (ORDERS.intervalEnd - ORDERS.intervalStart) * rush();
      state.orderTimer += interval;
    }

    // Patience runs out: a lost customer costs a heart.
    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(index, 1);
        state.hearts -= 1;
        events |= EVENT_EXPIRED;
        say('Pelanggan pergi — pesanannya kedaluwarsa!');
        if (state.hearts <= 0) {
          state.over = true;
          events |= EVENT_OVER;
        }
      }
    }

    if (state.timeLeft <= 0) {
      state.over = true;
      events |= EVENT_OVER;
    }
    return events;
  }

  reset();
  return { state, reset, step, use, stationNear };
}
