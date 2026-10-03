import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, Color, Euler, ExtrudeGeometry, Matrix4, Quaternion, Shape, Vector3, type Group, type InstancedMesh } from 'three'
import { quality } from '../../config/quality'
import { seeded } from '../../lib/random'
import { useShaderMaterial } from '../useShaderMaterial'
import { clay } from './clayKit'

/**
 * The toy universe's sky: a deep twilight gradient (dark enough for the light UI text)
 * scattered with puffy little clay stars that slowly turn.
 */
export function ClaySky() {
  const sky = useShaderMaterial(() => ({
    side: BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new Color(clay.sky.top) },
      uMid: { value: new Color(clay.sky.mid) },
      uHorizon: { value: new Color(clay.sky.horizon) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uMid, uHorizon;
      varying vec3 vDir;
      void main() {
        float y = vDir.y;
        vec3 col = y > 0.0 ? mix(uMid, uTop, smoothstep(0.0, 0.7, y)) : mix(uMid, uHorizon, smoothstep(0.0, -0.6, y));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  }))

  return (
    <group>
      <mesh scale={3000} material={sky} renderOrder={-2}>
        <sphereGeometry args={[1, 48, 24]} />
      </mesh>
      <ClayStars count={Math.round(260 * quality.starDensity)} />
    </group>
  )
}

const ORIGIN = new Vector3()
const UP_V = new Vector3(0, 1, 0)
const look = new Matrix4()

const STAR_COLORS = ['#fff3c4', '#ffe08a', '#ffd1e8', '#d8ccff', '#bfe7ff', '#ffffff']

function ClayStars({ count }: { count: number }) {
  const group = useRef<Group>(null)
  const mesh = useRef<InstancedMesh>(null)

  // A soft, bevelled five-point star: reads as a puffy clay cut-out.
  const geometry = useMemo(() => {
    const shape = new Shape()
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2
      const r = i % 2 === 0 ? 1 : 0.48
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    shape.closePath()
    const g = new ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: true, bevelSize: 0.22, bevelThickness: 0.22, bevelSegments: 4, curveSegments: 4 })
    g.center()
    return g
  }, [])

  useLayoutEffect(() => {
    const m = mesh.current!
    const rand = seeded(11)
    const mat = new Matrix4()
    const p = new Vector3()
    const q = new Quaternion()
    const s = new Vector3()
    const c = new Color()
    for (let i = 0; i < count; i++) {
      const u = rand() * 2 - 1
      const th = rand() * Math.PI * 2
      const r = 380 + rand() * 900
      const k = Math.sqrt(1 - u * u)
      p.set(k * Math.cos(th) * r, u * r, k * Math.sin(th) * r)
      // Face the system (with a little playful tilt) so stars read as shapes, not slivers.
      look.lookAt(p, ORIGIN, UP_V)
      q.setFromRotationMatrix(look).multiply(new Quaternion().setFromEuler(new Euler((rand() - 0.5) * 0.6, (rand() - 0.5) * 0.6, rand() * 6.28)))
      s.setScalar((2.2 + Math.pow(rand(), 3) * 7) * (r / 700))
      m.setMatrixAt(i, mat.compose(p, q, s))
      m.setColorAt(i, c.set(STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)]))
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [count])

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.004
  })

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[geometry, undefined, count]} frustumCulled={false}>
        <meshBasicMaterial />
      </instancedMesh>
    </group>
  )
}
