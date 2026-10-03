import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Color, MathUtils, Matrix4, Quaternion, Vector2, Vector3, type Group, type PerspectiveCamera } from 'three'
import { easing } from 'maath'
import { cueBoop } from '../../audio/ambient'
import { workById } from '../../content'
import { fill, guide } from '../../content/guide'
import { works } from '../../content/works'
import { reducedMotion } from '../../lib/env'
import { pointer } from '../../journey/pointer'
import { scrollStore } from '../../journey/scrollStore'
import { locate, type Segment, type Timeline } from '../../journey/timeline'
import { glideTo } from '../../journey/useSmoothScroll'
import { isModalOpen, useUi } from '../../state/uiStore'
import { clayGrain, starGeometry } from './clayKit'

/** Distance in front of the camera (scene units): always in front of any planet. */
const DEPTH = 2.4
/** Where she floats on screen (fractions of half-width/height), clear of the text. */
const SPOT = new Vector2(0.8, -0.7)
/** Phones: tucked into the bottom-right corner, out of the text. */
const SPOT_PHONE = new Vector2(0.8, -0.88)
/** Phones, opening shot: a little higher, so her greeting clears "Scroll to explore". */
const SPOT_PHONE_INTRO = new Vector2(0.8, -0.42)
/** While a project panel covers the right half, she hops to the left to comment on it. */
const SPOT_PANEL = new Vector2(-0.7, -0.55)
const SIZE = 0.085
/** Phones (narrower than 640px) get a much smaller star. */
const SIZE_PHONE = 0.05
/** Phone layout below this width (matches the md breakpoint). */
const PHONE_MAX = 768
/** How long a reaction stays up before she returns to the stop's line (ms). */
const REMARK_MS = 4800
/** How long a stop's line stays up before the bubble tucks away (ms, plus reading time). */
const BUBBLE_MS = 4500

const seg: Segment = { from: 0, to: 0, t: 0 }
const _fwd = new Vector3()
const _right = new Vector3()
const _up = new Vector3()
const _pos = new Vector3()
const _off = new Vector2()
const _m = new Matrix4()
const _look = new Quaternion()

/**
 * Gopika's guide: a little clay star with a face. She floats beside the content, says one
 * line per stop (typed out in a speech bubble), reacts to what you do, and has a "next"
 * button to carry on the journey. Lines live in content/guide.ts.
 */
