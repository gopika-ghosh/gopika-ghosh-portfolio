import { useEffect, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BackSide, Color, DoubleSide, MathUtils, Vector2, Vector3, type Group, type Mesh } from 'three'
import type { BodyDef, BodyLook } from '../../config/bodies'
import { bodyPosition } from '../orbits'
import { useTextures } from '../textures'
import { frameExtent } from '../../journey/cameraPath'
import { useShaderMaterial } from '../useShaderMaterial'
import planetVert from '../shaders/planet.vert.glsl?raw'
import planetFrag from '../shaders/planet.frag.glsl?raw'
import atmosphereFrag from '../shaders/atmosphere.frag.glsl?raw'
import ringsVert from '../shaders/rings.vert.glsl?raw'
import ringsFrag from '../shaders/rings.frag.glsl?raw'

const SUN_INTENSITY = 1.55
const UP = new Vector3(0, 1, 0)

interface Props {
  def: BodyDef & { look: BodyLook }
  /** Rendered in the planet's orbital frame (follows it, not tilted) — e.g. moons. */
  children?: ReactNode
  /** Rendered in the planet's tilted equatorial frame — e.g. markers on the rings. */
  equatorial?: ReactNode
}

/**
 * A textured planet following its orbit. Position comes from the shared orbit clock,
 * so it always matches what the camera rig computes.
 */
export function Planet({ def, children, equatorial }: Props) {
  const group = useRef<Group>(null)
  const tilt = useRef<Group>(null)
  const body = useRef<Mesh>(null)
  const { look } = def
  const isEarth = !!look.textures.night
  const rings = def.rings && look.textures.rings ? def.rings : undefined

  // Loaded and uploaded behind the loading screen (4K for heroes on capable devices).
  const lo = useTextures(look.textures)

  // Materials are created once (see useShaderMaterial for why not JSX <shaderMaterial>);
  // per-frame values and 4K texture swaps write straight into their uniforms.
  const exposure = SUN_INTENSITY * (look.exposure ?? 1)
  const surface = useShaderMaterial(() => ({
    vertexShader: planetVert,
    fragmentShader: planetFrag,
    defines: { ...(isEarth && { EARTH: '' }), ...(rings && { RINGS: '' }) },
    uniforms: {
      uMap: { value: lo.map },
      uNight: { value: lo.night ?? null },
      uClouds: { value: lo.clouds ?? null },
      uSpecular: { value: lo.specular ?? null },
      uCloudOffset: { value: 0 },
      uAtmoColor: { value: new Color(look.atmosphere?.color ?? '#000000') },
      uAtmoStrength: { value: look.atmosphere ? look.atmosphere.strength * 0.6 : 0 },
      uSunIntensity: { value: exposure },
      uAmbient: { value: 0.012 },
      uRingMap: { value: lo.rings ?? null },
      uCenter: { value: new Vector3() },
      uRingNormal: { value: new Vector3(0, 1, 0) },
      uRadius: { value: def.radius },
      uRingRange: { value: new Vector2(rings?.inner ?? 0, rings?.outer ?? 0) },
    },
  }))
  const u = surface.uniforms

  const atmosphere = useShaderMaterial(() => ({
    vertexShader: planetVert,
    fragmentShader: atmosphereFrag,
    uniforms: {
      uColor: { value: new Color(look.atmosphere?.color ?? '#000000') },
      uStrength: { value: look.atmosphere?.strength ?? 0 },
      uEdge: { value: 1 / (look.atmosphere?.shell ?? 1) },
    },
    side: BackSide,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  }))

  const ringMaterial = useShaderMaterial(() => ({
    vertexShader: ringsVert,
    fragmentShader: ringsFrag,
    uniforms: {
      uMap: { value: lo.rings ?? null },
      uCenter: u.uCenter, // shared with the surface: one write per frame updates both
      uRadius: { value: def.radius },
      uRange: { value: new Vector2(rings?.inner ?? 0, rings?.outer ?? 0) },
      uSunIntensity: { value: exposure },
    },
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
  }))

  // Rings widen the shot: register them with the camera framing (moons may raise it further).
  useEffect(() => {
    if (!rings) return
    const ringExtent = def.radius * rings.outer * 0.8
    frameExtent[def.id] = Math.max(frameExtent[def.id] ?? 0, ringExtent)
  }, [rings, def.id, def.radius])

  useFrame((_, dt) => {
    if (!group.current || !body.current || !tilt.current) return
    bodyPosition(def.id, group.current.position)
    body.current.rotation.y += def.spin * dt
    u.uCloudOffset.value = (u.uCloudOffset.value + dt * 0.0012) % 1
    u.uCenter.value.copy(group.current.position)
    if (rings) u.uRingNormal.value.copy(UP).applyQuaternion(tilt.current.quaternion)
  })

  return (
    <group ref={group}>
      {/* Axial tilt; rings share it, as they lie in the equatorial plane. */}
      <group ref={tilt} rotation-z={MathUtils.degToRad(def.tilt)}>
        <mesh ref={body} scale={def.radius} material={surface}>
          <sphereGeometry args={[1, 96, 64]} />
        </mesh>

        {look.atmosphere && (
          <mesh scale={def.radius * look.atmosphere.shell} material={atmosphere}>
            <sphereGeometry args={[1, 64, 48]} />
          </mesh>
        )}

        {rings && (
          <mesh rotation-x={-Math.PI / 2} material={ringMaterial}>
            <ringGeometry args={[def.radius * rings.inner, def.radius * rings.outer, 256, 1]} />
          </mesh>
        )}
        {equatorial}
      </group>
      {children}
    </group>
  )
}
