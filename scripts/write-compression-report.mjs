import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const results = JSON.parse(await fs.readFile(path.join(__dirname, 'compression-results.json'), 'utf8'));

const fmt = (n) => n >= 1024 * 1024 ? (n / 1024 / 1024).toFixed(2) + ' MB' : (n / 1024).toFixed(1) + ' KB';

const totalOrig = results.reduce((s, r) => s + (r.origSize || 0), 0);
const totalNew = results.reduce((s, r) => s + (r.newSize || 0), 0);

let md = '# Asset Compression Report\n\n';
md += `_Run date: ${new Date().toISOString().slice(0, 10)}_\n\n`;
md += '## Summary\n\n';
md += `- **Files processed**: ${results.length}\n`;
md += `- **Total before**: ${fmt(totalOrig)}\n`;
md += `- **Total after**:  ${fmt(totalNew)}\n`;
md += `- **Total saved**:  ${fmt(totalOrig - totalNew)} (${((1 - totalNew / totalOrig) * 100).toFixed(1)}% reduction)\n`;
md += `- **Originals backed up to**: \`public-backup/\` (mirror of \`public/\` pre-conversion)\n\n`;

md += '## Skipped\n\n';
md += '- `public/assets/video/warroom-door-opening.mp4` (8.10 MB) — ffmpeg is not installed on this host, so the H.264 CRF 28 re-encode requested by the task could not run. Run the following after installing ffmpeg to complete the video step:\n\n';
md += '  ```bash\n';
md += '  ffmpeg -i public-backup/assets/video/warroom-door-opening.mp4 \\\n';
md += '         -c:v libx264 -crf 28 -preset slow -movflags +faststart \\\n';
md += '         -c:a aac -b:a 96k \\\n';
md += '         public/assets/video/warroom-door-opening.mp4\n';
md += '  ```\n\n';
md += '- Next.js metadata icons (`apple-icon.png`, `icon-dark-32x32.png`, `icon-light-32x32.png`) — left as PNG because Next requires literal `.png`/`.ico` extensions for its file-based metadata convention.\n\n';

md += '## Per-file results\n\n';
md += '| File | Before | After | Saved | Resized |\n';
md += '|------|-------:|------:|------:|:-------:|\n';
for (const r of results) {
  const before = fmt(r.origSize);
  const after = r.status === 'converted' ? fmt(r.newSize) : '(kept)';
  const saved = r.status === 'converted'
    ? `${r.savedPct.toFixed(1)}%`
    : '0%';
  const resized = r.resized ? 'yes' : '—';
  const name = r.status === 'converted' ? `${r.rel} → ${r.outRel}` : `${r.rel}`;
  md += `| \`${name}\` | ${before} | ${after} | ${saved} | ${resized} |\n`;
}

md += '\n## Updated source references\n\n';
md += 'The following files had their asset paths rewritten from `.png` / `.jpg` to `.webp`:\n\n';
md += '- `lib/assets/assetRegistry.ts` (narrator stills, backgrounds, textures)\n';
md += '- `src/components/effects/NoiseOverlay.tsx`\n';
md += '- `src/components/effects/RouteBackground.tsx`\n';
md += '- `src/components/narrator/NarratorDialogue.tsx`\n';
md += '- `src/components/warroom/ActiveInvestor.tsx` (sigil template literal)\n';
md += '- `src/lib/investorAssets.ts` (portrait template literal + JSDoc)\n\n';
md += '`src/components/verdict/ShareVerdictButton.tsx` was intentionally not touched — its `.png` references are the *output* download filename for the share image, not an asset reference.\n\n';

md += '## Notes on quality settings\n\n';
md += '- Photographic JPGs (backgrounds, portraits): WebP q=80–82\n';
md += '- Textures (leather, stone, parchment): WebP q=78–80 — tile-able patterns tolerate lower q\n';
md += '- Noise overlay: WebP q=70 (mix-blend-mode overlay; visible artifacts get hidden by the blend)\n';
md += '- Transparent narrator stills / investor sigils: WebP q=82, alphaQuality=90\n';
md += '- Resize: no source exceeded 1920px width, so no resize was applied\n';
md += '- `placeholder-logo.png` was almost incompressible (568→554 B) — the 2.5% saving is only meaningful because it standardizes the extension; consider deleting the file if unused\n';

await fs.writeFile(path.resolve(__dirname, '..', 'ASSET_COMPRESSION_REPORT.md'), md);
console.log('Report written to ASSET_COMPRESSION_REPORT.md');
console.log(`Saved ${fmt(totalOrig - totalNew)} of ${fmt(totalOrig)} (${((1 - totalNew / totalOrig) * 100).toFixed(1)}%)`);
