// Sate Senja — a make.fun best-cooking-game entry (Node 22, standard library only).
// The game is this directory's game/ folder: plain static files a desktop browser loads
// offline (game/index.html and its ES modules, no library, no network request). This
// program hands it in: it copies game/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json, the summary the judge reads, with the
// vendored make.fun library.
//
// The checks below are the entry's own: index.html must exist, screenshots/ must hold
// 3 or 4 images of at most 256 KiB each, and game/ must stay inside the scorer's caps.
// A failure here is a loud refusal, not a quiet hand-in of a broken entry.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const MAX_SHOT_BYTES = 262144;
const MAX_SHOTS = 4;
const MIN_SHOTS = 3;
const MAX_GAME_FILES = 993;
const MAX_GAME_BYTES = 50331648;

function fail(message: string): never {
  throw new Error(`Sate Senja hand-in refused: ${message}`);
}

function countFiles(dir: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      const sub = countFiles(path);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files += 1;
      bytes += stats.size;
    }
  }
  return { files, bytes };
}

// The game itself.
const gameDir = join(here, 'game');
if (!existsSync(join(gameDir, 'index.html'))) fail('game/index.html is missing');
const gameTotals = countFiles(gameDir);
if (gameTotals.files > MAX_GAME_FILES) fail(`game/ holds ${gameTotals.files} files, over the ${MAX_GAME_FILES} cap`);
if (gameTotals.bytes > MAX_GAME_BYTES) fail(`game/ is ${gameTotals.bytes} bytes, over the ${MAX_GAME_BYTES} cap`);

// The screenshots the judge reads.
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');
const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.')).sort();
if (shots.length < MIN_SHOTS || shots.length > MAX_SHOTS) {
  fail(`screenshots/ holds ${shots.length} images, need ${MIN_SHOTS} to ${MAX_SHOTS}`);
}
for (const name of shots) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > MAX_SHOT_BYTES) fail(`screenshots/${name} is ${size} bytes, over the ${MAX_SHOT_BYTES} cap`);
}

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The dossier the judge reads: the kit library rebuilds it from game/ and screenshots/,
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Sate Senja handed in: ${gameTotals.files} game files, ${shots.length} screenshots (${shots.join(', ')}), dossier written to ${out}/dossier.json`);
