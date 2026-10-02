import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Vector3 } from 'three'
import { easing } from 'maath'
import { works } from '../../content/works'
import { useUi } from '../../state/uiStore'
import { moonRegistry } from '../moons/registry'
import { useShaderMaterial } from '../useShaderMaterial'
import { toolRegistry } from './toolRegistry'
import vertexShader from '../shaders/links.vert.glsl?raw'
import fragmentShader from '../shaders/links.frag.glsl?raw'

const MAX_LINES = 12
const SEGMENTS = 48
const VERTS = MAX_LINES * SEGMENTS * 2

const _a = new Vector3()
const _b = new Vector3()
const _c = new Vector3()
const _p = new Vector3()
const _q = new Vector3()

/**
 * Skills wired to work: while a tool is hovered (in the belt or the skills list),
 * glowing arcs run from its rock to the moon of every project that lists it in `tools`.
 * One draw call for all lines; positions are rebuilt each frame because everything orbits.
 */
export function ToolLinks() {
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(VERTS * 3), 3))
    g.setAttribute('aT', new BufferAttribute(new Float32Array(VERTS), 1))
    g.setDrawRange(0, 0)
    return g
  }, [])

  const material = useShaderMaterial(() => ({
    vertexShader,
    fragmentShader,
    uniforms: { uColor: { value: new Color('#ffb35c') }, uTime: { value: 0 }, uOpacity: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  }))

  const fade = useMemo(() => ({ v: 0, tool: null as string | null }), [])

  useFrame(({ clock }, dt) => {
    const tool = useUi.getState().tool
    // Keep drawing the last tool's lines while they fade out.
    if (tool) fade.tool = tool
    easing.damp(fade, 'v', tool ? 1 : 0, 0.25, dt)
    material.uniforms.uOpacity.value = fade.v
    material.uniforms.uTime.value = clock.elapsedTime

    const rock = fade.tool ? toolRegistry.get(fade.tool) : undefined
    if (!rock || fade.v < 0.01) {
      geometry.setDrawRange(0, 0)
      return
    }
    rock.getWorldPosition(_a)

    const pos = geometry.attributes.position as BufferAttribute
    const ts = geometry.attributes.aT as BufferAttribute
    let v = 0
    for (const w of works) {
      if (v >= VERTS || !w.tools?.includes(fade.tool!)) continue
      const moon = moonRegistry.get(w.id)
      if (!moon) continue
      moon.object.getWorldPosition(_b)
      // Control point lifted above the midpoint: a soft arc rather than a straight beam.
      _c.addVectors(_a, _b).multiplyScalar(0.5)
      _c.y += _a.distanceTo(_b) * 0.22
      for (let i = 0; i < SEGMENTS; i++) {
        const t0 = i / SEGMENTS
        const t1 = (i + 1) / SEGMENTS
        bezier(t0, _p)
        bezier(t1, _q)
        pos.setXYZ(v, _p.x, _p.y, _p.z)
        ts.setX(v++, t0)
        pos.setXYZ(v, _q.x, _q.y, _q.z)
        ts.setX(v++, t1)
      }
    }
    pos.needsUpdate = true
    ts.needsUpdate = true
    geometry.setDrawRange(0, v)
    geometry.computeBoundingSphere()
  })

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />
}

/** Quadratic Bézier through _a → _c → _b. */
function bezier(t: number, out: Vector3) {
  const u = 1 - t
  return out
    .copy(_a)
    .multiplyScalar(u * u)
    .addScaledVector(_c, 2 * u * t)
    .addScaledVector(_b, t * t)
}
