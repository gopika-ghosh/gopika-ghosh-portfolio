import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { seeded } from '../../lib/random'
import { reducedMotion } from '../../lib/env'
import { clayGrain } from './clayKit'

/**
 * Puffy clay clouds drifting around a planet: each is a few squashed balls stuck together,
 * like clouds in a stop-motion film. Mount inside the planet's tilted frame.
 */
export function ClayClouds({ radius, count = 7 }: { radius: number; count?: number }) {
  const group = useRef<Group>(null)
  const clouds = useMemo(() => {
    const rand = seeded(23)
    return Array.from({ length: count }, (_, i) => {
      const lon = (i / count) * Math.PI * 2 + rand() * 0.5
      const lat = (rand() - 0.5) * 1.3
      const balls = 3 + Math.floor(rand() * 2)
      return {
        rot: [lat, lon, 0] as [number, number, number],
        balls: Array.from({ length: balls }, (_, b) => ({
          x: (b - (balls - 1) / 2) * 0.07 + (rand() - 0.5) * 0.02,
          y: (rand() - 0.3) * 0.04,
          s: 0.045 + rand() * 0.03 + (b === Math.floor(balls / 2) ? 0.02 : 0),
        })),
      }
    })
  }, [count])
  const grain = clayGrain()

  useFrame((_, dt) => {
    if (group.current && !reducedMotion) group.current.rotation.y += dt * 0.05
  })

  return (
    <group ref={group} scale={radius}>
      {clouds.map((c, i) => (
        // Rotate a pivot, then push the cloud out to just above the surface.
        <group key={i} rotation={c.rot}>
          <group position={[0, 0, 1.06]}>
            {c.balls.map((b, j) => (
              <mesh key={j} position={[b.x, b.y, 0]} scale={[b.s, b.s * 0.75, b.s * 0.8]}>
                <sphereGeometry args={[1, 16, 12]} />
                <meshStandardMaterial color="#ffffff" roughness={0.9} bumpMap={grain} bumpScale={0.25} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
    </group>
  )
}
