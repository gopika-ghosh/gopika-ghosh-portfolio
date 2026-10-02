import { Vector3 } from 'three'
import { bodies, keplerSpeed, type BodyDef, type BodyId } from '../config/bodies'

/**
 * The single source of truth for where every body is.
 *
 * Positions are a pure function of `orbitClock.t`, so the scene meshes and the
 * camera rig always agree without passing positions around or touching React state.
 */
export const orbitClock = {
  /** Orbit time in seconds (scaled; can be slowed or paused independently of real time). */
  t: 0,
  /** Multiplier on orbital motion (lowered for reduced motion, focus mode, etc.). */
  timeScale: 1,
}

export function bodyAngle(def: BodyDef, t = orbitClock.t) {
  return def.startAngle + t * keplerSpeed(def.orbitRadius)
}

/** Writes the body's world position into `out`. Orbits are counter-clockwise seen from above. */
export function bodyPosition(id: BodyId, out: Vector3, t = orbitClock.t) {
  const def = bodies[id]
  if (def.orbitRadius === 0) return out.set(0, 0, 0)
  const a = bodyAngle(def, t)
  return out.set(Math.cos(a) * def.orbitRadius, 0, -Math.sin(a) * def.orbitRadius)
}
