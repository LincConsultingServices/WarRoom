// Quick client-bundle report — works on any build (Turbopack or webpack),
// unlike @next/bundle-analyzer's webpack-only treemap.
//
// Usage:  npm run build  &&  node scripts/analyze-bundle.mjs
// Scans .next/static/chunks, reports total shipped JS (raw + gzip) and the
// largest chunks, then probes the biggest ones for known heavy dependencies
// so you can decide what to code-split. For named per-module detail, run the
// analyzer on a webpack build:  ANALYZE=true next build --webpack

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const CHUNKS = path.join('.next', 'static', 'chunks')
if (!fs.existsSync(CHUNKS)) {
  console.error('No .next/static/chunks — run `npm run build` first.')
  process.exit(1)
}

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name)
    if (e.isDirectory()) return walk(p)
    return e.name.endsWith('.js') ? [p] : []
  })

const KNOWN = ['recharts', 'framer-motion', 'motion-dom', 'howler', 'firebase', '@floating-ui', 'lucide', 'react-dom', 'scheduler', 'zustand']

const files = walk(CHUNKS).map((p) => {
  const buf = fs.readFileSync(p)
  const text = buf.toString('utf8')
  return { name: path.relative(CHUNKS, p), raw: buf.length, gz: zlib.gzipSync(buf).length, libs: KNOWN.filter((l) => text.includes(l)) }
})

const totRaw = files.reduce((a, b) => a + b.raw, 0)
const totGz = files.reduce((a, b) => a + b.gz, 0)
files.sort((a, b) => b.gz - a.gz)

const kb = (n) => (n / 1024).toFixed(1)
console.log(`\nClient JS — ${files.length} chunks · raw ${(totRaw / 1024 / 1024).toFixed(2)}MB · gzip ${kb(totGz)}KB\n`)
console.log('GZIP'.padStart(9) + 'RAW'.padStart(9) + '  CHUNK / detected libs')
for (const f of files.slice(0, 12)) {
  console.log(kb(f.gz).padStart(9) + kb(f.raw).padStart(9) + '  ' + (f.libs.length ? f.libs.join(', ') : f.name.slice(0, 40)))
}
