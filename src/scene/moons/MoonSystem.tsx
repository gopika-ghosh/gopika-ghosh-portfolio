import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { AdditiveBlending, Color, Quaternion, Vector3, type Group } from 'three'
import { easing } from 'maath'
import { DEFAULT_MAX_VISIBLE_WORKS, sortedWorks, workById } from '../../content'
import type { WorkCategory } from '../../content/types'
import type { BodyDef } from '../../config/bodies'
import { frameExtent } from '../../journey/cameraPath'
import { useUi } from '../../state/uiStore'
import { orbitClock } from '../orbits'
import { useTextures } from '../textures'
import { useShaderMaterial } from '../useShaderMaterial'
import { layoutMoons, MORE_ID, type MoonSlot } from './layoutMoons'
import { moonRegistry, moreKey } from './registry'
import planetVert from '../shaders/planet.vert.glsl?raw'
import glowFrag from '../shaders/glow.frag.glsl?raw'

export const MOON_TEXTURE = { map: { name: 'moon', kind: 'color' as const } }
const GLOW = new Color('#ffb35c')

interface Props {
  planet: BodyDef
  category: WorkCategory
  /** Chapter index that visits this planet: labels and interaction are live only there. */
  chapterIndex: number
  maxVisible?: number
}

/**
 * The works of one category as moons around their planet.
 * Mount inside the planet's (untilted) group so the system follows its orbit.
 */
export function MoonSystem({ planet, category, chapterIndex, maxVisible = DEFAULT_MAX_VISIBLE_WORKS }: Props) {
  const list = useMemo(() => sortedWorks(category), [category])
  const layout = useMemo(() => layoutMoons(list, planet.radius, maxVisible), [list, planet.radius, maxVisible])
  const { map } = useTextures(MOON_TEXTURE)

  // Let the camera station back off far enough to frame every orbit.
  useEffect(() => {
    frameExtent[planet.id] = layout.extent
    return () => {
      delete frameExtent[planet.id]
    }
  }, [planet.id, layout.extent])

  const active = useUi((s) => s.active === chapterIndex)

  return (
    <group>
      {layout.slots.map((slot) => (
        <Moon
          key={slot.id}
          slot={slot}
          category={category}
          map={map}
          active={active}
          chapterIndex={chapterIndex}
          planetRadius={planet.radius}
          moreCount={slot.id === MORE_ID ? layout.overflow.length + 1 : 0}
        />
      ))}
    </group>
  )
}

interface MoonProps {
  slot: MoonSlot
  category: WorkCategory
  map: ReturnType<typeof useTextures<typeof MOON_TEXTURE>>['map']
  active: boolean
  chapterIndex: number
  planetRadius: number
  /** For the "+N" moon: how many works it stands for. */
  moreCount: number
}

const _moon = new Vector3()
const _planet = new Vector3()
const _a = new Vector3()
const _b = new Vector3()

