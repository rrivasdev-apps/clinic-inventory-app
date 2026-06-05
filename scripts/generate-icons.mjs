/**
 * Generates PWA icons using pure JavaScript (no native deps).
 * Run once: npm run generate-icons
 * Replace the output PNGs with your clinic's branding when ready.
 */
import { PNG } from 'pngjs'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '../public/icons')

mkdirSync(PUBLIC, { recursive: true })

// Clinic brand colours — change these to match your branding
const BG   = { r: 15,  g: 23,  b: 42  }  // slate-900
const FG   = { r: 255, g: 255, b: 255 }  // white
const ACCENT = { r: 59, g: 130, b: 246 } // blue-500

function createIconPng(size) {
  const png = new PNG({ width: size, height: size })

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) * 4

      // Background
      png.data[idx]     = BG.r
      png.data[idx + 1] = BG.g
      png.data[idx + 2] = BG.b
      png.data[idx + 3] = 255

      // Rounded corner mask (simple approximation)
      const radius = size * 0.2
      const cx = size / 2, cy = size / 2
      const dx = Math.abs(x - cx), dy = Math.abs(y - cy)
      const corner = dx > cx - radius && dy > cy - radius
      if (corner && Math.sqrt((dx - (cx - radius)) ** 2 + (dy - (cy - radius)) ** 2) > radius) {
        png.data[idx + 3] = 0  // transparent corner
        continue
      }

      // Blue accent bar at top (20% height)
      if (y < size * 0.22) {
        png.data[idx]     = ACCENT.r
        png.data[idx + 1] = ACCENT.g
        png.data[idx + 2] = ACCENT.b
      }

      // Medical cross in the centre
      const crossW = size * 0.12
      const crossH = size * 0.38
      const cx2 = size / 2, cy2 = size * 0.62
      const inVert = Math.abs(x - cx2) < crossW / 2 && Math.abs(y - cy2) < crossH / 2
      const inHorz = Math.abs(x - cx2) < crossH / 2 && Math.abs(y - cy2) < crossW / 2
      if (inVert || inHorz) {
        png.data[idx]     = FG.r
        png.data[idx + 1] = FG.g
        png.data[idx + 2] = FG.b
      }
    }
  }

  return PNG.sync.write(png)
}

const sizes = [192, 512]
for (const size of sizes) {
  const buf = createIconPng(size)
  writeFileSync(join(PUBLIC, `icon-${size}.png`), buf)
  console.log(`✓ icon-${size}.png`)
}

// Apple Touch Icon (180x180 — iOS home screen)
writeFileSync(join(PUBLIC, 'apple-touch-icon.png'), createIconPng(180))
console.log('✓ apple-touch-icon.png')

console.log('\nDone. Replace these with your clinic branding when ready.')
