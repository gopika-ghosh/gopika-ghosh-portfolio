import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { Vector3 } from 'three'
import { bodyList } from '../../config/bodies'

const SEGMENTS = 256

/**
 * Faint orbit paths. Phase 4 will fade these in only near the active planet.
 */
export function OrbitLines() {
  const orbits = useMemo(
    () =>
      bodyList
        .filter((b) => b.kind === 'planet')
        .map((b) => ({
          id: b.id,
          points: Array.from({ length: SEGMENTS + 1 }, (_, i) => {
            const a = (i / SEGMENTS) * Math.PI * 2
            return new Vector3(Math.cos(a) * b.orbitRadius, 0, -Math.sin(a) * b.orbitRadius)
          }),
        })),
    [],
  )
  return (
    <group>
      {orbits.map((o) => (
        <Line key={o.id} points={o.points} color="#ffd9a8" lineWidth={1} transparent opacity={0.09} depthWrite={false} />
      ))}
    </group>
  )
}