function Moon({ slot, category, map, active, chapterIndex, planetRadius, moreCount }: MoonProps) {
  const isMore = slot.id === MORE_ID
  const key = isMore ? moreKey(category) : slot.id
  const work = isMore ? undefined : workById.get(slot.id)

  const pivot = useRef<Group>(null)
  const body = useRef<Group>(null)
  const label = useRef<HTMLDivElement>(null)
  const angle = useRef(slot.phase)
  // True while the pointer is over this moon's DOM label (so the 3D pointer-out doesn't clear hover).
  const overLabel = useRef(false)
  const motion = useRef({ speed: 1, scale: 1, glow: 0.5, label: 0 })

  // Orbit plane: tilted by `inclination` about an axis at angle `node` in the equatorial plane.
  const tilt = useMemo(
    () => new Quaternion().setFromAxisAngle(new Vector3(Math.cos(slot.node), 0, -Math.sin(slot.node)), slot.inclination),
    [slot.node, slot.inclination],
  )

  const glow = useShaderMaterial(() => ({
    vertexShader: planetVert,
    fragmentShader: glowFrag,
    uniforms: { uColor: { value: GLOW.clone() }, uStrength: { value: 0.5 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  }))

  useEffect(() => {
    if (!body.current) return
    moonRegistry.set(key, { object: body.current, size: slot.size })
    return () => {
      moonRegistry.delete(key)
    }
  }, [key, slot.size])

  useFrame(({ camera }, dt) => {
    if (!body.current || !pivot.current) return
    const ui = useUi.getState()
    const focused = ui.openWorkId === slot.id || (isMore && ui.viewAll === category)
    const hovered = ui.hovered === key
    const live = ui.active === chapterIndex
    const m = motion.current

    // Hovered or focused moons ease to a stop instead of halting abruptly.
    easing.damp(m, 'speed', hovered || focused ? 0 : 1, 0.35, dt)
    angle.current += slot.speed * m.speed * orbitClock.timeScale * dt
    body.current.position.set(Math.cos(angle.current) * slot.radius, 0, -Math.sin(angle.current) * slot.radius)
    body.current.rotation.y += dt * 0.1

    easing.damp(m, 'scale', hovered ? 1.35 : focused ? 1.15 : 1, 0.2, dt)
    body.current.scale.setScalar(m.scale)
    easing.damp(m, 'glow', focused ? 0.6 : hovered ? 1.4 : live ? 0.45 : 0.25, 0.25, dt)
    glow.uniforms.uStrength.value = m.glow

    // Labels: visible at this planet's stop, hidden behind the planet and while a panel is open.
    if (label.current) {
      body.current.getWorldPosition(_moon)
      pivot.current.parent!.getWorldPosition(_planet)
      const toMoon = _moon.distanceTo(camera.position)
      const toPlanet = _planet.distanceTo(camera.position)
      const behind =
        toMoon > toPlanet &&
        _a.subVectors(_moon, camera.position).angleTo(_b.subVectors(_planet, camera.position)) <
          Math.asin(Math.min(1, (planetRadius * 1.05) / toPlanet))
      const show = live && !ui.openWorkId && !ui.viewAll && !behind
      easing.damp(m, 'label', show ? 1 : 0, 0.15, dt)
      label.current.style.opacity = m.label.toFixed(3)
      label.current.style.pointerEvents = m.label > 0.5 ? 'auto' : 'none'
    }
  })

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (useUi.getState().active !== chapterIndex) return
    e.stopPropagation()
    useUi.getState().setHovered(key)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    if (overLabel.current) return
    if (useUi.getState().hovered === key) useUi.getState().setHovered(null)
    document.body.style.cursor = ''
  }
  const onClick = (e?: ThreeEvent<MouseEvent> | React.MouseEvent) => {
    if (useUi.getState().active !== chapterIndex) return
    e?.stopPropagation()
    document.body.style.cursor = ''
    if (isMore) useUi.getState().openViewAll(category)
    else useUi.getState().openWork(slot.id)
  }

  return (
    <group ref={pivot} quaternion={tilt}>
      <group ref={body}>
        <mesh scale={slot.size} castShadow={false}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshStandardMaterial
            map={map}
            roughness={1}
            color={isMore ? '#ffd9a8' : '#ffffff'}
            emissive="#2a1a0c"
            emissiveIntensity={0.6}
          />
        </mesh>
        <mesh scale={slot.size * 1.22} material={glow}>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        {/* Generous invisible hit area: moons are small. */}
        <mesh scale={Math.max(slot.size * 2.6, 0.3)} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {active && (
          <Html center position={[0, -slot.size * 2.4, 0]} zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
            <div ref={label} className="moon-label" style={{ opacity: 0 }}>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => onClick(e)}
                onPointerEnter={() => {
                  overLabel.current = true
                  useUi.getState().setHovered(key)
                }}
                onPointerLeave={() => {
                  overLabel.current = false
                  if (useUi.getState().hovered === key) useUi.getState().setHovered(null)
                }}
                aria-label={work ? work.title : 'View all projects'}
                className="group flex items-center gap-2 rounded-full border border-white/10 bg-black/45 p-1 whitespace-nowrap backdrop-blur-sm transition-colors hover:border-sun/60 sm:pr-3"
              >
                {work ? (
                  <img src={work.thumbnail} alt="" className="size-7 rounded-full object-cover ring-1 ring-sun/40" />
                ) : (
                  <span className="grid size-7 place-items-center rounded-full bg-sun/15 text-[11px] text-sun ring-1 ring-sun/40">
                    +{moreCount}
                  </span>
                )}
                {/* Phones show just the thumbnail; the full list sits right below in the overlay. */}
                <span className="hidden text-[11px] leading-tight text-white/85 sm:inline">
                  {work ? work.title : 'View all'}
                  {work && <span className="ml-1.5 text-white/40">{work.year}</span>}
                </span>
              </button>
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}

