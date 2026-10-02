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
  /** Bloom blur levels (mipmap chain depth); fewer is cheaper and tighter. */
  bloomLevels: number
  bloom: boolean
  grain: boolean
  maxDpr: number
}

// ?quality=low|high overrides detection (handy for testing and for very old laptops).
const forced = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('quality')
const isLowEnd =
  forced === 'low' ||
  (forced !== 'high' &&
    typeof window !== 'undefined' &&
    (window.matchMedia('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 600))

export const quality: Quality = isLowEnd
  ? {
      tier: 'low',
      hiResTextures: false,
      starDensity: 0.55,
      asteroids: { count: 420, cluster: 50 },
      bloomLevels: 4,
      bloom: true,
      grain: false,
      maxDpr: 1.5,
    }
  : {
      tier: 'high',
      hiResTextures: false,
      starDensity: 1,
      asteroids: { count: 900, cluster: 90 },
      bloomLevels: 5,
      bloom: true,
      grain: true,
      maxDpr: 2,
    }
