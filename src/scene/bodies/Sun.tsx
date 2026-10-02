import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { bodies } from '../../config/bodies'

/** Grey-box Sun: an unlit emissive sphere. Phase 2 replaces this with the plasma + corona shaders. */
export function Sun() {
  const ref = useRef<Mesh>(null)
  const def = bodies.sun
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += def.spin * dt
  })
  return (
    <group>
      <mesh ref={ref} scale={def.radius}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color={def.color} toneMapped={false} />
      </mesh>
      {/* The Sun lights the whole system. decay 0 keeps outer planets readable at stylised distances. */}
      <pointLight intensity={2.6} decay={0} color="#fff1dc" />
    </group>
  )
}
