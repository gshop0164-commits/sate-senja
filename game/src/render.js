// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred, the margin filled with dusk. The
// stall is drawn with warm light against a purple-orange dusk: string lights, a glowing
// charcoal grill with drifting smoke, glossy peanut sauce, and plates that read at a
// glance. Food is drawn, never photographed: meat cubes with grill marks, sauce with a
// highlight, lontong, cucumber and shallots as small bright shapes.
//
// The title screen keeps the whole kitchen visible: only a slim banner rides across the
// top of the floor, so the cover screenshot shows a dish mid-assembly, never a modal.

import { FIELD, PALETTE, PLATE_MAX, SKEWERS, SIDES } from './config.js';
import { STATIONS } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align = 'left') {
    if (!fonts.has(size)) fonts.set(size, `bold ${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function plainText(value, x, y, size, color, align = 'left') {
    if (!fonts.has(-size)) fonts.set(-size, `${size}px ${FONT}`);
    context.font = fonts.get(-size);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  /** Client pixels (a pointer event) into field pixels, or null outside the field. */
  function toField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - view.x) / view.scale;
    const y = (clientY - rect.top - view.y) / view.scale;
    if (x < 0 || y < 0 || x > FIELD.width || y > FIELD.height) return null;
    return { x, y };
  }

  // ---- food ---------------------------------------------------------------

  /** One skewer stick with three meat cubes, drawn at (x, y), pointing right. */
  function drawSkewer(x, y, kind, done, scale = 1) {
    const info = SKEWERS[kind];
    const meat = done === 'burnt' ? '#241a12' : done === 'raw' ? info.meat : info.cooked;
    const cube = 15 * scale;
    const gap = 19 * scale;
    context.save();
    context.translate(x, y);
    // Bamboo stick.
    context.strokeStyle = '#d9b380';
    context.lineWidth = 3 * scale;
    context.beginPath();
    context.moveTo(-8 * scale, 0);
    context.lineTo(3 * cube + gap * 2 + 6 * scale, 0);
    context.stroke();
    for (let index = 0; index < 3; index += 1) {
      const cx = index * (cube + gap);
      // Meat cube with a soft top light.
      context.fillStyle = meat;
      roundRect(context, cx, -cube / 2, cube, cube, 3 * scale);
      context.fill();
      context.fillStyle = 'rgba(255,255,255,0.22)';
      roundRect(context, cx, -cube / 2, cube, cube / 3, 3 * scale);
      context.fill();
      if (done === 'cooked' || done === 'sauced') {
        // Grill marks.
        context.strokeStyle = 'rgba(60,20,8,0.75)';
        context.lineWidth = 2 * scale;
        context.beginPath();
        context.moveTo(cx + 3 * scale, -cube / 2 + 2 * scale);
        context.lineTo(cx + cube - 4 * scale, cube / 2 - 2 * scale);
        context.moveTo(cx + cube - 4 * scale, -cube / 2 + 2 * scale);
        context.lineTo(cx + 3 * scale, cube / 2 - 2 * scale);
        context.stroke();
      }
      if (done === 'sauced') {
        // Glistening peanut sauce over the cube.
        context.fillStyle = 'rgba(224,138,46,0.85)';
        roundRect(context, cx + 1, -cube / 2 + 1, cube - 2, cube / 2, 3 * scale);
        context.fill();
        context.fillStyle = 'rgba(255,255,255,0.55)';
        context.beginPath();
        context.ellipse(cx + cube / 2, -cube / 4, cube / 4, cube / 8, -0.4, 0, Math.PI * 2);
        context.fill();
      }
      if (done === 'burnt') {
        context.strokeStyle = 'rgba(255,122,26,0.5)';
        context.lineWidth = 1.5 * scale;
        context.beginPath();
        context.moveTo(cx + 2, -cube / 2 + 3);
        context.lineTo(cx + cube - 2, cube / 2 - 3);
        context.stroke();
      }
    }
    context.restore();
  }

  function drawSide(x, y, kind, scale = 1) {
    context.save();
    context.translate(x, y);
    if (kind === 'lontong') {
      // Two white rice-cake cubes in a banana-leaf wrap.
      context.fillStyle = '#3f7a34';
      roundRect(context, -13 * scale, -8 * scale, 26 * scale, 18 * scale, 4 * scale);
      context.fill();
      context.fillStyle = '#f7f2df';
      roundRect(context, -10 * scale, -11 * scale, 10 * scale, 12 * scale, 2 * scale);
      context.fill();
      roundRect(context, 1 * scale, -11 * scale, 10 * scale, 12 * scale, 2 * scale);
      context.fill();
    } else if (kind === 'timun') {
      // Cucumber slices: pale green discs with a darker rind.
      for (const offset of [-9, 9]) {
        context.fillStyle = '#2f7a3a';
        context.beginPath();
        context.arc(offset * scale, 0, 9 * scale, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#bfe8a8';
        context.beginPath();
        context.arc(offset * scale, 0, 6.5 * scale, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#e8f7d8';
        context.beginPath();
        context.arc(offset * scale, 0, 3 * scale, 0, Math.PI * 2);
        context.fill();
      }
    } else if (kind === 'bawang') {
      // Shallots: small purple teardrops.
      for (const offset of [-8, 0, 8]) {
        context.fillStyle = '#a34d7a';
        context.beginPath();
        context.ellipse(offset * scale, 0, 5.5 * scale, 8 * scale, 0, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#d98ab0';
        context.beginPath();
        context.ellipse(offset * scale - 1.5 * scale, -2 * scale, 2 * scale, 4 * scale, 0, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.restore();
  }

  function drawItem(x, y, item, scale = 1) {
    if (item.kind === 'skewer') drawSkewer(x, y, item.skewer, item.done, scale);
    else if (item.kind === 'side') drawSide(x, y, item.side, scale);
  }

  /** A white plate with a gold rim, the items fanned across it. */
  function drawPlate(x, y, items, scale = 1) {
    context.save();
    context.translate(x, y);
    context.fillStyle = PALETTE.plateRim;
    context.beginPath();
    context.ellipse(0, 0, 62 * scale, 26 * scale, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.plate;
    context.beginPath();
    context.ellipse(0, 0, 56 * scale, 22 * scale, 0, 0, Math.PI * 2);
    context.fill();
    items.forEach((item, index) => {
      const spread = items.length > 1 ? (index - (items.length - 1) / 2) * 26 * scale : 0;
      drawItem(spread - 26 * scale, -2 * scale + (index % 2) * 6 * scale, item, 0.55 * scale);
    });
    context.restore();
  }

  // ---- the stall ----------------------------------------------------------

  function drawDusk(elapsed) {
    const gradient = context.createLinearGradient(0, 0, 0, FIELD.floorTop);
    gradient.addColorStop(0, PALETTE.duskTop);
    gradient.addColorStop(0.55, PALETTE.duskMid);
    gradient.addColorStop(1, PALETTE.duskLow);
    context.fillStyle = gradient;
    context.fillRect(0, 0, FIELD.width, FIELD.floorTop);
    // Stars fading in as the night deepens.
    context.fillStyle = 'rgba(255,255,255,0.8)';
    const stars = [[90, 42], [210, 88], [330, 30], [470, 70], [620, 26], [760, 84], [900, 40], [1040, 92], [1170, 34], [540, 110], [150, 130], [990, 140]];
    for (const [sx, sy] of stars) {
      const twinkle = 0.45 + 0.35 * Math.sin(elapsed * 1.7 + sx);
      context.globalAlpha = twinkle;
      context.beginPath();
      context.arc(sx, sy, 2, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    // Distant rooftops and a low sun.
    context.fillStyle = 'rgba(43,16,85,0.85)';
    context.fillRect(0, 168, FIELD.width, 50);
    context.fillStyle = PALETTE.horizon;
    context.beginPath();
    context.arc(1050, 196, 34, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(247,178,103,0.35)';
    context.beginPath();
    context.arc(1050, 196, 52, 0, Math.PI * 2);
    context.fill();
    // String lights across the stall.
    context.strokeStyle = 'rgba(20,10,30,0.9)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, 150);
    context.quadraticCurveTo(640, 196, FIELD.width, 150);
    context.stroke();
    for (let index = 0; index < 13; index += 1) {
      const t = index / 12;
      const lx = t * FIELD.width;
      const ly = 150 + Math.sin(t * Math.PI) * 44;
      const glow = 0.6 + 0.4 * Math.sin(elapsed * 2 + index * 1.3);
      context.fillStyle = index % 2 === 0 ? `rgba(255,210,63,${glow})` : `rgba(255,122,26,${glow})`;
      context.beginPath();
      context.arc(lx, ly + 8, 5, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawFloor() {
    context.fillStyle = '#4a3220';
    context.fillRect(0, FIELD.floorTop, FIELD.width, FIELD.height - FIELD.floorTop);
    context.fillStyle = '#543a26';
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        if ((row + col) % 2 === 0) {
          context.fillRect(col * 160 + (row % 2) * 80 - 80, FIELD.floorTop + row * 100, 160, 100);
        }
      }
    }
    // Warm light pooling under the stall lamps.
    const pool = context.createRadialGradient(640, 430, 40, 640, 430, 620);
    pool.addColorStop(0, 'rgba(255,178,90,0.16)');
    pool.addColorStop(1, 'rgba(255,178,90,0)');
    context.fillStyle = pool;
    context.fillRect(0, FIELD.floorTop, FIELD.width, FIELD.height - FIELD.floorTop);
  }

  function drawBins(state) {
    for (const station of STATIONS) {
      if (station.kind !== 'bin') continue;
      const isSkewer = Boolean(SKEWERS[station.item]);
      const size = isSkewer ? 78 : 56;
      const x = station.x - size / 2;
      const y = station.y - size / 2;
      context.fillStyle = PALETTE.stallWoodDark;
      roundRect(context, x, y, size, size, 8);
      context.fill();
      context.fillStyle = PALETTE.stallWood;
      roundRect(context, x + 3, y + 3, size - 6, size - 6, 6);
      context.fill();
      if (isSkewer) drawSkewer(x + 8, y + size / 2 - 4, station.item, 'raw', 0.42);
      else drawSide(station.x, y + size / 2 - 6, station.item, 0.8);
      plainText(station.label, station.x, y + size + 16, 14, PALETTE.text, 'center');
    }
  }

  function drawGrill(state, ambient) {
    const elapsed = ambient;
    // Charcoal bed with a pulsing ember glow.
    const glow = 0.55 + 0.3 * Math.sin(elapsed * 2.2);
    const ember = context.createRadialGradient(470, 392, 10, 470, 392, 190);
    ember.addColorStop(0, `rgba(255,122,26,${0.5 * glow})`);
    ember.addColorStop(1, 'rgba(255,122,26,0)');
    context.fillStyle = ember;
    context.fillRect(280, 260, 380, 220);
    // Grill body: dark iron with a warm rim where the heat escapes.
    context.fillStyle = '#2a1a14';
    roundRect(context, 300, 330, 340, 96, 12);
    context.fill();
    context.strokeStyle = `rgba(255,122,26,${0.35 + 0.3 * glow})`;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(308, 332);
    context.lineTo(632, 332);
    context.stroke();
    context.fillStyle = PALETTE.charcoal;
    roundRect(context, 312, 318, 316, 34, 8);
    context.fill();
    // Charcoal lumps with hot cracks, glowing through the grate.
    for (let index = 0; index < 9; index += 1) {
      const cx = 330 + index * 34;
      context.fillStyle = index % 2 === 0 ? '#4a382c' : '#2e211a';
      context.beginPath();
      context.ellipse(cx, 336, 14, 9, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = `rgba(255,${Math.floor(150 + 90 * glow)},26,${0.65 + 0.35 * glow})`;
      context.beginPath();
      context.ellipse(cx, 336, 6, 3, 0.4, 0, Math.PI * 2);
      context.fill();
    }
    // Grate.
    context.strokeStyle = 'rgba(230,230,230,0.55)';
    context.lineWidth = 2;
    for (let index = 0; index < 8; index += 1) {
      context.beginPath();
      context.moveTo(318 + index * 44, 322);
      context.lineTo(318 + index * 44, 348);
      context.stroke();
    }
    // Smoke wisps rising off the grill, faint so they never read as smudges.
    context.fillStyle = PALETTE.smoke;
    for (let index = 0; index < 3; index += 1) {
      const phase = (elapsed * 0.25 + index * 0.33) % 1;
      const sx = 380 + index * 90 + Math.sin(elapsed + index * 2) * 6;
      const sy = 318 - phase * 70;
      context.globalAlpha = 0.16 * (1 - phase);
      context.beginPath();
      context.arc(sx, sy, 7 + phase * 10, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    // Skewers on the three slots.
    const slots = [380, 470, 560];
    state.grill.forEach((slot, index) => {
      const sx = slots[index];
      if (!slot) {
        // Empty slot: a faint outline where a skewer goes.
        context.strokeStyle = 'rgba(255,255,255,0.18)';
        context.setLineDash([4, 5]);
        context.strokeRect(sx - 44, 322, 88, 22);
        context.setLineDash([]);
        return;
      }
      const done = slot.burn >= 4 ? 'burnt' : slot.progress >= 100 ? 'cooked' : 'raw';
      drawSkewer(sx - 44, 336, slot.kind, done, 0.7);
      // Cook progress ring around the slot.
      const fraction = slot.progress / 100;
      context.strokeStyle = slot.burn >= 4 ? PALETTE.bad : fraction >= 1 ? PALETTE.good : PALETTE.warn;
      context.lineWidth = 4;
      context.beginPath();
      context.arc(sx + 52, 336, 9, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
      context.stroke();
      if (!slot.flipped && slot.progress >= 50) {
        plainText('BALIK!', sx, 306, 15, PALETTE.gold, 'center');
      }
      if (slot.burn >= 4) plainText('GOSONG', sx, 306, 14, PALETTE.bad, 'center');
    });
    plainText('PANGGANGAN ARANG', 470, 452, 15, PALETTE.text, 'center');
  }

  function drawSauce(state, ambient) {
    const elapsed = ambient;
    // Clay pot of peanut sauce, glossy and steaming.
    context.fillStyle = '#5d3d22';
    context.beginPath();
    context.ellipse(700, 392, 52, 20, 0, 0, Math.PI * 2);
    context.fill();
    const sauce = context.createRadialGradient(688, 372, 4, 700, 380, 52);
    sauce.addColorStop(0, PALETTE.sauceGloss);
    sauce.addColorStop(0.5, PALETTE.sauce);
    sauce.addColorStop(1, '#5e2f08');
    context.fillStyle = sauce;
    context.beginPath();
    context.ellipse(700, 378, 48, 16, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(255,255,255,0.5)';
    context.beginPath();
    context.ellipse(686, 372, 12, 4, -0.4, 0, Math.PI * 2);
    context.fill();
    // A ladle resting in the pot.
    context.strokeStyle = '#8a8a8a';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(722, 366);
    context.lineTo(748, 332);
    context.stroke();
    // Steam.
    context.fillStyle = 'rgba(255,240,220,0.3)';
    for (let index = 0; index < 2; index += 1) {
      const phase = (elapsed * 0.3 + index * 0.5) % 1;
      context.globalAlpha = 0.3 * (1 - phase);
      context.beginPath();
      context.arc(690 + index * 22 + Math.sin(elapsed * 2 + index) * 5, 362 - phase * 36, 6 + phase * 8, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    plainText('BUMBU KACANG', 700, 428, 15, PALETTE.text, 'center');
  }

  function drawCounter(state) {
    // Plating counter: a wooden slab with the plate (or its outline) on it.
    context.fillStyle = PALETTE.stallWoodDark;
    roundRect(context, 660, 500, 300, 96, 10);
    context.fill();
    context.fillStyle = PALETTE.counterTop;
    roundRect(context, 660, 500, 300, 22, 10);
    context.fill();
    if (state.counterPlate) {
      drawPlate(810, 556, state.counterPlate.items, 1);
      plainText(`${state.counterPlate.items.length}/${PLATE_MAX} di piring`, 810, 612, 14, PALETTE.muted, 'center');
    } else {
      context.strokeStyle = 'rgba(255,255,255,0.25)';
      context.setLineDash([5, 5]);
      context.beginPath();
      context.ellipse(810, 556, 62, 26, 0, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
    }
    plainText('MEJA SAJI — susun piring di sini', 810, 488, 15, PALETTE.text, 'center');
  }

  function drawWindow(state) {
    // Serving window: striped awning, warm light, a bell on the counter.
    context.fillStyle = '#7e2129';
    context.fillRect(1040, 300, 220, 260);
    for (let index = 0; index < 5; index += 1) {
      if (index % 2 === 0) {
        context.fillStyle = '#f5efe2';
        context.fillRect(1040 + index * 44, 300, 44, 34);
      }
    }
    context.fillStyle = '#2b1a12';
    context.fillRect(1052, 344, 196, 120);
    const warm = context.createRadialGradient(1150, 404, 8, 1150, 404, 120);
    warm.addColorStop(0, 'rgba(255,190,90,0.55)');
    warm.addColorStop(1, 'rgba(255,190,90,0)');
    context.fillStyle = warm;
    context.fillRect(1052, 344, 196, 120);
    context.fillStyle = PALETTE.counterTop;
    context.fillRect(1052, 464, 196, 18);
    // The service bell.
    context.fillStyle = PALETTE.gold;
    context.beginPath();
    context.arc(1150, 452, 12, Math.PI, 0);
    context.fill();
    context.fillRect(1146, 452, 8, 4);
    plainText('JENDELA ANTAR', 1150, 516, 17, PALETTE.text, 'center');
    plainText('antar piring jadi', 1150, 540, 14, PALETTE.muted, 'center');
  }

  function drawTrash() {
    context.fillStyle = '#3a3f4a';
    roundRect(context, 984, 440, 32, 56, 6);
    context.fill();
    context.fillStyle = '#4a5060';
    roundRect(context, 980, 434, 40, 10, 4);
    context.fill();
    plainText('SAMPAH', 1000, 512, 12, PALETTE.muted, 'center');
  }

  function drawChef(state) {
    const chef = state.chef;
    const x = chef.x;
    const y = chef.y;
    // Soft shadow.
    context.fillStyle = 'rgba(0,0,0,0.35)';
    context.beginPath();
    context.ellipse(x, y + 22, 20, 7, 0, 0, Math.PI * 2);
    context.fill();
    // Body: apron over a shirt.
    context.fillStyle = '#2f6db3';
    roundRect(context, x - 13, y - 6, 26, 30, 8);
    context.fill();
    context.fillStyle = '#f5efe2';
    roundRect(context, x - 10, y + 2, 20, 20, 6);
    context.fill();
    // Head and headband.
    context.fillStyle = '#f2c89b';
    context.beginPath();
    context.arc(x, y - 16, 12, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#c22f2f';
    context.fillRect(x - 12, y - 26, 24, 6);
    // Carried items fanned above the head.
    chef.carrying.forEach((item, index) => {
      const offset = (index - (chef.carrying.length - 1) / 2) * 30;
      if (item.kind === 'plate') drawPlate(x + offset, y - 46, item.items, 0.62);
      else drawItem(x + offset - 26, y - 42, item, 0.5);
    });
  }

  function drawOrderCard(order, x, y, width) {
    const recipe = order.recipe;
    const fraction = clamp01(order.patience / order.maxPatience);
    context.fillStyle = PALETTE.panel;
    roundRect(context, x, y, width, 74, 10);
    context.fill();
    context.strokeStyle = fraction > 0.5 ? 'rgba(143,209,79,0.6)' : fraction > 0.25 ? 'rgba(255,179,71,0.8)' : 'rgba(255,90,78,0.9)';
    context.lineWidth = 2;
    roundRect(context, x, y, width, 74, 10);
    context.stroke();
    text(recipe.name, x + 12, y + 24, 18, PALETTE.text);
    text(`${recipe.coins} koin`, x + width - 12, y + 24, 16, PALETTE.gold, 'right');
    // The recipe as small icons.
    const tokens = [...recipe.needs];
    tokens.forEach((token, index) => {
      const ix = x + 22 + index * 52;
      const iy = y + 52;
      const [kind, sauced] = token.split('+');
      if (SKEWERS[kind]) drawSkewer(ix - 20, iy, kind, sauced ? 'sauced' : 'cooked', 0.34);
      else if (SIDES[kind]) drawSide(ix, iy, kind, 0.55);
    });
    // Patience bar.
    context.fillStyle = 'rgba(0,0,0,0.5)';
    context.fillRect(x + 12, y + 66, width - 24, 5);
    context.fillStyle = fraction > 0.5 ? PALETTE.good : fraction > 0.25 ? PALETTE.warn : PALETTE.bad;
    context.fillRect(x + 12, y + 66, (width - 24) * fraction, 5);
  }

  function drawBoard(state) {
    text('PESANAN', 24, 104, 22, PALETTE.panelEdge);
    const cardWidth = 264;
    const gap = 12;
    for (let index = 0; index < 4; index += 1) {
      const x = 148 + index * (cardWidth + gap);
      const order = state.orders[index];
      if (order) drawOrderCard(order, x, 76, cardWidth);
      else {
        context.fillStyle = 'rgba(255,255,255,0.06)';
        roundRect(context, x, 76, cardWidth, 74, 10);
        context.fill();
        plainText('menunggu pelanggan…', x + cardWidth / 2, 118, 14, PALETTE.muted, 'center');
      }
    }
  }

  function drawHud(state) {
    text('SATE SENJA', 24, 44, 30, PALETTE.text);
    // Hearts.
    for (let index = 0; index < 3; index += 1) {
      const hx = 210 + index * 30;
      context.fillStyle = index < state.hearts ? PALETTE.heart : 'rgba(255,255,255,0.2)';
      context.beginPath();
      context.arc(hx, 34, 10, 0, Math.PI * 2);
      context.fill();
    }
    // Timer in the middle.
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = Math.floor(state.timeLeft % 60);
    const clock = `${minutes}:${String(seconds).padStart(2, '0')}`;
    text(clock, 640, 46, 34, state.timeLeft <= 30 ? PALETTE.bad : PALETTE.text, 'center');
    context.fillStyle = 'rgba(0,0,0,0.45)';
    context.fillRect(520, 56, 240, 6);
    context.fillStyle = state.timeLeft <= 30 ? PALETTE.bad : PALETTE.good;
    context.fillRect(520, 56, 240 * (state.timeLeft / 150), 6);
    text(`Koin ${state.coins}`, 1050, 44, 26, PALETTE.gold, 'right');
    if (state.combo > 1) text(`Kombo x${state.combo}`, 1256, 44, 26, '#ff9d5c', 'right');
    else if (state.combo === 1) text('Kombo x1', 1256, 44, 22, PALETTE.muted, 'right');
  }

  function drawMessage(state) {
    if (state.messageTimer <= 0 || !state.message) return;
    context.fillStyle = 'rgba(20,10,26,0.85)';
    const width = 520;
    roundRect(context, (FIELD.width - width) / 2, 668, width, 36, 18);
    context.fill();
    plainText(state.message, FIELD.width / 2, 692, 17, PALETTE.text, 'center');
  }

  function drawTitleBanner(state) {
    // A slim banner across the top of the floor: the kitchen stays fully visible.
    context.fillStyle = 'rgba(30,16,36,0.88)';
    roundRect(context, 340, 158, 600, 84, 12);
    context.fill();
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 2;
    roundRect(context, 340, 158, 600, 84, 12);
    context.stroke();
    text('SATE SENJA', 640, 196, 34, PALETTE.text, 'center');
    plainText('Bakar sate di atas arang, celup bumbu kacang, antar sebelum waktu habis!', 640, 222, 16, PALETTE.muted, 'center');
    plainText('Gerak: WASD / panah / klik  •  Gunakan: E  •  Jeda: P  •  Tekan Spasi atau klik untuk mulai', 640, 258, 15, PALETTE.gold, 'center');
  }

  function drawPaused() {
    context.fillStyle = 'rgba(10,6,18,0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    text('JEDA', 640, 330, 52, PALETTE.text, 'center');
    plainText('Tekan P atau Spasi untuk lanjut', 640, 372, 18, PALETTE.muted, 'center');
  }

  function drawOver(state, best) {
    context.fillStyle = 'rgba(10,6,18,0.78)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    roundRect(context, 390, 190, 500, 300, 16);
    context.fill();
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 2;
    roundRect(context, 390, 190, 500, 300, 16);
    context.stroke();
    text('MALAM SELESAI', 640, 252, 40, PALETTE.text, 'center');
    text(`${state.coins} koin`, 640, 312, 34, PALETTE.gold, 'center');
    plainText(`${state.served} pesanan terantar  •  ${state.burnt} sate gosong`, 640, 348, 18, PALETTE.muted, 'center');
    plainText(`Terbaik ${Math.max(best, state.coins)} koin`, 640, 382, 18, PALETTE.text, 'center');
    plainText('Tekan Spasi untuk main lagi', 640, 440, 18, PALETTE.gold, 'center');
  }

  function draw(state, screen, best) {
    resize();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.duskTop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    // The ambient clock runs on real time, so the dusk, smoke and embers animate even
    // while the world itself is frozen on the title screen.
    const ambient = performance.now() / 1000;
    drawDusk(ambient);
    drawFloor();
    drawBins(state);
    drawGrill(state, ambient);
    drawSauce(state, ambient);
    drawCounter(state);
    drawWindow(state);
    drawTrash();
    drawChef(state);
    drawBoard(state);
    drawHud(state);
    drawMessage(state);
    if (screen === SCREEN_TITLE) drawTitleBanner(state);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
  }

  return { draw, toField };
}