export function StarGuide({ timeline }: { timeline: Timeline }) {
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const eyes = useRef<Group>(null)
  const anim = useRef({
    x: window.innerWidth < PHONE_MAX ? SPOT_PHONE.x : SPOT.x,
    y: window.innerWidth < PHONE_MAX ? SPOT_PHONE.y : SPOT.y,
    show: 0,
    squish: 0,
    squishV: 0,
    tilt: 0,
    lean: 0,
    blink: 0,
    nextBlink: 2.5,
    talk: 0,
  })
  const tipIndex = useRef(0)
  const active = useUi((s) => s.active)
  const remark = useUi((s) => s.remark)
  const ready = useUi((s) => s.ready)
  const [parked, setParked] = useState(true)

  // What she's saying: a reaction if there is one, otherwise the current stop's line.
  const stop = timeline.stops[active]
  const stopLine = guide.stops[stop?.chapter.id ?? ''] ?? ''
  const line = remark?.text ?? stopLine
  const lineKey = remark ? `r${remark.id}` : `s${active}`
  const isLast = active >= timeline.stops.length - 1

  // Reactions expire.
  useEffect(() => {
    if (!remark) return
    const t = window.setTimeout(() => useUi.getState().clearRemark(), REMARK_MS)
    return () => window.clearTimeout(t)
  }, [remark])

  // A new stop clears any old reaction.
  useEffect(() => useUi.getState().clearRemark(), [active])

  // React to what the visitor does elsewhere on the page.
  useEffect(
    () =>
      useUi.subscribe((s, prev) => {
        if (s.openWorkId && s.openWorkId !== prev.openWorkId) {
          const w = workById.get(s.openWorkId)
          if (w) s.say(fill(guide.openWork[w.category], { title: w.title }))
        }
        if (s.viewAll && s.viewAll !== prev.viewAll) s.say(guide.openViewAll)
        if (s.tool && s.tool !== prev.tool) {
          const n = works.filter((w) => w.tools?.includes(s.tool!)).length
          const tpl = n > 1 ? guide.toolUsed : n === 1 ? guide.toolUsedOne : guide.toolEveryday
          s.say(fill(tpl, { tool: s.tool, n }))
        }
      }),
    [],
  )

  // A little hop whenever she starts a new line; the bubble tucks away after a while so it
  // never sits on top of the work. Tapping her brings it back.
  // On phones she only speaks unprompted on the opening shot; after that, tap her to hear more.
  const [open, setOpen] = useState(true)
  const [wake, setWake] = useState(0)
  const tapped = useRef(false)
  const introStop = stop?.chapter.kind === 'intro'
  useEffect(() => {
    const quiet = window.innerWidth < PHONE_MAX && !introStop && !tapped.current
    tapped.current = false
    if (quiet) {
      setOpen(false)
      return
    }
    anim.current.talk = 1
    setOpen(true)
    const t = window.setTimeout(() => setOpen(false), BUBBLE_MS + line.length * 25)
    return () => window.clearTimeout(t)
  }, [lineKey, line, wake, introStop])

  const geometry = useMemo(() => starGeometry(), [])
  const grain = clayGrain()

  useFrame(({ camera, size, clock }, dt) => {
    const cam = camera as PerspectiveCamera
    const r = root.current
    const b = body.current
    if (!r || !b) return
    const a = anim.current
    const ui = useUi.getState()
    const t = clock.elapsedTime

    // Is the journey parked at a stop? (Bubble shows only then, or for a reaction.)
    locate(scrollStore.u, timeline, seg)
    const atStop = seg.from === seg.to || seg.t > 0.97 || seg.t < 0.03
    if (atStop !== parked) setParked(atStop)

    // Placement in screen space.
    const aspect = size.width / size.height
    const modal = isModalOpen(ui)
    const phone = size.width < PHONE_MAX
    const intro = timeline.stops[ui.active]?.chapter.kind === 'intro'
    const home = phone ? (intro ? SPOT_PHONE_INTRO : SPOT_PHONE) : modal ? SPOT_PANEL : SPOT
    const near = !reducedMotion && !modal && Math.hypot(pointer.x - home.x, (pointer.y - home.y) * 0.6) < 0.4 ? 1 : 0
    easing.damp(a, 'x', home.x + MathUtils.clamp((pointer.x - home.x) * 0.25, -0.06, 0.06) * near, 0.45, dt)
    easing.damp(a, 'y', home.y + MathUtils.clamp((pointer.y - home.y) * 0.25, -0.06, 0.06) * near, 0.45, dt)
    // On phones a project panel covers the whole screen, so she steps out while it's open.
    easing.damp(a, 'show', ui.ready && !(phone && modal) ? 1 : 0, 0.3, dt)
    easing.damp(a, 'tilt', reducedMotion ? 0 : MathUtils.clamp(-(pointer.x - a.x) * 0.5, -0.35, 0.35), 0.4, dt)
    easing.damp(a, 'lean', atStop || reducedMotion ? 0 : 0.35, 0.3, dt)

    cam.getWorldDirection(_fwd)
    _right.crossVectors(_fwd, cam.up).normalize()
    _up.crossVectors(_right, _fwd)
    const tanY = Math.tan(MathUtils.degToRad(cam.fov / 2))
    _off.set(a.x, a.y)
    _pos
      .copy(cam.position)
      .addScaledVector(_fwd, DEPTH)
      .addScaledVector(_right, _off.x * DEPTH * tanY * aspect)
      .addScaledVector(_up, _off.y * DEPTH * tanY)
    r.position.copy(_pos)
    _look.setFromRotationMatrix(_m.lookAt(cam.position, _pos, cam.up))
    r.quaternion.copy(_look)

    // Squish spring (taps, new lines), bob, head tilt, blink.
    a.squishV += -a.squish * 140 * dt
    a.squishV *= Math.exp(-8 * dt)
    a.squish += a.squishV * dt
    if (a.talk > 0) {
      a.squishV += 2.2 * a.talk
      a.talk = 0
    }
    const bob = reducedMotion ? 0 : Math.sin(t * 1.8) * 0.012
    b.position.set(0, bob, 0)
    b.rotation.set(a.lean * 0.4, 0, a.tilt + (reducedMotion ? 0 : Math.sin(t * 0.9) * 0.06))
    const s = (phone ? SIZE_PHONE : SIZE) * a.show
    b.scale.set(s * (1 - a.squish * 0.25), s * (1 + a.squish * 0.3), s)

    a.nextBlink -= dt
    if (a.nextBlink <= 0) {
      a.blink = 1
      a.nextBlink = 2.2 + Math.random() * 3.5
    }
    a.blink = Math.max(0, a.blink - dt * 7)
    if (eyes.current) eyes.current.scale.y = 1 - Math.sin(a.blink * Math.PI) * 0.9
  })

  const tap = () => {
    if (!useUi.getState().ready) return
    anim.current.talk = 1.4
    tapped.current = true
    cueBoop(1.6)
    // First tap after the bubble tucked away: say the stop's line again.
    if (!open) {
      setWake((w) => w + 1)
      return
    }
    const tip = guide.tips[tipIndex.current % guide.tips.length]
    tipIndex.current++
    useUi.getState().say(tip)
  }

  const next = () => {
    const u = scrollStore.u
    const target = timeline.stops.find((s) => s.arrive > u + 0.02) ?? timeline.stops[0]
    cueBoop(1.2)
    glideTo(target.arrive)
  }

  const showBubble = ready && !!line && open && (parked || !!remark)
  // The bubble opens toward the middle of the screen.
  const modal = useUi(isModalOpen)
  const [phone, setPhone] = useState(() => window.innerWidth < PHONE_MAX)
  useEffect(() => {
    const on = () => setPhone(window.innerWidth < PHONE_MAX)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  const side: 'left' | 'right' = modal && !phone ? 'right' : 'left'

  return (
    <group ref={root}>
      <group ref={body}>
        {/* The star: puffy, warm, softly glowing. */}
        <mesh geometry={geometry}>
          <meshPhysicalMaterial
            color="#ffd257"
            emissive="#ff9e2c"
            emissiveIntensity={0.45}
            roughness={0.6}
            bumpMap={grain}
            bumpScale={0.25}
            sheen={0.6}
            sheenRoughness={0.8}
          />
        </mesh>
        {/* Face (on the front, facing the camera). */}
        <group position={[0, -0.02, 0.48]}>
          <group ref={eyes} position={[0, 0.1, 0]}>
            {[-1, 1].map((side) => (
              <group key={side} position={[side * 0.2, 0, 0]}>
                <mesh scale={[0.075, 0.1, 0.05]}>
                  <sphereGeometry args={[1, 16, 12]} />
                  <meshStandardMaterial color="#2a1a2e" roughness={0.4} />
                </mesh>
                <mesh position={[0.025, 0.035, 0.045]} scale={0.026}>
                  <sphereGeometry args={[1, 10, 8]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
            ))}
          </group>
          {/* Rosy cheeks */}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.33, -0.08, -0.02]} scale={[0.085, 0.055, 0.03]}>
              <sphereGeometry args={[1, 14, 10]} />
              <meshStandardMaterial color={CHEEK} roughness={0.7} transparent opacity={0.85} />
            </mesh>
          ))}
          {/* Smile: the lower half of a thin torus */}
          <mesh position={[0, -0.06, 0.01]} rotation-z={Math.PI}>
            <torusGeometry args={[0.085, 0.022, 8, 20, Math.PI]} />
            <meshStandardMaterial color="#2a1a2e" roughness={0.5} />
          </mesh>
        </group>
        {/* Generous invisible hit area. */}
        <mesh
          onClick={tap}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = '')}
        >
          <sphereGeometry args={[1.5, 10, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </group>

      <Html position={[0, 0, 0]} zIndexRange={[35, 0]} style={{ pointerEvents: 'none' }}>
        <SpeechBubble
          show={showBubble}
          line={line}
          lineKey={lineKey}
          isLast={isLast}
          onNext={modal ? undefined : next}
          side={side}
        />
      </Html>
    </group>
  )
}

