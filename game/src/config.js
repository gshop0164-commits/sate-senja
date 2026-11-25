// Sate Senja: every tuning number and colour in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends
// on the screen size. A shift lasts 150 seconds; the night rush makes orders arrive faster
// and customers less patient as the evening goes on.

export const FIELD = { width: 1280, height: 720, floorTop: 218, floorBottom: 700 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One shift, in seconds. */
export const SHIFT_SECONDS = 150;

export const HEARTS = 3;

export const CHEF = {
  width: 34,
  height: 44,
  speed: 380,
  carryMax: 3,
};

export const GRILL = {
  slots: 3,
  /** Seconds for a skewer to reach half-done (the flip point). */
  halfSeconds: 4,
  /** Seconds after the flip to reach fully done. */
  doneSeconds: 4,
  /** Seconds past done before the skewer burns. */
  burnSeconds: 4,
};

export const SAUCE = {
  /** Extra coins a sauced skewer earns when its plate is served. */
  bonus: 2,
};

/** Orders: how the night rush builds. */
export const ORDERS = {
  maxOpen: 4,
  firstAt: 2,
  intervalStart: 15,
  intervalEnd: 7,
  patienceStart: 55,
  patienceEnd: 32,
};

/** Skewer kinds the stall sells. `grill` is how it looks on the stick. */
export const SKEWERS = {
  ayam: { name: 'Sate Ayam', label: 'Ayam', meat: '#e8a06a', cooked: '#b45a28', price: 6 },
  sapi: { name: 'Sate Sapi', label: 'Sapi', meat: '#c96a5e', cooked: '#7e2f22', price: 8 },
  tahu: { name: 'Sate Tahu', label: 'Tahu', meat: '#f2e3b3', cooked: '#d9a441', price: 5 },
  tempe: { name: 'Sate Tempe', label: 'Tempe', meat: '#d9b380', cooked: '#a06a2e', price: 5 },
};

/** Side dishes served beside the skewers. */
export const SIDES = {
  lontong: { name: 'Lontong', label: 'Lontong', price: 3 },
  timun: { name: 'Timun', label: 'Timun', price: 2 },
  bawang: { name: 'Bawang', label: 'Bawang', price: 2 },
};

/**
 * The menu: each recipe is a set of items a plate must hold, exactly. A skewer entry is
 * written as "kind+sauce" when it must be dipped in peanut sauce, or "kind" when it is
 * served plain off the grill. Sides are named by their key.
 */
export const RECIPES = [
  {
    id: 'ayam-kacang',
    name: 'Sate Ayam',
    needs: ['ayam+kacang', 'ayam+kacang', 'lontong'],
    coins: 18,
    blurb: 'dua tusuk ayam bumbu kacang, lontong',
  },
  {
    id: 'sapi-kacang',
    name: 'Sate Sapi',
    needs: ['sapi+kacang', 'sapi+kacang', 'timun'],
    coins: 22,
    blurb: 'dua tusuk sapi bumbu kacang, timun segar',
  },
  {
    id: 'campur',
    name: 'Sate Campur',
    needs: ['ayam+kacang', 'sapi+kacang', 'bawang'],
    coins: 24,
    blurb: 'ayam dan sapi bumbu kacang, bawang merah',
  },
  {
    id: 'tahu-kacang',
    name: 'Sate Tahu',
    needs: ['tahu+kacang', 'tahu+kacang', 'lontong', 'timun'],
    coins: 20,
    blurb: 'dua tusuk tahu bumbu kacang, lontong, timun',
  },
  {
    id: 'senja',
    name: 'Sate Senja',
    needs: ['ayam+kacang', 'sapi+kacang', 'tempe+kacang', 'lontong'],
    coins: 30,
    blurb: 'ayam, sapi dan tempe bumbu kacang, lontong',
  },
];

/** A plate holds at most this many items. */
export const PLATE_MAX = 4;

/** Serving quickly after the previous serve builds a combo; the window, in seconds. */
export const COMBO_WINDOW = 25;

/** Best score key in this browser's storage. */
export const BEST_KEY = 'sate-senja.best';

export const PALETTE = {
  duskTop: '#2b1055',
  duskMid: '#7a2a4d',
  duskLow: '#e2703a',
  horizon: '#f7b267',
  stallRoof: '#8e2f38',
  stallRoofDark: '#6e2129',
  stallWood: '#7a5230',
  stallWoodDark: '#5d3d22',
  counter: '#3d2b1f',
  counterTop: '#6b4a2f',
  ember: '#ff7a1a',
  emberHot: '#ffd23f',
  charcoal: '#2b2320',
  smoke: 'rgba(200, 200, 210, 0.35)',
  sauce: '#8a4b12',
  sauceGloss: '#e08a2e',
  plate: '#f5efe2',
  plateRim: '#c9a86a',
  text: '#fff3e0',
  muted: '#d8b48f',
  panel: 'rgba(30, 16, 36, 0.92)',
  panelEdge: '#f7b267',
  good: '#8fd14f',
  warn: '#ffb347',
  bad: '#ff5a4e',
  heart: '#ff5a6e',
  gold: '#ffd23f',
};
