// The screenshot scenes behind ?shot=start|play|serve|end. Each one builds the world
// by hand from the real rules — a grill with skewers at different doneness, a plate
// mid-assembly, a cook carrying a finished plate — so the frame is what a real shift
// looks like, and the same seed always gives the same frame. The cover (start) shows
// the whole stall with no modal in the way: only the slim title banner rides across the
// top of the floor.
import { RECIPES } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function recipeById(id) {
  return RECIPES.find((recipe) => recipe.id === id);
}

function makeOrder(id, recipeId, patience) {
  const recipe = recipeById(recipeId);
  return { id, recipe, patience, maxPatience: patience };
}

function skewer(kind, done) {
  return { kind: 'skewer', skewer: kind, done };
}

function side(kind) {
  return { kind: 'side', side: kind };
}

function stageStart(world) {
  world.reset();
  const state = world.state;
  state.elapsed = 4;
  state.timeLeft = 146;
  // Two skewers already sizzling, one waiting for its flip.
  state.grill[0] = { kind: 'ayam', progress: 50, flipped: false, burn: 0 };
  state.grill[1] = { kind: 'sapi', progress: 78, flipped: true, burn: 0 };
  // A plate mid-assembly on the counter: one sauced skewer, one lontong.
  state.counterPlate = { kind: 'plate', items: [skewer('ayam', 'sauced'), side('lontong')] };
  // The cook beside the grill, carrying a raw chicken skewer.
  state.chef.x = 560;
  state.chef.y = 540;
  state.chef.carrying = [skewer('ayam', 'raw')];
  state.orders = [
    makeOrder(1, 'ayam-kacang', 48),
    makeOrder(2, 'sapi-kacang', 40),
    makeOrder(3, 'tahu-kacang', 52),
  ];
  return { screen: SCREEN_TITLE, best: 0 };
}

function stagePlay(world) {
  world.reset();
  const state = world.state;
  state.elapsed = 72;
  state.timeLeft = 78;
  state.coins = 42;
  state.combo = 2;
  state.comboTimer = 18;
  state.served = 3;
  // Grill: one mid-cook, one done, one waiting for its flip.
  state.grill[0] = { kind: 'sapi', progress: 62, flipped: true, burn: 0 };
  state.grill[1] = { kind: 'ayam', progress: 100, flipped: true, burn: 0 };
  state.grill[2] = { kind: 'tahu', progress: 50, flipped: false, burn: 0 };
  // Plate mid-assembly: sauced beef skewer plus cucumber.
  state.counterPlate = { kind: 'plate', items: [skewer('sapi', 'sauced'), side('timun')] };
  // The cook between the grill and the counter, carrying a sauced chicken skewer.
  state.chef.x = 620;
  state.chef.y = 540;
  state.chef.carrying = [skewer('ayam', 'sauced')];
  state.orders = [
    makeOrder(1, 'sapi-kacang', 30),
    makeOrder(2, 'campur', 44),
    makeOrder(3, 'senja', 50),
    makeOrder(4, 'ayam-kacang', 22),
  ];
  return { screen: SCREEN_PLAY, best: 42 };
}

function stageServe(world) {
  world.reset();
  const state = world.state;
  state.elapsed = 96;
  state.timeLeft = 54;
  state.coins = 58;
  state.combo = 3;
  state.comboTimer = 20;
  state.served = 4;
  // One skewer still grilling while the cook serves.
  state.grill[0] = { kind: 'ayam', progress: 84, flipped: true, burn: 0 };
  state.grill[1] = { kind: 'tempe', progress: 34, flipped: false, burn: 0 };
  // The cook below the serving window, carrying a finished Sate Ayam plate.
  state.chef.x = 1150;
  state.chef.y = 600;
  state.chef.carrying = [
    {
      kind: 'plate',
      items: [skewer('ayam', 'sauced'), skewer('ayam', 'sauced'), side('lontong')],
    },
  ];
  state.orders = [
    makeOrder(1, 'ayam-kacang', 38),
    makeOrder(2, 'sapi-kacang', 26),
  ];
  state.message = 'Sate Ayam terantar! +24 koin.';
  state.messageTimer = 2.5;
  return { screen: SCREEN_PLAY, best: 58 };
}

function stageEnd(world) {
  world.reset();
  const state = world.state;
  state.elapsed = 150;
  state.timeLeft = 0;
  state.coins = 96;
  state.served = 7;
  state.burnt = 1;
  state.hearts = 2;
  state.over = true;
  state.orders = [];
  state.chef.x = 640;
  state.chef.y = 580;
  return { screen: SCREEN_OVER, best: 96 };
}

/**
 * Set `world` to the named scene (start, play, serve or end; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  if (name === 'play') return stagePlay(world);
  if (name === 'serve') return stageServe(world);
  if (name === 'end') return stageEnd(world);
  return stageStart(world);
}
