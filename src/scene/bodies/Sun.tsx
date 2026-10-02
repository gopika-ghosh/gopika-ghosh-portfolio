import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { AdditiveBlending, MathUtils, type Mesh } from 'three'
import { bodies } from '../../config/bodies'
import { useShaderMaterial } from '../useShaderMaterial'
import noise from '../shaders/noise.glsl?raw'
import sunVert from '../shaders/sun.vert.glsl?raw'
import sunFrag from '../shaders/sun.frag.glsl?raw'
import uvVert from '../shaders/uv.vert.glsl?raw'
import coronaFrag from '../shaders/corona.frag.glsl?raw'

/** Corona quad half-size, in Sun radii. */
const CORONA_SCALE = 10

/**
 * The Sun: shader plasma surface + camera-facing corona, both HDR so bloom catches them.
 * Exposure eases down as the camera gets close, so the close-up shows surface detail
 * instead of blowing out to white.
 */
export function Sun() {
  const surface = useRef<Mesh>(null)
  const def = bodies.sun

  const sunMaterial = useShaderMaterial(() => ({
    vertexShader: sunVert,
    fragmentShader: noise + sunFrag,
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 1.6 } },
    toneMapped: false,
  }))
  const coronaMaterial = useShaderMaterial(() => ({
    vertexShader: uvVert,
    fragmentShader: noise + coronaFrag,
    uniforms: { uTime: { value: 0 }, uScale: { value: CORONA_SCALE }, uIntensity: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  }))

  useFrame(({ clock, camera }, dt) => {
    const t = clock.elapsedTime
    sunMaterial.uniforms.uTime.value = t
    coronaMaterial.uniforms.uTime.value = t
    if (surface.current) surface.current.rotation.y += def.spin * dt

    // Exposure by distance: dim up close so only the limb blooms, bright from afar.
    const k = MathUtils.smoothstep(camera.position.length(), def.radius * 3, def.radius * 25)
    sunMaterial.uniforms.uIntensity.value = MathUtils.lerp(1.0, 2.6, k)
    coronaMaterial.uniforms.uIntensity.value = MathUtils.lerp(0.14, 1.1, k)
  })

  return (
    <group>
      <mesh ref={surface} scale={def.radius} material={sunMaterial}>
        <sphereGeometry args={[1, 96, 96]} />
      </mesh>

      <Billboard>
        <mesh scale={def.radius * CORONA_SCALE * 2} renderOrder={-1} material={coronaMaterial}>
          <planeGeometry />
        </mesh>
      </Billboard>

      {/* Lights the standard-material objects (asteroids, moons). Planets use their own shader. */}
      <pointLight intensity={2.6} decay={0} color="#fff1dc" />
    </group>
  )
}
