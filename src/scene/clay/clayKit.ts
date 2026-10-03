import { BufferAttribute, CanvasTexture, Color, RepeatWrapping, SphereGeometry, SRGBColorSpace, Vector3, type BufferGeometry, type Texture } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Tools for the clay "toy universe" look. Everything is generated in code: lumpy
 * hand-sculpted spheres with painted vertex colours, and a fine grain bump map.
 */

// ── small 3D value noise (deterministic, good enough for clay lumps) ─────────
function hash(x: number, y: number, z: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const fade = (t: number) => t * t * (3 - 2 * t)
export function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z)
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi)
  const l = (a: number, b: number, t: number) => a + (b - a) * t
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz)
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
    l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  ) * 2 - 1
}
export const fbm = (p: Vector3, octaves = 3) => {
  let s = 0, a = 0.5, f = 1
  for (let i = 0; i < octaves; i++) {
    s += a * noise3(p.x * f, p.y * f, p.z * f)
    a *= 0.5
    f *= 2.03
  }
  return s
}

export type Painter = (dir: Vector3, out: Color) => number | void

/**
 * A sculpted clay ball: an icosphere pushed in and out by low-frequency noise (thumb
 * presses), coloured per vertex by `paint`. `paint` may return an extra height offset,
 * e.g. to raise continents.
 */
export function clayBall({
  detail = 4,
  lumps = 0.035,
  seed = 1,
  paint,
}: {
  detail?: number
  lumps?: number
  seed?: number
  paint: Painter
}): BufferGeometry {
  // A UV sphere (so painted textures map cleanly), vertices welded except at the UV seam.
  const geo = mergeVertices(new SphereGeometry(1, 32 * detail, 20 * detail))
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const v = new Vector3()
  const p = new Vector3()
  const c = new Color()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize()
    p.copy(v).multiplyScalar(1.6).addScalar(seed * 7.13)
    const lift = (paint(v, c) as number | undefined) ?? 0
    const d = 1 + fbm(p, 3) * lumps + lift
    v.multiplyScalar(d)
    pos.setXYZ(i, v.x, v.y, v.z)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  geo.setAttribute('color', new BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

const geoCache = new Map<string, BufferGeometry>()
/** clayBall, built once per key (components may remount while suspending). */
export function cachedClayBall(key: string, opts: Parameters<typeof clayBall>[0]) {
  let g = geoCache.get(key)
  if (!g) geoCache.set(key, (g = clayBall(opts)))
  return g
}

/** URL of a body's pre-painted clay texture. */
export const clayMapUrl = (id: string) => `/textures/clay/${id}.webp`

/** A pre-painted clay texture (see scripts/clay-textures.ts), set up for a sphere. */
export function prepClayMap(tex: Texture) {
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** Fine, slightly streaky grain, like clay worked by fingers. Shared by all clay materials. */
let grain: CanvasTexture | null = null
export function clayGrain() {
  if (grain) return grain
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n =
        noise3(x * 0.09, y * 0.09, 0.5) * 0.5 + noise3(x * 0.33, y * 0.12, 3.1) * 0.35 + noise3(x * 0.8, y * 0.8, 9.7) * 0.15
      const g = Math.round(128 + n * 110)
      const k = (y * size + x) * 4
      img.data[k] = img.data[k + 1] = img.data[k + 2] = g
      img.data[k + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  grain = new CanvasTexture(canvas)
  grain.wrapS = grain.wrapT = RepeatWrapping
  grain.repeat.set(3, 2)
  return grain
}

/** Toy palette. */
export const clay = {
  sky: { top: '#140f33', mid: '#2a1d55', horizon: '#4f2a63' },
  sun: '#ffc34d',
  sunCore: '#fff0b8',
}
