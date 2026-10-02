import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { MathUtils, Vector3, type Group } from 'three'
import { easing } from 'maath'
import { bodies } from '../../config/bodies'
import { stations } from '../../config/stations'
import { floatingSkillGroup, skills, toolLogos } from '../../content/skills'
import { works } from '../../content/works'
import { toolRegistry } from './toolRegistry'
import { seeded } from '../../lib/random'
import { hoverTool, leaveTool, useUi } from '../../state/uiStore'
import { createRockGeometry } from '../bodies/AsteroidBelt'
import { bodyAngle } from '../orbits'

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

  // A loose, staggered grid facing the camera, so logos never overlap on screen,
  // with a little depth and jitter so it still reads as rocks drifting in the belt.
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
    const towardCamera = radial.clone().multiplyScalar(-Math.cos(az)).addScaledVector(tangent, Math.sin(az))
    centre.addScaledVector(towardCamera, 3.5)
    // Shift toward screen-right, away from the text column on the left.
    const screenRight = new Vector3().crossVectors(towardCamera.clone().negate(), new Vector3(0, 1, 0)).normalize()
    centre.addScaledVector(screenRight, 1.5)
    const COLS = 3
    const rows = Math.ceil(names.length / COLS)
    return names.map((name, i) => {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const x = (col - (COLS - 1) / 2) * 2.5 + (row % 2 ? 0.9 : -0.3) + (rand() - 0.5) * 0.5
      const y = ((rows - 1) / 2 - row) * 1.9 + (rand() - 0.5) * 0.4
      const pos = centre
        .clone()
        .addScaledVector(screenRight, x)
        .addScaledVector(towardCamera, (rand() - 0.5) * 1.6)
      pos.y += y
      return {
        name,
        projects: works.filter((w) => w.tools?.includes(name)),
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
    // Only touch the DOM when values change: rewriting styles every frame can stop
    // Chrome painting parts of these layers.
    const op = fade.current.v > 0.995 ? '1' : fade.current.v < 0.005 ? '0' : fade.current.v.toFixed(2)
    const pe = fade.current.v > 0.5 ? 'auto' : 'none'
    for (const l of labels.current) {
      if (!l) continue
      if (l.style.opacity !== op) l.style.opacity = op
      if (l.style.pointerEvents !== pe) l.style.pointerEvents = pe
    }
  })

  // Register rocks for the skill lines; clear any shown tool when leaving the belt.
  useEffect(() => {
    rocks.forEach((r, i) => meshes.current[i] && toolRegistry.set(r.name, meshes.current[i]!))
    return () => rocks.forEach((r) => toolRegistry.delete(r.name))
  }, [rocks])
  useEffect(() => {
    if (!active && useUi.getState().tool) useUi.getState().setTool(null)
  }, [active])
  const shownTool = useUi((s) => s.tool)
  const openWork = useUi((s) => s.openWork)

  return (
    <group ref={group}>
      {rocks.map((r, i) => (
        <group key={r.name} position={r.pos} ref={(el) => void (meshes.current[i] = el)}>
          <mesh geometry={geometry} scale={r.size}>
            <meshStandardMaterial color="#9a8a78" roughness={0.9} emissive="#2b1b0e" emissiveIntensity={0.5} />
          </mesh>
          {active && (
            <Html
              center
              position={[0, r.size * 2.6, 0]}
              // The selected tool's badge (and its project list) sits above the others.
              zIndexRange={shownTool === r.name ? [28, 27] : [25, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <div
                ref={(el) => void (labels.current[i] = el)}
                style={{ opacity: 0, pointerEvents: 'none' }}
                className="relative flex flex-col items-center gap-1.5"
                onPointerEnter={() => hoverTool(r.name)}
                onPointerLeave={() => leaveTool(r.name)}
              >
                {/* The tool's logo on a glass badge. Hover (or tap) wires it to the projects that used it. */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => useUi.getState().setTool(useUi.getState().tool === r.name ? null : r.name)}
                  className={`grid size-14 place-items-center rounded-2xl border bg-black/45 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.8)] backdrop-blur-sm transition ${
                    shownTool === r.name ? 'scale-110 border-sun/70' : 'border-white/12 hover:border-white/30'
                  }`}
                  aria-label={r.name}
                >
                  {toolLogos[r.name] ? (
                    <img src={toolLogos[r.name]} alt="" className="size-8 object-contain" draggable={false} />
                  ) : (
                    <span className="text-[10px] text-white/85">{r.name}</span>
                  )}
                </button>
                <span className="text-[10px] tracking-[0.12em] whitespace-nowrap text-white/60 uppercase">{r.name}</span>
                {shownTool === r.name && r.projects.length > 0 && (
                  <ul className="absolute top-full z-10 mt-2 flex flex-col items-center gap-1">
                    {r.projects.map((w) => (
                      <li key={w.id}>
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => {
                            useUi.getState().setTool(null)
                            openWork(w.id)
                          }}
                          className="rounded-full border border-sun/40 bg-[#0b0c12]/90 px-3 py-1 text-[11px] whitespace-nowrap text-white/85 transition hover:border-sun hover:text-white"
                        >
                          {w.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  )
}
