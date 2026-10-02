import { MathUtils, Vector2, Vector3 } from 'three'
import { bodies, type BodyId } from '../config/bodies'
import type { Station } from '../config/stations'
import { bodyAngle, bodyPosition } from '../scene/orbits'

/**
 * Camera poses and how to blend between them.
 *
 * A pose is "where the camera is, what it's looking at, and where on screen that
 * thing should sit". Poses are resolved every frame from the live body positions,
 * so the camera stays locked to moving planets.
 *
 * Flights between stops are interpolated in cylindrical coordinates around the
 * Sun (radius, angle, height) rather than in straight lines. That turns every
 * flight into a gentle arc around the system and guarantees the camera never
 * cuts through the Sun, whatever positions the planets have orbited to.
 */

export interface Pose {
  position: Vector3
  focus: Vector3
  screen: Vector2
  fov: number
}

export const createPose = (): Pose => ({
  position: new Vector3(),
  focus: new Vector3(),
  screen: new Vector2(),
  fov: 45,
})

/**
 * Radius (scene units) that a body's shot must fit, set by systems around it —
 * e.g. a planet's moons. Shots back off automatically so the whole system is framed.
 */
export const frameExtent: Partial<Record<BodyId, number>> = {}
/** Camera distance per unit of frame extent. */
const EXTENT_DISTANCE = 2.05
/** Portrait screens are narrow: stand a little further back so orbits and rings fit side to side. */
const PORTRAIT_BACKOFF = 1.22

const UP = new Vector3(0, 1, 0)
const _anchor = new Vector3()
const _radial = new Vector3()
const _tangent = new Vector3()
const _dir = new Vector3()

/** Resolve a station's pose at the current orbit time. */
export function stationPose(station: Station, portrait: boolean, out: Pose): Pose {
  const screen = portrait ? station.portraitScreen : station.screen
  out.screen.set(screen.x, screen.y)
  out.fov = station.fov

  if (station.kind === 'system') {
    const a = bodyAngle(bodies[station.anchor]) + station.angleOffset
    out.position.set(Math.cos(a) * station.radius, station.height, -Math.sin(a) * station.radius)
    out.focus.set(0, 0, 0)
    return out
  }

  const body = bodies[station.body]
  bodyPosition(station.body, out.focus)

  // Orbital frame: radial points away from the Sun, tangent points along the direction of motion.
  bodyPosition(station.frameFrom ?? station.body, _anchor)
  _radial.set(_anchor.x, 0, _anchor.z)
  if (_radial.lengthSq() < 1e-6) _radial.set(1, 0, 0)
  _radial.normalize()
  _tangent.set(_radial.z, 0, -_radial.x)

  const az = MathUtils.degToRad(station.azimuth)
  const el = MathUtils.degToRad(station.elevation)
  // azimuth 0 = towards the Sun (−radial).
  _dir
    .copy(_radial)
    .multiplyScalar(-Math.cos(az))
    .addScaledVector(_tangent, Math.sin(az))
    .multiplyScalar(Math.cos(el))
    .addScaledVector(UP, Math.sin(el))

  // The body sits off-centre (screen offset), so the far side has less room: back off accordingly.
  const room = 1 - Math.min(0.6, Math.max(Math.abs(out.screen.x), Math.abs(out.screen.y)))
  const distance =
    Math.max(station.distance * body.radius, ((frameExtent[station.body] ?? 0) * EXTENT_DISTANCE) / room) *
    (portrait ? PORTRAIT_BACKOFF : 1)
  out.position.copy(out.focus).addScaledVector(_dir, distance)
  return out
}

// ---- cylindrical blending ---------------------------------------------------

interface Cyl {
  r: number
  a: number
  y: number
}
const _ca: Cyl = { r: 0, a: 0, y: 0 }
const _cb: Cyl = { r: 0, a: 0, y: 0 }

function toCyl(v: Vector3, out: Cyl) {
  out.r = Math.hypot(v.x, v.z)
  out.a = Math.atan2(-v.z, v.x)
  out.y = v.y
  return out
}

/** Shortest signed angle from a to b. */
function angleDelta(a: number, b: number) {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

function blendCyl(a: Vector3, b: Vector3, t: number, lift: number, out: Vector3) {
  toCyl(a, _ca)
  toCyl(b, _cb)
  // A point on the axis has no meaningful angle; borrow the other end's.
  if (_ca.r < 1e-3) _ca.a = _cb.a
  if (_cb.r < 1e-3) _cb.a = _ca.a
  const r = MathUtils.lerp(_ca.r, _cb.r, t)
  const ang = _ca.a + angleDelta(_ca.a, _cb.a) * t
  const y = MathUtils.lerp(_ca.y, _cb.y, t) + Math.sin(Math.PI * t) * lift
  return out.set(Math.cos(ang) * r, y, -Math.sin(ang) * r)
}

/** Blend two poses. `t` should already be eased. */
export function blendPoses(a: Pose, b: Pose, t: number, out: Pose): Pose {
  // Longer flights rise a little higher mid-way, so they read as arcs rather than slides.
  const chord = Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z)
  const lift = Math.min(chord * 0.12, 30)
  blendCyl(a.position, b.position, t, lift, out.position)
  blendCyl(a.focus, b.focus, t, 0, out.focus)
  out.screen.lerpVectors(a.screen, b.screen, t)
  out.fov = MathUtils.lerp(a.fov, b.fov, t)
  return out
}

/** Smootherstep: zero velocity and acceleration at both ends, so arrivals feel weightless. */
export const easeFlight = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
