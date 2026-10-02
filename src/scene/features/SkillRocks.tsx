import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { MathUtils, Vector3, type Group } from 'three'
import { easing } from 'maath'
import { bodies } from '../../config/bodies'
import { stations } from '../../config/stations'
import { floatingSkillGroup, skills } from '../../content/skills'
import { seeded } from '../../lib/random'
import { useUi } from '../../state/uiStore'
import { createRockGeometry } from '../bodies/AsteroidBelt'
import { bodyAngle } from '../orbits'

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/**
 * Larger rocks drifting around the asteroid-belt camera station, each labelled with
 * a tool from content/skills.ts. They ride the belt (same rotation as AsteroidBelt),
 * tumble slowly, and their labels fade in only while the skills chapter is active.
 */
export function SkillRocks({ chapterIndex }: { chapterIndex: number }) {
  const group = useRef<Group>(null)
  const def = bodies.asteroids
  const names = useMemo(() => skills.find((g) => g.name === floatingSkillGroup)?.items ?? [], [])
  const geometry = useMemo(() => createRockGeometry(2, 101), [])
  const active = useUi((s) => s.active === chapterIndex)

  // Golden-angle scatter around the station point, in the belt's own frame.
  const rocks = useMemo(() => {
    const rand = seeded(5)
    const a = def.startAngle
    // The camera station rides the belt at this point (see bodies.asteroids).
    const centre = new Vector3(Math.cos(a) * def.orbitRadius, 0, -Math.sin(a) * def.orbitRadius)
    const radial = centre.clone().normalize()
    const tangent = new Vector3(radial.z, 0, -radial.x)
    // Pull the labelled rocks toward the camera (station azimuth ≈ 70°) so they stand
    // in front of the background cluster instead of mixing into it.
    const az = MathUtils.degToRad(stations.asteroids.kind === 'body' ? stations.asteroids.azimuth : 70)
    centre.addScaledVector(radial, -Math.cos(az) * 3.5).addScaledVector(tangent, Math.sin(az) * 3.5)
    return names.map((name, i) => {
      const t = i * GOLDEN_ANGLE
      const r = 1.4 + Math.sqrt((i + 0.5) / names.length) * 4.2
      const pos = centre
        .clone()
        .addScaledVector(radial, Math.cos(t) * r)
        .addScaledVector(tangent, Math.sin(t) * r * 1.7)
      pos.y = (rand() - 0.5) * 2.4
      return {
        name,
        pos,
        size: 0.28 + rand() * 0.18,
        spin: new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.6),
        bob: rand() * Math.PI * 2,
      }
    })
  }, [names, def.startAngle, def.orbitRadius])

  const meshes = useRef<(Group | null)[]>([])
  const labels = useRef<(HTMLDivElement | null)[]>([])
  const fade = useRef({ v: 0 })

  useFrame(({ clock }, dt) => {
    if (group.current) group.current.rotation.y = bodyAngle(def) - def.startAngle
    const t = clock.elapsedTime
    rocks.forEach((r, i) => {
      const m = meshes.current[i]
      if (!m) return
      m.rotation.x += r.spin.x * dt
      m.rotation.y += r.spin.y * dt
      m.position.y = r.pos.y + Math.sin(t * 0.4 + r.bob) * 0.15
    })
    easing.damp(fade.current, 'v', useUi.getState().active === chapterIndex ? 1 : 0, 0.3, dt)
    for (const l of labels.current) if (l) l.style.opacity = fade.current.v.toFixed(3)
  })

  return (
    <group ref={group}>
      {rocks.map((r, i) => (
        <group key={r.name} position={r.pos} ref={(el) => void (meshes.current[i] = el)}>
          <mesh geometry={geometry} scale={r.size}>
            <meshStandardMaterial color="#9a8a78" roughness={0.9} emissive="#2b1b0e" emissiveIntensity={0.5} />
          </mesh>
          {active && (
            <Html center position={[0, -r.size * 1.9, 0]} zIndexRange={[25, 0]} style={{ pointerEvents: 'none' }}>
              <div
                ref={(el) => void (labels.current[i] = el)}
                style={{ opacity: 0 }}
                className="rounded-full border border-white/12 bg-black/45 px-3 py-1 text-[12px] whitespace-nowrap text-white/85 backdrop-blur-sm"
              >
                {r.name}
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  )
}
