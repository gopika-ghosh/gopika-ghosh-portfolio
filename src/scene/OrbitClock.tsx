import { useFrame } from '@react-three/fiber'
import { orbitClock } from './orbits'

/** Advances orbit time before anything else reads it each frame. */
export function OrbitClock() {
  useFrame((_, dt) => {
    orbitClock.t += Math.min(dt, 0.1) * orbitClock.timeScale
  }, -2)
  return null
}
