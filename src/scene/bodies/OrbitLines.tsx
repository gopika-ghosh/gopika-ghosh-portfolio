import { theme } from '../../lib/env'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { Vector3 } from 'three'
import type { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { easing } from 'maath'
import { bodyList } from '../../config/bodies'
import type { Timeline } from '../../journey/timeline'
import { useUi } from '../../state/uiStore'

const SEGMENTS = 256
/** Opacity of the active planet's orbit, its neighbours, everything else, and all orbits in wide shots. */
const ACTIVE = 0.22
const NEIGHBOUR = 0.05
const REST = 0.018
const OVERVIEW = 0.07

/**
 * Faint orbit paths. They fade in only near the planet you're visiting; in the wide
 * shots (system, beyond) every orbit shows evenly, like a diagram of the system.
 */
export function OrbitLines({ timeline }: { timeline: Timeline }) {
  const planets = useMemo(() => bodyList.filter((b) => b.kind === 'planet'), [])
  const orbits = useMemo(
    () =>
      planets.map((b) => ({
        id: b.id,
        points: Array.from({ length: SEGMENTS + 1 }, (_, i) => {
          const a = (i / SEGMENTS) * Math.PI * 2
          return new Vector3(Math.cos(a) * b.orbitRadius, 0, -Math.sin(a) * b.orbitRadius)
        }),
      })),
    [planets],
  )
  const lines = useRef<(Line2 | null)[]>([])
  const levels = useRef(planets.map(() => ({ v: OVERVIEW })))

  useFrame((_, dt) => {
    const station = timeline.stops[useUi.getState().active]?.chapter.station
    const activeIndex = planets.findIndex((p) => p.id === station)
    const wide = station === 'system' || station === 'beyond'
    planets.forEach((_, i) => {
      const target = wide
        ? OVERVIEW
        : activeIndex < 0
          ? REST
          : i === activeIndex
            ? ACTIVE
            : Math.abs(i - activeIndex) === 1
              ? NEIGHBOUR
              : REST
      const level = levels.current[i]
      easing.damp(level, 'v', target, 0.6, dt)
      const line = lines.current[i]
      if (line) line.material.opacity = level.v
    })
  })

  return (
    <group>
      {orbits.map((o, i) => (
        <Line
          key={o.id}
          ref={(el) => void (lines.current[i] = el as unknown as Line2 | null)}
          points={o.points}
          color={theme === 'clay' ? '#c9b8ff' : '#ffd9a8'}
          lineWidth={theme === 'clay' ? 1.5 : 1}
          transparent
          opacity={OVERVIEW}
          depthWrite={false}
        />
      ))}
    </group>
  )
}
