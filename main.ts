// The Leonida Field Guide — hand-in program for the make.fun bounty
// "Build the best GTA 6 trophy guide" (gta6-trophy-guide-01), Node 22,
// standard library only.
//
// The guide itself is the app/ folder beside this file: plain static files
// (app/index.html, css/, js/, data/trophies.json) that open in a browser and
// work with the network off. This program hands it in: it copies app/ and
// screenshots/ into the output directory and writes dossier.json there with
// buildDossier from vendor/makefun-frontend.ts — the vendored library stays
// byte-unchanged, because the scorer rebuilds the dossier with its own copy
// and compares the two byte for byte.
//
// After the hand-in it prints a one-line summary of what was handed in
// (trophies named, screenshots shipped), read back from the output itself,
// so a local run shows at a glance that the entry is whole.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps, passed to the library so a local run refuses
// anything the scorer would refuse: at most 4 screenshots of at most
// 256 KiB each, at most 993 files and directories in app/, 48 MiB of app.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

// A read-back summary of the handed-in entry, printed for the local runner:
// how many of the trophies carry a guide, how many of those PlayStation hides
// until earned, how many carry a progress counter, and the screenshot count.
function summariseEntry(outputDir) {
  const data = JSON.parse(readFileSync(join(outputDir, 'app', 'data', 'trophies.json'), 'utf8'));
  const trophies = Array.isArray(data) ? data : data.trophies;
  const guided = trophies.filter((trophy) => typeof trophy.guide === 'string' && trophy.guide.trim()).length;
  const hidden = trophies.filter((trophy) => trophy.hidden === true).length;
  const counted = trophies.filter((trophy) => typeof trophy.target === 'number').length;
  const shots = readdirSync(join(outputDir, 'screenshots')).filter((name) => /\.(png|jpe?g)$/i.test(name)).length;
  console.log(
    `leonida-field-guide: ${guided}/${trophies.length} trophies with guides (${hidden} hidden, ${counted} counted), ${shots} screenshots handed in`,
  );
}

summariseEntry(out);