const CHEEK = new Color('#ff8fb1')

/** The speech bubble: types its line out, with a "next stop" button. */
function SpeechBubble({
  show,
  line,
  lineKey,
  isLast,
  onNext,
  side,
}: {
  show: boolean
  line: string
  lineKey: string
  isLast: boolean
  /** Omitted while a project panel is open (the journey is paused then). */
  onNext?: () => void
  side: 'left' | 'right'
}) {
  const text = useRef<HTMLSpanElement>(null)

  // Typewriter, written straight to the DOM (no re-render per letter).
  useEffect(() => {
    const el = text.current
    if (!el) return
    if (reducedMotion) {
      el.textContent = line
      return
    }
    let i = 0
    el.textContent = ''
    const id = window.setInterval(() => {
      i += 2
      el.textContent = line.slice(0, i)
      if (i >= line.length) window.clearInterval(id)
    }, 22)
    return () => window.clearInterval(id)
  }, [lineKey, line])

  return (
    <div
      className={`absolute bottom-2 w-max max-w-[170px] transition-all duration-300 sm:bottom-3 sm:max-w-[220px] md:max-w-[320px] ${
        side === 'left' ? 'right-5 sm:right-7' : 'left-5 sm:left-7'
      } ${show ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}
    >
      <div className="relative rounded-xl border border-white/15 bg-[#140d2e]/90 px-3 pt-2 pb-2 font-display text-[11.5px] leading-snug sm:rounded-2xl sm:px-4 sm:pt-3 sm:pb-2.5 sm:text-[14px] text-white shadow-[0_10px_30px_-8px_rgb(0_0_0/0.7)] backdrop-blur-md">
        {/* Full line for layout (invisible) + typed line on top, so the bubble doesn't resize while typing. */}
        <span className="invisible block" aria-hidden="true">
          {line}
        </span>
        <span ref={text} className="absolute inset-x-3 top-2 sm:inset-x-4 sm:top-3" />
        {onNext && (
          <button
            type="button"
            tabIndex={-1}
            onClick={onNext}
            className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-sun/90 px-2.5 py-0.5 text-[10.5px] font-semibold sm:mt-2 sm:px-3 sm:text-[12px] text-[#2a1405] transition hover:bg-sun"
          >
            {isLast ? guide.home : guide.next} <span aria-hidden="true">→</span>
          </button>
        )}
        {/* Tail pointing toward her. */}
        <span
          className={`absolute bottom-2 size-2.5 rotate-45 bg-[#140d2e] sm:bottom-3 sm:size-3.5 ${
            side === 'left'
              ? '-right-[5px] border-t border-r border-white/15 sm:-right-[7px]'
              : '-left-[5px] border-b border-l border-white/15 sm:-left-[7px]'
          }`}
        />
      </div>
    </div>
  )
}
