import type { StationId } from '../content/types'
import type { BodyId } from './bodies'

/**
 * Camera framing for every place the journey can stop.
 *
 * Body shots are defined in the body's own orbital frame, so the composition
 * (where the Sun sits relative to the planet) stays the same however far the
 * planet has travelled round its orbit.
 */

/** Where the focused body sits on screen, as a fraction of half-width / half-height (+x right, +y up). */
export interface ScreenOffset {
  x: number
  y: number
}

interface StationBase {
  /** Vertical field of view in degrees (landscape; portrait is widened automatically). */
  fov: number
  /** Landscape layout: text sits left, body sits right. */
  screen: ScreenOffset
  /** Portrait layout: body sits above, text below. */
  portraitScreen: ScreenOffset
}

export interface BodyStation extends StationBase {
  kind: 'body'
  body: BodyId
  /** Camera distance, in multiples of the body's radius. */
  distance: number
  /**
   * Horizontal angle around the body in degrees.
   * 0 = between body and Sun (fully lit), 90 = ahead along its orbit, 180 = behind (backlit).
   */
  azimuth: number
  /** Degrees above the orbital plane. */
  elevation: number
  /** Orient the frame by another body's position (used by the Sun, which has no orbit). */
  frameFrom?: BodyId
}

export interface SystemStation extends StationBase {
  kind: 'system'
  /** The camera's angle follows this body so the shot stays composed over time. */
  anchor: BodyId
  angleOffset: number
  /** Horizontal distance from the Sun. */
  radius: number
  height: number
}

export type Station = BodyStation | SystemStation

const side = { x: 0.38, y: 0 }
const top = { x: 0, y: 0.38 }

export const stations: Record<StationId, Station> = {
  system: {
    kind: 'system', anchor: 'earth', angleOffset: -0.9, radius: 95, height: 175, fov: 42,
    screen: { x: 0, y: -0.36 }, portraitScreen: { x: 0, y: -0.28 },
  },
  sun: {
    kind: 'body', body: 'sun', frameFrom: 'mercury', distance: 2.9, azimuth: 160, elevation: 8, fov: 45,
    screen: { x: 0.42, y: 0 }, portraitScreen: { x: 0, y: 0.45 },
  },
  mercury: { kind: 'body', body: 'mercury', distance: 7, azimuth: 60, elevation: 18, fov: 40, screen: side, portraitScreen: top },
  venus: { kind: 'body', body: 'venus', distance: 6, azimuth: 55, elevation: 18, fov: 40, screen: side, portraitScreen: top },
  earth: { kind: 'body', body: 'earth', distance: 6, azimuth: 55, elevation: 18, fov: 40, screen: side, portraitScreen: top },
  mars: { kind: 'body', body: 'mars', distance: 6.5, azimuth: 60, elevation: 20, fov: 40, screen: side, portraitScreen: top },
  asteroids: { kind: 'body', body: 'asteroids', distance: 6.5, azimuth: 70, elevation: 16, fov: 45, screen: { x: 0.2, y: 0 }, portraitScreen: { x: 0, y: 0.2 } },
  jupiter: { kind: 'body', body: 'jupiter', distance: 5, azimuth: 55, elevation: 8, fov: 40, screen: side, portraitScreen: top },
  saturn: { kind: 'body', body: 'saturn', distance: 6, azimuth: 50, elevation: 16, fov: 40, screen: side, portraitScreen: top },
  uranus: { kind: 'body', body: 'uranus', distance: 6, azimuth: 55, elevation: 10, fov: 40, screen: side, portraitScreen: top },
  neptune: { kind: 'body', body: 'neptune', distance: 6, azimuth: 60, elevation: 10, fov: 40, screen: side, portraitScreen: top },
  beyond: {
    kind: 'system', anchor: 'neptune', angleOffset: 0.35, radius: 520, height: 120, fov: 32,
    screen: { x: 0, y: 0.58 }, portraitScreen: { x: 0, y: 0.55 },
  },
}
