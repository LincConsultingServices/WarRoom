// One-shot asset compression: PNG/JPG -> WebP, resize >1920px wide.
// Originals are assumed already backed up to public-backup/.
// Output is written next to the original. Original is removed only if the WebP is smaller.

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const MAX_WIDTH = 1920;

const targets = [
  // backgrounds (photographic JPGs)
  { rel: 'assets/images/bg/landing-hall.jpg', alpha: false, quality: 80 },
  { rel: 'assets/images/bg/dashboard-chamber.jpg', alpha: false, quality: 80 },
  { rel: 'assets/images/bg/simulation-stone.jpg', alpha: false, quality: 80 },
  { rel: 'assets/images/bg/warroom-throne.jpg', alpha: false, quality: 80 },
  { rel: 'assets/images/bg/verdict-hall.jpg', alpha: false, quality: 80 },
  // textures
  { rel: 'assets/images/textures/leather.jpg', alpha: false, quality: 78 },
  { rel: 'assets/images/textures/parchment.jpg', alpha: false, quality: 80 },
  { rel: 'assets/images/textures/stone.jpg', alpha: false, quality: 78 },
  { rel: 'assets/images/textures/noise.png', alpha: true, quality: 70 },
  { rel: 'assets/images/textures/vignette.png', alpha: true, quality: 82 },
  // narrator (transparent PNG)
  { rel: 'assets/images/narrator/narrator-idle.png', alpha: true, quality: 82 },
  { rel: 'assets/images/narrator/narrator-speaking.png', alpha: true, quality: 82 },
  { rel: 'assets/images/narrator/narrator-pointing.png', alpha: true, quality: 82 },
  { rel: 'assets/images/narrator/narrator-celebrating.png', alpha: true, quality: 82 },
  { rel: 'assets/images/narrator/narrator-warning.png', alpha: true, quality: 82 },
  { rel: 'assets/images/narrator/narrator-whispering.png', alpha: true, quality: 82 },
  // investor portraits (JPG)
  { rel: 'investors/mother_instinct/portrait.jpg', alpha: false, quality: 82 },
  { rel: 'investors/lord_hustle/portrait.jpg', alpha: false, quality: 82 },
  { rel: 'investors/master_coin/portrait.jpg', alpha: false, quality: 82 },
  { rel: 'investors/spider_strategy/portrait.jpg', alpha: false, quality: 82 },
  { rel: 'investors/hand_execution/portrait.jpg', alpha: false, quality: 82 },
  { rel: 'investors/warden_trust/portrait.jpg', alpha: false, quality: 82 },
  { rel: 'investors/mirror_identity/portrait.jpg', alpha: false, quality: 82 },
  // investor sigils (transparent PNG)
  { rel: 'investors/mother_instinct/sigil.png', alpha: true, quality: 82 },
  { rel: 'investors/lord_hustle/sigil.png', alpha: true, quality: 82 },
  { rel: 'investors/master_coin/sigil.png', alpha: true, quality: 82 },
  { rel: 'investors/spider_strategy/sigil.png', alpha: true, quality: 82 },
  { rel: 'investors/hand_execution/sigil.png', alpha: true, quality: 82 },
  { rel: 'investors/warden_trust/sigil.png', alpha: true, quality: 82 },
  { rel: 'investors/mirror_identity/sigil.png', alpha: true, quality: 82 },
  // placeholders
  { rel: 'placeholder.jpg', alpha: false, quality: 80 },
  { rel: 'placeholder-logo.png', alpha: true, quality: 85 },
  { rel: 'placeholder-user.jpg', alpha: false, quality: 80 },
];

const results = [];

for (const t of targets) {
  const abs = path.join(PUBLIC_DIR, t.rel);
  let stat;
  try { stat = await fs.stat(abs); } catch { results.push({ ...t, status: 'missing' }); continue; }
  const origSize = stat.size;

  const outRel = t.rel.replace(/\.(png|jpe?g)$/i, '.webp');
  const outAbs = path.join(PUBLIC_DIR, outRel);

  const img = sharp(abs);
  const meta = await img.metadata();
  let pipeline = img;
  let resized = false;
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    resized = true;
  }

  // Use near-lossless for transparent textures that demand fidelity (vignette + placeholder-logo small).
  // Use lossy WebP elsewhere.
  await pipeline
    .webp({ quality: t.quality, alphaQuality: 90, effort: 6, smartSubsample: true })
    .toFile(outAbs);

  const newStat = await fs.stat(outAbs);
  const newSize = newStat.size;
  const savedBytes = origSize - newSize;
  const savedPct = (savedBytes / origSize) * 100;

  if (newSize >= origSize) {
    // WebP not smaller â€” discard the WebP, keep the original, leave references alone.
    await fs.unlink(outAbs);
    results.push({ rel: t.rel, origSize, newSize, status: 'kept-original', resized, savedPct: 0, outRel: null });
  } else {
    await fs.unlink(abs);
    results.push({ rel: t.rel, origSize, newSize, status: 'converted', resized, savedPct, outRel, width: meta.width, height: meta.height });
  }
}

// Emit JSON for the next step
const reportPath = path.join(__dirname, 'compression-results.json');
await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
