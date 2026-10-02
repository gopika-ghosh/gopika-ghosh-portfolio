import { suspend } from 'suspend-react'
import { CanvasTexture, SRGBColorSpace, type Texture } from 'three'

/**
 * Turns a project thumbnail into a moon surface, in the browser — no build step, so it
 * always matches the current thumbnail.
 *
 * The square image is drawn twice side by side on a 2:1 canvas (an equirectangular wrap,
 * so it reads all the way round with no seam), and the poles are shaded where sphere
 * mapping pinches the image.
 */
const W = 512
const H = 256

const cache = new Map<string, Texture>()

async function build(src: string): Promise<Texture> {
  const img = new Image()
  img.src = src
  await img.decode()

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  // Fill the square from the image's centre (handles non-square thumbnails too).
  const side = Math.min(img.naturalWidth, img.naturalHeight)
  const sx = (img.naturalWidth - side) / 2
  const sy = (img.naturalHeight - side) / 2
  ctx.drawImage(img, sx, sy, side, side, 0, 0, H, H)
  ctx.drawImage(img, sx, sy, side, side, H, 0, H, H)

  // Polar shading: hides the pinch and gives the moon some volume.
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, 'rgba(10,8,12,0.85)')
  g.addColorStop(0.18, 'rgba(10,8,12,0)')
  g.addColorStop(0.82, 'rgba(10,8,12,0)')
  g.addColorStop(1, 'rgba(10,8,12,0.85)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Moon textures for these thumbnails, suspending until all are ready. */
export function useWorkTextures(thumbnails: string[]): Texture[] {
  return suspend(async () => {
    const list = await Promise.all(
      thumbnails.map(async (src) => {
        if (!cache.has(src)) cache.set(src, await build(src))
        return cache.get(src)!
      }),
    )
    return list
  }, ['work-moons', ...thumbnails])
}
