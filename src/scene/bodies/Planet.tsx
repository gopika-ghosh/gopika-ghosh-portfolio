import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, MathUtils, type Group, type Mesh } from 'three'
import type { BodyDef } from '../../config/bodies'
import { bodyPosition } from '../orbits'

/**
 * A planet that follows its orbit. Position comes from the shared orbit clock,
 * so it always matches what the camera rig computes.
 */
export function Planet({ def }: { def: BodyDef }) {
  const group = useRef<Group>(null)
  const body = useRef<Mesh>(null)

  useFrame((_, dt) => {
    if (!group.current || !body.current) return
    bodyPosition(def.id, group.current.position)
    body.current.rotation.y += def.spin * dt
  })

  return (
    <group ref={group}>
      {/* Axial tilt; rings share it, as they lie in the equatorial plane. */}
      <group rotation-z={MathUtils.degToRad(def.tilt)}>
        <mesh ref={body} scale={def.radius}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color={def.color} roughness={0.9} metalness={0} />
        </mesh>
        {def.rings && (
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[def.radius * def.rings.inner, def.radius * def.rings.outer, 160]} />
            <meshStandardMaterial color={def.color} side={DoubleSide} transparent opacity={0.6} roughness={1} />
          </mesh>
        )}
      </group>
    </group>
  )
}
