import { theme } from '../../lib/env'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Color,
  Euler,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type Group,
  type InstancedMesh,
} from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { asteroidBelt, bodies } from '../../config/bodies'
import { quality } from '../../config/quality'
import { seeded } from '../../lib/random'
import { bodyAngle } from '../orbits'

/** Rock size ranges (scene units), kept stable so the layout effect runs once. */
const SMALL: [number, number] = [0.025, 0.13]
const LARGE: [number, number] = [0.04, 0.32]

/**
 * The asteroid belt: two instanced meshes (a sparse ring of small rocks, and a denser
 * cluster of more detailed rocks around the camera station). The belt rotates as one
 * at its Kepler speed so the station that rides it stays among the same rocks;
 * each rock also tumbles on its own axis, computed on the GPU.
 */
export function AsteroidBelt() {
  const group = useRef<Group>(null)
  const def = bodies.asteroids
  const { count, cluster } = quality.asteroids

  const material = useMemo(() => createTumbleMaterial(), [])
  const smallRock = useMemo(() => createRockGeometry(1, 11), [])
  const bigRock = useMemo(() => createRockGeometry(2, 23), [])

  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = bodyAngle(def) - def.startAngle
    material.userData.uTime.value = clock.elapsedTime
  })

  return (
    <group ref={group}>
      <Rocks geometry={smallRock} material={material} count={count} seed={7} spread={Math.PI * 2} sizes={SMALL} />
      <Rocks
        geometry={bigRock}
        material={material}
        count={cluster}
        seed={19}
        spread={0.38}
        centre={def.startAngle}
        sizes={LARGE}
        thickness={2}
      />
    </group>
  )
}

interface RocksProps {
  geometry: BufferGeometry
  material: MeshStandardMaterial
  count: number
  seed: number
  /** Angular spread around `centre` (radians). */
  spread: number
  centre?: number
  sizes: [number, number]
  thickness?: number
}

function Rocks({ geometry, material, count, seed, spread, centre = 0, sizes, thickness = 1 }: RocksProps) {
  const mesh = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const m = mesh.current!
    const rand = seeded(seed)
    const mat = new Matrix4()
    const p = new Vector3()
    const q = new Quaternion()
    const e = new Euler()
    const s = new Vector3()
    const c = new Color()
    const spin = new Float32Array(count * 4)
    const { inner, outer } = asteroidBelt
    // Clay theme: candy-coloured pebbles instead of grey rock.
    const palette =
      theme === 'clay'
        ? ['#f7a1c4', '#a7d8ff', '#ffd27a', '#b9a6ff', '#9fe3c1', '#ffb08a']
        : ['#7d7166', '#6a5f55', '#8a7c6c', '#5c534c', '#9a8975', '#6f6a66']

    for (let i = 0; i < count; i++) {
      const a = centre + (rand() - 0.5) * spread
      // Average of two randoms biases rocks toward the middle of the belt.
      const r = inner + ((rand() + rand()) / 2) * (outer - inner)
      p.set(Math.cos(a) * r, (rand() - 0.5) * asteroidBelt.thickness * thickness, -Math.sin(a) * r)
      q.setFromEuler(e.set(rand() * 6.28, rand() * 6.28, rand() * 6.28))
      // Power curve: mostly pebbles, a few boulders.
      const size = sizes[0] + Math.pow(rand(), 4) * (sizes[1] - sizes[0])
      s.set(size * (0.75 + rand() * 0.5), size * (0.65 + rand() * 0.5), size * (0.75 + rand() * 0.5))
      m.setMatrixAt(i, mat.compose(p, q, s))
      m.setColorAt(i, c.set(palette[Math.floor(rand() * palette.length)]).multiplyScalar(0.8 + rand() * 0.4))
      // Tumble axis (xyz) and speed (w, rad/s).
      const ax = new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize()
      spin.set([ax.x, ax.y, ax.z, (0.05 + rand() * 0.3) * (rand() < 0.5 ? -1 : 1)], i * 4)
    }
    m.geometry.setAttribute('aSpin', new InstancedBufferAttribute(spin, 4))
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [count, seed, spread, centre, sizes, thickness])

  // The geometry is shared, so give each instanced mesh its own clone to carry aSpin.
  const geo = useMemo(() => geometry.clone(), [geometry])

  return <instancedMesh ref={mesh} args={[geo, material, count]} frustumCulled={false} />
}

/** A lumpy rock: a subdivided icosahedron pushed in and out by smooth pseudo-noise. */
export function createRockGeometry(detail: number, seed: number) {
  const rand = seeded(seed)
  const waves = Array.from({ length: 6 }, () => ({
    k: new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(1.5 + rand() * 3),
    phase: rand() * 6.28,
    amp: 0.05 + rand() * 0.09,
  }))
  const geo = mergeVertices(new IcosahedronGeometry(1, detail))
  const pos = geo.attributes.position
  const v = new Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    let d = 1
    for (const w of waves) d += Math.sin(v.dot(w.k) + w.phase) * w.amp
    v.multiplyScalar(d)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  return geo
}

/** Standard material with a per-instance tumble rotation injected into the vertex shader. */
function createTumbleMaterial() {
  const material = new MeshStandardMaterial({ roughness: 0.95, metalness: 0, color: '#ffffff' })
  const uTime = { value: 0 }
  material.userData.uTime = uTime
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        uniform float uTime;
        attribute vec4 aSpin;
        // Rodrigues' rotation of v around unit axis k by angle a.
        vec3 tumble(vec3 v, vec3 k, float a) {
          float c = cos(a), s = sin(a);
          return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
        }`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `#include <beginnormal_vertex>
        objectNormal = tumble(objectNormal, aSpin.xyz, uTime * aSpin.w);`,
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `#include <begin_vertex>
        transformed = tumble(transformed, aSpin.xyz, uTime * aSpin.w);`,
      )
  }
  return material
}
