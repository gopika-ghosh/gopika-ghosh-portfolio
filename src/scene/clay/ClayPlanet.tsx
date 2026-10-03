import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Color, type Group, type Mesh } from 'three'
import type { BodyDef } from '../../config/bodies'
import { frameExtent } from '../../journey/cameraPath'
import { bodyPosition } from '../orbits'
import { useTexture } from '@react-three/drei'
import { cachedClayBall, clayGrain, clayMapUrl, prepClayMap } from './clayKit'
import { painters, ringStripes } from './painters'
import { ClayClouds } from './ClayClouds'
import { cueBoop } from '../../audio/ambient'
import { journeyChapters } from '../../content'
import { fill, guide } from '../../content/guide'
import { useUi } from '../../state/uiStore'

interface Props {
  def: BodyDef
  /** Rendered in the planet's orbital frame (follows it, not tilted) — e.g. moons. */
  children?: ReactNode
  /** Rendered in the planet's tilted equatorial frame — e.g. markers on the rings. */
  equatorial?: ReactNode
}

/**
 * A planet sculpted from modelling clay: lumpy, hand-painted, softly lit, and a little
 * squishy — hover it and it wobbles like a toy. Drop-in replacement for <Planet>.
 */
export function ClayPlanet({ def, children, equatorial }: Props) {
  const group = useRef<Group>(null)
  const body = useRef<Mesh>(null)
  const squish = useRef({ s: 1, v: 0 })

  const paint = painters[def.id] ?? ((_, c: Color) => void c.set(def.color))
  const geometry = cachedClayBall(def.id, { detail: 5, seed: def.orbitRadius, lumps: 0.03, paint })
  // Pre-painted at build time (npm run clay-textures); counted by the loading screen.
  const map = prepClayMap(useTexture(clayMapUrl(def.id)))
  const grain = clayGrain()

  // Chunky clay ring: concentric flattened tori, one per colour stripe (gaps left open).
  const ring = useMemo(() => {
    if (!def.rings) return []
    const { inner, outer } = def.rings
    return ringStripes
      .map(([t, color], i) => {
        const t1 = ringStripes[i + 1]?.[0] ?? 1
        const r0 = def.radius * (inner + (outer - inner) * t)
        const r1 = def.radius * (inner + (outer - inner) * t1)
        return { color, radius: (r0 + r1) / 2, tube: (r1 - r0) / 2 }
      })
      .filter((b) => b.color !== '#2a1f3a')
  }, [def])

  useEffect(() => {
    if (!def.rings) return
    frameExtent[def.id] = Math.max(frameExtent[def.id] ?? 0, def.radius * def.rings.outer * 0.8)
  }, [def])

  useFrame((_, dt) => {
    if (!group.current || !body.current) return
    bodyPosition(def.id, group.current.position)
    body.current.rotation.y += def.spin * dt
    // Spring back after a poke.
    const q = squish.current
    q.v += (1 - q.s) * 120 * dt
    q.v *= Math.exp(-9 * dt)
    q.s += q.v * dt
    body.current.scale.set(def.radius * (2 - q.s), def.radius * q.s, def.radius * (2 - q.s))
  })

  const poke = () => {
    if (Math.abs(squish.current.v) >= 0.5) return
    squish.current.v -= 2.2
    // Each planet boops at its own pitch: big ones low, small ones high.
    cueBoop(MathUtils.clamp(1.6 / Math.sqrt(def.radius), 0.6, 2))
    // The guide names it (and what of Gopika's lives there).
    const chapter = journeyChapters.find((c) => c.station === def.id)
    const name = def.id[0].toUpperCase() + def.id.slice(1)
    useUi.getState().say(fill(chapter ? guide.pokeHome : guide.pokeOther, { name, heading: chapter?.heading ?? '' }))
  }

  return (
    <group ref={group}>
      <group rotation-z={MathUtils.degToRad(def.tilt)}>
        <mesh ref={body} geometry={geometry} scale={def.radius} onPointerOver={poke}>
          <meshPhysicalMaterial
            map={map}
            roughness={0.72}
            // Earth's white ice caps show the grain pinching at the poles; its relief carries the clay look.
            bumpMap={def.id === 'earth' ? null : grain}
            bumpScale={0.55}
            sheen={0.7}
            sheenRoughness={0.85}
            sheenColor="#ffffff"
          />
        </mesh>
        {ring.length > 0 && (
          <group rotation-x={-Math.PI / 2} scale={[1, 1, 0.22]}>
            {ring.map((b) => (
              <mesh key={b.radius}>
                <torusGeometry args={[b.radius, b.tube, 14, 128]} />
                <meshPhysicalMaterial color={b.color} roughness={0.75} bumpMap={grain} bumpScale={0.4} sheen={0.5} sheenRoughness={0.9} />
              </mesh>
            ))}
          </group>
        )}
        {def.id === 'earth' && <ClayClouds radius={def.radius} />}
        {equatorial}
      </group>
      {children}
    </group>
  )
}

