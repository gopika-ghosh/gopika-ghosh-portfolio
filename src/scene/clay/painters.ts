import { Color, Vector3 } from 'three'
import type { BodyId } from '../../config/bodies'
import { fbm, noise3, type Painter } from './clayKit'

/**
 * Each body's clay "paint job" (vertex colours + optional relief), in a toy palette:
 * saturated but soft, like modelling clay.
 */
const C = (hex: string) => new Color(hex)
const _p = new Vector3()

/** Latitude bands with a hand-wobbled edge. */
function bands(stops: [number, string][], wobble = 0.06, freq = 2.5): Painter {
  const cols = stops.map(([t, hex]) => [t, C(hex)] as const)
  return (d, out) => {
    const lat = d.y + noise3(d.x * freq, d.y * freq, d.z * freq) * wobble
    const t = (lat + 1) / 2
    let k = 0
    while (k < cols.length - 1 && t > cols[k + 1][0]) k++
    out.copy(cols[k][1])
  }
}

export const painters: Partial<Record<BodyId, Painter>> = {
  sun: (d, out) => {
    const n = fbm(_p.copy(d).multiplyScalar(2.4).addScalar(1.7), 3)
    out.copy(C('#ffc13d'))
    if (n > 0.08) out.copy(C('#ffa22a'))
    if (n > 0.26) out.copy(C('#ff8a1f'))
    if (n < -0.22) out.copy(C('#ffe17a'))
  },
  mercury: (d, out) => {
    const n = fbm(_p.copy(d).multiplyScalar(4), 3)
    out.copy(C('#b7aca6')).lerp(C('#8c7f7a'), n > 0.12 ? 1 : 0)
    // Thumb-press craters.
    return n > 0.25 ? -0.03 : 0
  },
  venus: bands([[0, '#e8b77a'], [0.3, '#f2cf96'], [0.55, '#e3a86a'], [0.8, '#f5d9a8']], 0.12, 1.6),
  earth: (d, out) => {
    const n = fbm(_p.copy(d).multiplyScalar(1.8).addScalar(3.3), 4)
    const land = n > 0.04
    if (Math.abs(d.y) > 0.84) {
      out.copy(C('#f4f1ec')) // ice caps
      return 0.012
    }
    if (land) {
      out.copy(n > 0.2 ? C('#4fa463') : C('#6cc27a'))
      return 0.035 // continents sit proud of the sea, like pressed-on clay
    }
    out.copy(C('#3d86e8'))
    return 0
  },
  mars: (d, out) => {
    const n = fbm(_p.copy(d).multiplyScalar(2.6), 3)
    out.copy(C('#e0703f')).lerp(C('#b84f2c'), n > 0.1 ? 1 : 0)
    if (d.y > 0.88) out.copy(C('#fbe9df'))
    return n > 0.1 ? -0.02 : 0
  },
  jupiter: (d, out) => {
    bands(
      [[0, '#d9a77a'], [0.18, '#f3e1c4'], [0.32, '#c98a5c'], [0.45, '#f6e7cf'], [0.55, '#d79a68'], [0.68, '#f3dfc0'], [0.82, '#c58a60'], [0.92, '#efd9b9']],
      0.05,
      3,
    )(d, out)
    // The great red spot: a pressed-in blob.
    const spot = Math.hypot(d.x - 0.78, d.y + 0.32, d.z - 0.52)
    if (spot < 0.2) {
      out.copy(C('#d4583a'))
      return -0.015
    }
  },
  saturn: bands([[0, '#e2c592'], [0.25, '#f2e0b8'], [0.45, '#d6b47e'], [0.6, '#f4e6c6'], [0.8, '#dcbf8b']], 0.04, 3),
  uranus: bands([[0, '#8fe0e0'], [0.5, '#a8ecea'], [0.75, '#94e2e3']], 0.05, 2),
  neptune: (d, out) => {
    bands([[0, '#3f66e0'], [0.35, '#5280ee'], [0.6, '#3a5ed6'], [0.8, '#4f7bea']], 0.06, 2.4)(d, out)
    const storm = Math.hypot(d.x + 0.6, d.y - 0.25, d.z - 0.7)
    if (storm < 0.16) out.copy(C('#22388f'))
  },
}

/** Ring stripes for clay Saturn: [inner fraction, colour]. */
export const ringStripes: [number, string][] = [
  [0, '#cdb38a'],
  [0.18, '#e9d6ad'],
  [0.42, '#bfa073'],
  [0.5, '#2a1f3a'], // Cassini gap
  [0.55, '#e3cda2'],
  [0.82, '#c9ab7c'],
]
