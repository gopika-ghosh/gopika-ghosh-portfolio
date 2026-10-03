import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, MathUtils, Vector3, type Group, type Mesh } from 'three'
import { reducedMotion } from '../../lib/env'

const _dir = new Vector3()

/**
 * Every so often a little star streaks across the sky with a soft tail. Placed relative
 * to the camera, far away, so it's always visible and never in the way.
 */
export function ShootingStars() {
  const root = useRef<Group>(null)
  const tail = useRef<Mesh>(null)
  const state = useRef({ t: 1, wait: 4, from: new Vector3(), to: new Vector3() })

  useFrame(({ camera }, dt) => {
    const s = state.current
    const r = root.current
    if (!r) return
    if (reducedMotion) {
      r.visible = false
      return
    }
    if (s.t >= 1) {
      s.wait -= dt
      r.visible = false
      if (s.wait > 0) return
      // New streak: across the upper part of the view, far behind everything.
      camera.getWorldDirection(_dir)
      const right = new Vector3().crossVectors(_dir, camera.up).normalize()
      const up = new Vector3().crossVectors(right, _dir)
      const centre = camera.position.clone().addScaledVector(_dir, 400).addScaledVector(up, MathUtils.randFloat(60, 150))
      const dirX = Math.random() < 0.5 ? -1 : 1
      s.from.copy(centre).addScaledVector(right, -dirX * 220)
      s.to.copy(centre).addScaledVector(right, dirX * 220).addScaledVector(up, -90)
      s.t = 0
      s.wait = MathUtils.randFloat(7, 14)
    }
    s.t = Math.min(1, s.t + dt / 1.1)
    r.visible = true
    r.position.lerpVectors(s.from, s.to, MathUtils.smoothstep(s.t, 0, 1))
    r.lookAt(s.to)
    const fade = Math.sin(s.t * Math.PI)
    r.scale.setScalar(fade)
  })

  return (
    <group ref={root} visible={false}>
      <mesh>
        <sphereGeometry args={[2.4, 12, 10]} />
        <meshBasicMaterial color={STAR} toneMapped={false} />
      </mesh>
      {/* Tail points backwards along the flight (-Z after lookAt). */}
      <mesh ref={tail} position={[0, 0, -16]} rotation-x={Math.PI / 2}>
        <coneGeometry args={[2.2, 32, 12, 1, true]} />
        <meshBasicMaterial color="#ffd9f2" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  )
}

const STAR = new Color(1.8, 1.6, 1.2)
