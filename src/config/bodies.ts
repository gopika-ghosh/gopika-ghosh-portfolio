/**
 * Physical layout of the (stylised) solar system.
 *
 * Real proportions are unusable on screen, so distances are compressed
 * and sizes exaggerated. Units are arbitrary "scene units"; the Sun has radius 6.
 * Nothing in here is content — the journey and copy live in src/content/.
 */

import type { TextureSpec } from '../scene/textures'

export type BodyId =
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'asteroids'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'

export interface BodyDef {
  id: BodyId
  /** `belt` is a virtual body: a point riding the asteroid belt that the camera can visit. */
  kind: 'star' | 'planet' | 'belt'
  radius: number
  orbitRadius: number
  /** Orbital angle at t = 0 (radians). Chosen so planets start on a loose outward spiral. */
  startAngle: number
  /** Axial tilt in degrees. */
  tilt: number
  /** Self-rotation speed, radians per second. */
  spin: number
  /** Grey-box colour (replaced by textures/shaders in phase 2). */
  color: string
  rings?: { inner: number; outer: number }
  look?: BodyLook
}

export interface BodyLook {
  /** `map` is required; Earth also uses night / clouds / specular. */
  textures: { map: TextureSpec } & Partial<Record<'night' | 'clouds' | 'specular' | 'rings', TextureSpec>>
  /** Atmosphere tint (linear-ish RGB hex) and strength. Omit for airless bodies. */
  atmosphere?: { color: string; strength: number; shell: number }
  /** Brightness multiplier for the sunlit side (bright gas giant maps need less). Default 1. */
  exposure?: number
}

const color = (name: string, hero = false): TextureSpec => ({ name, kind: 'color', hero })

/** Earth's orbital period in seconds; others follow Kepler's 3rd law from it. */
const EARTH_PERIOD = 720
const EARTH_ORBIT = 25

/** Angular speed (rad/s) for a body at the given orbit radius. */
export function keplerSpeed(orbitRadius: number) {
  if (orbitRadius === 0) return 0
  return (Math.PI * 2) / (EARTH_PERIOD * Math.pow(orbitRadius / EARTH_ORBIT, 1.5))
}

export const bodies: Record<BodyId, BodyDef> = {
  sun: { id: 'sun', kind: 'star', radius: 6, orbitRadius: 0, startAngle: 0, tilt: 7, spin: 0.02, color: '#ffb35c' },
  mercury: { id: 'mercury', kind: 'planet', radius: 0.55, orbitRadius: 14, startAngle: 0.2, tilt: 0, spin: 0.05, color: '#9a8f86', look: { textures: { map: color('mercury') } } },
  venus: { id: 'venus', kind: 'planet', radius: 0.95, orbitRadius: 19, startAngle: 0.85, tilt: 177, spin: -0.02, color: '#d8b27a', look: { exposure: 0.75, textures: { map: color('venus') }, atmosphere: { color: '#ffd9a0', strength: 0.9, shell: 1.05 } } },
  earth: {
    id: 'earth', kind: 'planet', radius: 1.05, orbitRadius: EARTH_ORBIT, startAngle: 1.45, tilt: 23.4, spin: 0.12, color: '#3f73c9',
    look: {
      textures: {
        map: color('earth_day', true),
        night: color('earth_night', true),
        clouds: { name: 'earth_clouds', kind: 'data', hero: true },
        specular: { name: 'earth_specular', kind: 'data' },
      },
      atmosphere: { color: '#4f9bff', strength: 1.4, shell: 1.045 },
    },
  },
  mars: { id: 'mars', kind: 'planet', radius: 0.75, orbitRadius: 31, startAngle: 2.05, tilt: 25, spin: 0.11, color: '#b8573a', look: { textures: { map: color('mars', true) }, atmosphere: { color: '#ff9a6e', strength: 0.45, shell: 1.03 } } },
  asteroids: { id: 'asteroids', kind: 'belt', radius: 2.2, orbitRadius: 40, startAngle: 2.6, tilt: 0, spin: 0, color: '#6f665d' },
  jupiter: { id: 'jupiter', kind: 'planet', radius: 3.4, orbitRadius: 54, startAngle: 3.1, tilt: 3, spin: 0.2, color: '#c9a27e', look: { exposure: 0.62, textures: { map: color('jupiter', true) }, atmosphere: { color: '#ffd7a8', strength: 0.4, shell: 1.03 } } },
  saturn: {
    id: 'saturn', kind: 'planet', radius: 2.8, orbitRadius: 70, startAngle: 3.65, tilt: 26.7, spin: 0.18, color: '#d9c08f',
    rings: { inner: 1.11, outer: 2.33 },
    look: { exposure: 0.6, textures: { map: color('saturn', true), rings: color('saturn_ring') }, atmosphere: { color: '#ffe2b0', strength: 0.4, shell: 1.03 } },
  },
  uranus: { id: 'uranus', kind: 'planet', radius: 1.8, orbitRadius: 85, startAngle: 4.15, tilt: 97.8, spin: 0.1, color: '#9fd3dc', look: { textures: { map: color('uranus') }, atmosphere: { color: '#9ef2ff', strength: 0.8, shell: 1.04 } } },
  neptune: { id: 'neptune', kind: 'planet', radius: 1.75, orbitRadius: 98, startAngle: 4.6, tilt: 28, spin: 0.1, color: '#3d5fd1', look: { textures: { map: color('neptune') }, atmosphere: { color: '#5f8cff', strength: 0.9, shell: 1.04 } } },
}

export const bodyList = Object.values(bodies)

/** Asteroid belt extents (scene units). */
export const asteroidBelt = { inner: 36.5, outer: 43.5, thickness: 1.4 }
