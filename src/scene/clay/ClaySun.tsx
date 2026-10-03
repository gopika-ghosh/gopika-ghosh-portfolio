import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { AdditiveBlending, CanvasTexture, Color, MathUtils, type Mesh, type MeshBasicMaterial } from 'three'
import { bodies } from '../../config/bodies'
import { useTexture } from '@react-three/drei'
import { cachedClayBall, clayMapUrl, prepClayMap } from './clayKit'

/** >1 so the bloom pass catches it. */
const HDR = new Color(1.35, 1.25, 1.1)
const NEAR = new Color(0.92, 0.86, 0.8)

/**
 * The toy Sun: a glowing, hand-pressed clay ball with a warm halo. HDR emissive so the bloom pass gives it a warm halo.
 */
export function ClaySun() {
  const def = bodies.sun
  const ball = useRef<Mesh>(null)
  // Painted warm swirls (pre-painted texture) on a thumb-pressed clay ball.
  const geometry = cachedClayBall('sun', { detail: 5, seed: 3, lumps: 0.045, paint: () => 0 })
  const map = prepClayMap(useTexture(clayMapUrl('sun')))
  const glow = useMemo(() => radialGlow(), [])

  useFrame(({ camera }, dt) => {
    if (ball.current) {
      ball.current.rotation.y += def.spin * dt
      // Dimmer up close so the painted clay shows; brighter from afar so it glows.
      const k = MathUtils.smoothstep(camera.position.length(), def.radius * 3, def.radius * 25)
      const m = ball.current.material as MeshBasicMaterial
      m.color.copy(NEAR).lerp(HDR, k)
    }
  })

  return (
    <group>
      <mesh ref={ball} geometry={geometry} scale={def.radius}>
        {/* Unlit (it's the light source); the colour is pushed above 1 so bloom gives it a halo. */}
        <meshBasicMaterial map={map} color={HDR.clone()} toneMapped={false} />
      </mesh>
      <Billboard>
        <mesh scale={def.radius * 7} renderOrder={-1}>
          <planeGeometry />
          <meshBasicMaterial map={glow} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
        </mesh>
      </Billboard>
      <pointLight intensity={2.4} decay={0} color="#ffe2b5" />
    </group>
  )
}

function radialGlow() {
  const s = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = s
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,200,110,0.55)')
  g.addColorStop(0.25, 'rgba(255,170,90,0.22)')
  g.addColorStop(1, 'rgba(255,140,90,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  return new CanvasTexture(canvas)
}
