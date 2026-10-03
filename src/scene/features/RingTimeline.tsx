import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { MathUtils, Quaternion, Vector3, type Group } from 'three'
import { easing } from 'maath'
import type { Role } from '../../content/types'
import { useUi } from '../../state/uiStore'

const _centre = new Vector3()
const _normal = new Vector3()
const _front = new Vector3()
const _right = new Vector3()
const _p = new Vector3()
const _q = new Quaternion()
/** Angular spread of the markers along the front of the ring (radians). */
const SPREAD = MathUtils.degToRad(88)

interface Props {
  roles: Role[]
  /** Marker orbit radius in the body's equatorial plane (scene units). */
  radius: number
  chapterIndex: number
}

/**
 * Experience markers placed along a ring (or any equatorial circle). Mount inside
 * the body's tilted frame. Markers spread across the arc facing the camera,
 * oldest on the left, so they stay readable however far the planet has orbited.
 */
export function RingTimeline({ roles, radius, chapterIndex }: Props) {
  const root = useRef<Group>(null)
  const markers = useRef<(Group | null)[]>([])
  const labels = useRef<(HTMLDivElement | null)[]>([])
  const fade = useRef({ v: 0 })
  const active = useUi((s) => s.active === chapterIndex)
  // Oldest first, left to right.
  const ordered = [...roles].reverse()

  useFrame(({ camera }, dt) => {
    if (!root.current) return
    // Work in world space: the ring plane's normal, the in-plane direction toward the
    // camera ("front"), and the camera's screen-right within that plane.
    root.current.getWorldPosition(_centre)
    _normal.set(0, 1, 0).applyQuaternion(root.current.getWorldQuaternion(_q))
    _front.subVectors(camera.position, _centre)
    _front.addScaledVector(_normal, -_front.dot(_normal)).normalize()
    _right.crossVectors(_normal, _front)
    const n = ordered.length
    ordered.forEach((_, i) => {
      const m = markers.current[i]
      if (!m) return
      // Oldest (i = 0) on the left, newest on the right, all on the near half of the ring.
      const a = n === 1 ? 0 : (i / (n - 1) - 0.5) * SPREAD
      _p.copy(_centre)
        .addScaledVector(_front, Math.cos(a) * radius)
        .addScaledVector(_right, Math.sin(a) * radius)
      m.position.copy(root.current!.worldToLocal(_p))
    })
    easing.damp(fade.current, 'v', useUi.getState().active === chapterIndex ? 1 : 0, 0.3, dt)
    for (const l of labels.current) if (l) l.style.opacity = fade.current.v.toFixed(3)
  })

  return (
    <group ref={root}>
      {ordered.map((r, i) => (
        <group key={`${r.company}-${r.start}`} ref={(el) => void (markers.current[i] = el)}>
          {active && (
            <Html center zIndexRange={[25, 0]} style={{ pointerEvents: 'none' }}>
              <div
                ref={(el) => void (labels.current[i] = el)}
                style={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <span className="size-2.5 rounded-full bg-sun shadow-[0_0_14px_3px_rgb(255_179_92/0.75)]" />
                <span className="mt-2 rounded-full border border-white/12 bg-black/50 px-3 py-1 text-center text-[11px] leading-tight whitespace-nowrap backdrop-blur-sm max-md:hidden">
                  <span className="text-sun/90 tabular-nums">{r.start}</span>
                  <span className="text-white/85"> · {r.short ?? r.company}</span>
                </span>
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  )
}
