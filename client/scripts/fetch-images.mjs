/**
 * Downloads the site photos listed in src/lib/site.js into public/images/<name>.jpg
 * so they are served from your own domain. Existing files are kept (your own photos win).
 * Usage: npm run images        (add --force to re-download)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGES, imageRemote } from '../src/lib/site.js';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/images');
fs.mkdirSync(dir, { recursive: true });
const force = process.argv.includes('--force');

for (const name of Object.keys(IMAGES)) {
  const out = path.join(dir, `${name}.jpg`);
  if (fs.existsSync(out) && !force) {
    console.log(`skip  ${name}.jpg (exists)`);
    continue;
  }
  try {
    const res = await fetch(imageRemote(name, 1800));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
    console.log(`saved ${name}.jpg`);
  } catch (e) {
    console.log(`FAIL  ${name}: ${e.message}. Replace the id in src/lib/site.js or add your own public/images/${name}.jpg`);
  }
}
