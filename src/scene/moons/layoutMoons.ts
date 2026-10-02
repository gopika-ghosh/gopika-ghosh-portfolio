/**
 * Procedural moon layout: turns a list of works into balanced orbits around a planet.
 *
 * Pure and deterministic — the same works always give the same layout, and adding
 * one work doesn't reshuffle the others' phases (they're seeded from each work's id).
 *
 *  - Visible set: if there are more works than `maxVisible`, show the featured ones
 *    first, then a "+N" moon standing in for the rest.
 *  - Shells: moons are spread over concentric shells; shell k holds 4 + k moons,
 *    so outer (longer) orbits carry more.
 *  - Phase: evenly spaced within a shell, each shell rotated by the golden angle
 *    so moons on different shells never line up, plus a little seeded jitter.
 *  - Inclination: each shell is tilted a few degrees, alternating sign, with its
 *    tilt axis rotated per shell — the system reads as 3D and orbits never overlap.
 *  - Speed: Kepler-like (ω ∝ r^-1.5), so inner moons visibly lead outer ones.
 */

export interface MoonInput {
  id: string
  featured?: boolean
}

export interface MoonSlot {
  /** Work id, or MORE_ID for the "+N" moon. */
  id: string
  shell: number
  /** Orbit radius (scene units). */
  radius: number
  /** Starting angle (radians). */
  phase: number
  /** Angular speed (radians / second). */
  speed: number
  /** Orbit tilt (radians) and the direction of the tilt axis in the equatorial plane. */
  inclination: number
  node: number
  /** Moon sphere radius (scene units). */
  size: number
}

export interface MoonLayout {
  slots: MoonSlot[]
  /** Works without a moon (shown via the "+N" moon and the grid). */
  overflow: string[]
  /** Outermost orbit radius — used to frame the camera. */
  extent: number
}

export const MORE_ID = '__more__'

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
/** Seconds for one orbit of the innermost shell. */
const INNER_PERIOD = 70

/** FNV-1a hash → [0, 1). Stable per id. */
function hash01(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}

export function layoutMoons(works: MoonInput[], planetRadius: number, maxVisible = 8): MoonLayout {
  // Featured first, otherwise keep the content order.
  const ordered = [...works].sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
  const overflowing = ordered.length > maxVisible
  const shown = overflowing ? ordered.slice(0, Math.max(0, maxVisible - 1)) : ordered
  const overflow = overflowing ? ordered.slice(shown.length).map((w) => w.id) : []
  const ids = shown.map((w) => w.id)
  if (overflowing) ids.push(MORE_ID)

  // Moon size scales with the planet but stays readable on small ones and modest on giants.
  const baseSize = Math.min(0.3, Math.max(0.09, planetRadius * 0.13))
  const innerRadius = planetRadius * 1.9 + baseSize * 2
  const shellGap = Math.max(planetRadius * 0.85, baseSize * 6)

  const slots: MoonSlot[] = []
  let index = 0
  for (let shell = 0; index < ids.length; shell++) {
    const capacity = 4 + shell
    const inShell = ids.slice(index, index + capacity)
    const radius = innerRadius + shell * shellGap
    const sign = shell % 2 === 0 ? 1 : -1
    const inclination = sign * (4 + shell * 3) * (Math.PI / 180)
    const node = shell * 2.4
    const speed = ((Math.PI * 2) / INNER_PERIOD) * Math.pow(radius / innerRadius, -1.5)
    const step = (Math.PI * 2) / inShell.length

    inShell.forEach((id, i) => {
      const jitter = (hash01(id) - 0.5) * step * 0.3
      const featured = shown.find((w) => w.id === id)?.featured
      slots.push({
        id,
        shell,
        radius,
        phase: i * step + shell * GOLDEN_ANGLE + jitter,
        speed,
        inclination,
        node,
        size: baseSize * (featured ? 1.3 : 1),
      })
    })
    index += inShell.length
  }

  const extent = slots.reduce((m, s) => Math.max(m, s.radius + s.size), planetRadius)
  return { slots, overflow, extent }
}
