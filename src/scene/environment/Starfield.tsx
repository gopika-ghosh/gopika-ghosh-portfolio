import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color } from 'three'
import { seeded } from '../../lib/random'
import { useShaderMaterial } from '../useShaderMaterial'
import vertexShader from '../shaders/starfield.vert.glsl?raw'
import fragmentShader from '../shaders/starfield.frag.glsl?raw'

/**
 * Multi-layer starfield. Each layer is a shell at a different distance, so as the
 * camera travels the nearer shells shift against the farther ones (parallax).
 * One draw call per layer.
 */
const LAYERS = [
  { radius: 900, count: 1800, size: [1.0, 2.6] },
  { radius: 1500, count: 2600, size: [0.8, 2.0] },
  { radius: 2400, count: 3600, size: [0.6, 1.5] },
] as const

// Stellar colour temperatures, weighted toward white.
const PALETTE = ['#ffffff', '#ffffff', '#f4f6ff', '#dfe7ff', '#cad8ff', '#fff4e3', '#ffe1bd', '#ffd2a1']

export function Starfield({ density = 1 }: { density?: number }) {
  const layers = useMemo(() => {
    const rand = seeded(42)
    const c = new Color()
    return LAYERS.map((layer) => {
      const n = Math.round(layer.count * density)
      const pos = new Float32Array(n * 3)
      const col = new Float32Array(n * 3)
      const size = new Float32Array(n)
      const seed = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        // Uniform direction on a sphere, with slight radial jitter.
        const u = rand() * 2 - 1
        const th = rand() * Math.PI * 2
        const s = Math.sqrt(1 - u * u)
        const r = layer.radius * (0.85 + rand() * 0.3)
        pos.set([s * Math.cos(th) * r, u * r, s * Math.sin(th) * r], i * 3)
        c.set(PALETTE[Math.floor(rand() * PALETTE.length)])
        col.set([c.r, c.g, c.b], i * 3)
        // Power curve: most stars faint, a few bright.
        size[i] = layer.size[0] + Math.pow(rand(), 6) * (layer.size[1] - layer.size[0]) * 2
        seed[i] = rand()
      }
      const g = new BufferGeometry()
      g.setAttribute('position', new BufferAttribute(pos, 3))
      g.setAttribute('aColor', new BufferAttribute(col, 3))
      g.setAttribute('aSize', new BufferAttribute(size, 1))
      g.setAttribute('aSeed', new BufferAttribute(seed, 1))
      return g
    })
  }, [density])

  // One material shared by all layers.
  const material = useShaderMaterial(() => ({
    vertexShader,
    fragmentShader,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  }))

  useFrame(({ clock, viewport }) => {
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uPixelRatio.value = viewport.dpr
  })

  return (
    <group>
      {layers.map((g, i) => (
        <points key={i} geometry={g} material={material} frustumCulled={false} />
      ))}
    </group>
  )
}
