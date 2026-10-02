import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Euler, Matrix4, Quaternion, Vector3, type Group, type InstancedMesh } from 'three'
import { asteroidBelt, bodies } from '../../config/bodies'
import { seeded } from '../../lib/random'
import { bodyAngle } from '../orbits'

/**
 * The asteroid belt as a single instanced draw call.
 * The whole belt rotates as one at its Kepler speed, so the camera station that
 * rides the belt (bodies.asteroids) stays among the same rocks.
 */
export function AsteroidBelt({ count = 1800, cluster = 260 }: { count?: number; cluster?: number }) {
  const group = useRef<Group>(null)
  const mesh = useRef<InstancedMesh>(null)
  const def = bodies.asteroids

  useLayoutEffect(() => {
    const rand = seeded(7)
    const m = new Matrix4()
    const p = new Vector3()
    const q = new Quaternion()
    const e = new Euler()
    const s = new Vector3()
    const { inner, outer, thickness } = asteroidBelt
    for (let i = 0; i < count + cluster; i++) {
      // The last `cluster` rocks gather around the camera station so that stop feels dense.
      const inCluster = i >= count
      const a = inCluster ? def.startAngle + (rand() - 0.5) * 0.35 : rand() * Math.PI * 2
      // Average of two randoms biases rocks toward the middle of the belt.
      const r = inner + ((rand() + rand()) / 2) * (outer - inner)
      p.set(Math.cos(a) * r, (rand() - 0.5) * thickness * (inCluster ? 2 : 1), -Math.sin(a) * r)
      q.setFromEuler(e.set(rand() * 6.28, rand() * 6.28, rand() * 6.28))
      const size = 0.025 + Math.pow(rand(), 4) * (inCluster ? 0.32 : 0.14)
      s.set(size * (0.7 + rand() * 0.6), size * (0.7 + rand() * 0.6), size * (0.7 + rand() * 0.6))
      mesh.current!.setMatrixAt(i, m.compose(p, q, s))
    }
    mesh.current!.instanceMatrix.needsUpdate = true
    mesh.current!.computeBoundingSphere()
  }, [count, cluster, def.startAngle])

  useFrame(() => {
    if (group.current) group.current.rotation.y = bodyAngle(def) - def.startAngle
  })

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count + cluster]} frustumCulled={false}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={def.color} roughness={1} flatShading />
      </instancedMesh>
    </group>
  )
}
