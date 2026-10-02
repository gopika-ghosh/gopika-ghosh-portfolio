import { useFrame } from '@react-three/fiber'
import { reducedMotion } from '../lib/env'
import { orbitClock } from './orbits'

// Calmer skies for viewers who asked for less motion.
if (reducedMotion) orbitClock.timeScale = 0.3

/** Advances orbit time before anything else reads it each frame. */
export function OrbitClock() {
  useFrame((_, dt) => {
    orbitClock.t += Math.min(dt, 0.1) * orbitClock.timeScale
  }, -2)
  return null
}
