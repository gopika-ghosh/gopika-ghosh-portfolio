/**
 * Pre-paints the clay theme's planet textures (equirectangular WebP) from the painters in
 * src/scene/clay/painters.ts, so the browser doesn't spend seconds painting them on load.
 *
 *   npm run clay-textures
 *
 * Re-run after changing a painter. Output: public/textures/clay/<body>.webp
 */
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'
import { Color, Vector3 } from 'three'
import { painters } from '../src/scene/clay/painters'

/** Width per body (height is half). Hero close-ups get more pixels. */
const SIZES: Record<string, number> = { earth: 2048, jupiter: 2048, saturn: 2048, sun: 1024 }

await mkdir('public/textures/clay', { recursive: true })
const d = new Vector3()
const c = new Color()
for (const [id, paint] of Object.entries(painters)) {
  if (!paint) continue
  const w = SIZES[id] ?? 1024
  const h = w / 2
  const px = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) {
    const theta = ((y + 0.5) / h) * Math.PI
    const st = Math.sin(theta)
    for (let x = 0; x < w; x++) {
      const phi = ((x + 0.5) / w) * Math.PI * 2
      // Same mapping as three's SphereGeometry UVs.
      d.set(-Math.cos(phi) * st, Math.cos(theta), Math.sin(phi) * st)
      paint(d, c)
      c.convertLinearToSRGB()
      const k = (y * w + x) * 3
      px[k] = Math.round(c.r * 255)
      px[k + 1] = Math.round(c.g * 255)
      px[k + 2] = Math.round(c.b * 255)
    }
  }
  const out = `public/textures/clay/${id}.webp`
  await sharp(px, { raw: { width: w, height: h, channels: 3 } }).webp({ quality: 88 }).toFile(out)
  console.log(`  ${out} (${w}×${h})`)
}
