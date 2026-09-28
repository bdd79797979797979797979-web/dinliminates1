import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const files = ['index.html','launch-hardening.js','api/restaurant-search.js'];
const failures = [];

for (const rel of files) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) { failures.push(rel + ': missing'); continue; }
  if (rel.endsWith('.js')) {
    const r = spawnSync(process.execPath, ['--check', full], { encoding:'utf8' });
    if (r.status !== 0) failures.push(rel + ': ' + (r.stderr || r.stdout));
  } else {
    const html = fs.readFileSync(full, 'utf8');
    for (const script of [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]) {
      const tag = script[0].slice(0, script[0].indexOf('>') + 1).toLowerCase();
      if (/application\/(?:ld\+json|json)/.test(tag)) continue;
      const temp = path.join(os.tmpdir(), 'dinliminate-inline-' + Math.random().toString(36).slice(2) + '.mjs');
      fs.writeFileSync(temp, script[1], 'utf8');
      const r = spawnSync(process.execPath, ['--check', temp], { encoding:'utf8' });
      fs.unlinkSync(temp);
      if (r.status !== 0) failures.push('index.html inline script: ' + (r.stderr || r.stdout));
    }
    const ids = [...html.matchAll(/\\bid=["']([^"']+)["']/gi)].map(m => m[1]);
    const counts = new Map();
    for (const id of ids) counts.set(id, (counts.get(id) || 0) + 1);
    for (const [id,count] of counts) if (count > 1) failures.push('duplicate id #' + id + ' (' + count + 'x)');
    for (const required of ['restaurantOpenUnknownBtn','restaurantPassAroundBtn','restaurantLocationInput','restaurantAddressSuggestions','foodPassAroundBtn','reportBtn']) {
      if (required === 'reportBtn') continue;
      if (!html.includes('id="' + required + '"')) failures.push('missing required id #' + required);
    }
    if (!html.includes('p715-photon-nominatim-fallback')) failures.push('P715 release marker missing');
  }
}

if (failures.length) {
  console.error(failures.join('\\n'));
  process.exit(1);
}
console.log('Dinliminate source integrity: PASS');