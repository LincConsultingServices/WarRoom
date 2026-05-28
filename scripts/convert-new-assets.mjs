// One-shot conversion of freshly generated assets (Gemini PNG/JPG) -> optimized WebP.
// Run from the WarRoom project root: `node scripts/convert-new-assets.mjs`
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '..', 'public');
const fmt = (n) => (n / 1024).toFixed(1) + ' KB';

async function del(rel) {
  try { await fs.unlink(path.join(PUBLIC, rel)); console.log('  deleted', rel); } catch {}
}

// Center-square crop fraction `frac`, then resize to size×size.
async function squareTexture(srcRel, outRel, { size = 512, frac = 1, greyscale = false, quality = 80 } = {}) {
  const src = path.join(PUBLIC, srcRel);
  const out = path.join(PUBLIC, outRel);
  const before = (await fs.stat(src)).size;
  let pipe = sharp(src);
  if (frac < 1) {
    const m = await pipe.metadata();
    const side = Math.round(Math.min(m.width, m.height) * frac);
    const left = Math.round((m.width - side) / 2);
    const top = Math.round((m.height - side) / 2);
    pipe = sharp(src).extract({ left, top, width: side, height: side });
  }
  pipe = pipe.resize(size, size, { fit: 'cover' });
  if (greyscale) pipe = pipe.greyscale();
  await pipe.webp({ quality, alphaQuality: 90, effort: 6, smartSubsample: true }).toFile(out);
  const after = (await fs.stat(out)).size;
  console.log(`  ${srcRel} -> ${outRel}  ${fmt(before)} -> ${fmt(after)}`);
}

// Portrait: keep full 3:4 frame, just downscale + webp.
async function portrait(srcRel, outRel, { height = 1024, quality = 82 } = {}) {
  const src = path.join(PUBLIC, srcRel);
  const out = path.join(PUBLIC, outRel);
  const before = (await fs.stat(src)).size;
  await sharp(src)
    .resize({ height, withoutEnlargement: true })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toFile(out);
  const after = (await fs.stat(out)).size;
  console.log(`  ${srcRel} -> ${outRel}  ${fmt(before)} -> ${fmt(after)}`);
}

console.log('Textures:');
await squareTexture('assets/images/textures/parchment.jpg', 'assets/images/textures/parchment.webp', { frac: 0.70, quality: 80 });
await squareTexture('assets/images/textures/stone.jpg',     'assets/images/textures/stone.webp',     { quality: 78 });
await squareTexture('assets/images/textures/leather.jpg',   'assets/images/textures/leather.webp',   { quality: 78 });
await squareTexture('assets/images/textures/noise.png',     'assets/images/textures/noise.webp',     { greyscale: true, quality: 70 });

console.log('Portrait:');
await portrait('investors/spider_strategy/portrait.jpg', 'investors/spider_strategy/portrait.webp', {});

console.log('Cleanup raw originals + redundant vignette:');
await del('assets/images/textures/parchment.jpg');
await del('assets/images/textures/stone.jpg');
await del('assets/images/textures/leather.jpg');
await del('assets/images/textures/noise.png');
await del('assets/images/textures/vignette.png'); // CSS radial-gradient in RouteBackground handles vignette
await del('investors/spider_strategy/portrait.jpg');

console.log('Done.');
