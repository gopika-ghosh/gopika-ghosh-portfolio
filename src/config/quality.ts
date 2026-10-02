/**
 * Rendering budgets per device class. Phase 5 refines detection; for now
 * touch-first or small screens get the lighter tier.
 */
export interface Quality {
  tier: 'high' | 'low'
  /** Load 4K maps for hero planets as the camera approaches them. */
  hiResTextures: boolean
  starDensity: number
  asteroids: { count: number; cluster: number }
  /** MSAA samples in the post-processing composer. */
  msaa: number
  bloom: boolean
  grain: boolean
  maxDpr: number
}

const isLowEnd =
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 600)

export const quality: Quality = isLowEnd
  ? {
      tier: 'low',
      hiResTextures: false,
      starDensity: 0.55,
      asteroids: { count: 900, cluster: 160 },
      msaa: 0,
      bloom: true,
      grain: false,
      maxDpr: 1.5,
    }
  : {
      tier: 'high',
      hiResTextures: true,
      starDensity: 1,
      asteroids: { count: 2200, cluster: 320 },
      msaa: 4,
      bloom: true,
      grain: true,
      maxDpr: 2,
    }
