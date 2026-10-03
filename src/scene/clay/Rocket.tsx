import { useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import {
  Color,
  type Group,
  InstancedMesh,
  LatheGeometry,
  MathUtils,
  Matrix4,
  type Mesh,
  type PerspectiveCamera,
  Quaternion,
  Vector2,
  Vector3,
} from 'three'
import { easing } from 'maath'
import { cueBoop, cueWhoosh } from '../../audio/ambient'
import { reducedMotion } from '../../lib/env'
import { scrollStore } from '../../journey/scrollStore'
import type { Timeline } from '../../journey/timeline'
import { glideTo } from '../../journey/useSmoothScroll'
import { isModalOpen, useUi } from '../../state/uiStore'
import { clayGrain } from './clayKit'

/** Distance in front of the camera (scene units) — close enough to never pass behind a planet. */
const DEPTH = 2.4
/** Where the rocket sits on screen (fractions of half-width/height). Away from the text. */
const SPOT = new Vector2(0.12, -0.62)
/** Overall size of the rocket (and its smoke). */
const SIZE = 0.24
const SPOT_PORTRAIT = new Vector2(0.62, 0.02)
const PUFFS = 36

const _fwd = new Vector3()
const _right = new Vector3()
const _up = new Vector3()
const _target = new Vector3()
const _vel = new Vector3()
const _prevCam = new Vector3()
const _nozzle = new Vector3()
const _m = new Matrix4()
const _q = new Quaternion()
const _s = new Vector3()
const _look = new Quaternion()
const _jitter = new Vector3()

/**
 * A little clay rocket that rides along the journey. It leans into flights and leaves a
 * trail of clay smoke; hover it to say hi, click it to fly to the next stop.
 */
export function Rocket({ timeline }: { timeline: Timeline }) {
  const root = useRef<Group>(null)
  const ship = useRef<Group>(null)
  const flame = useRef<Mesh>(null)
  const puffs = useRef<InstancedMesh>(null)
  const [hover, setHover] = useState(false)
  const motion = useRef({ speed: 0, bank: 0, pitch: 0, roll: 0, spin: 0, show: 0, wiggle: 0, flare: 0 })
  const started = useRef(false)

  // Puff particles live in world space so the trail stays behind as the camera moves.
  const pool = useMemo(
    () => Array.from({ length: PUFFS }, () => ({ pos: new Vector3(), vel: new Vector3(), age: 1, life: 1, size: 0.05 })),
    [],
  )
  const spawn = useRef(0)

  // Body: a lathe profile — round-shouldered capsule with a pointed nose.
  const body = useMemo(() => {
    const pts: Vector2[] = []
    const n = 24
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const y = -0.22 + t * 0.56
      const r = t < 0.12 ? 0.08 + (t / 0.12) * 0.035 : 0.115 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.12) / 0.88, 2.2)))
      pts.push(new Vector2(Math.max(r, 0.0001), y))
    }
    return new LatheGeometry(pts, 32)
  }, [])
  const grain = clayGrain()

  useFrame(({ camera, size, clock }, dt) => {
    const cam = camera as PerspectiveCamera
    const r = root.current
    const s = ship.current
    if (!r || !s) return
    const m = motion.current
    const ui = useUi.getState()

    // Camera basis.
    cam.getWorldDirection(_fwd)
    _right.crossVectors(_fwd, cam.up).normalize()
    _up.crossVectors(_right, _fwd)
    const tanY = Math.tan(MathUtils.degToRad(cam.fov / 2))
    const aspect = size.width / size.height
    const spot = aspect < 0.9 ? SPOT_PORTRAIT : SPOT
    _target
      .copy(cam.position)
      .addScaledVector(_fwd, DEPTH)
      .addScaledVector(_right, spot.x * DEPTH * tanY * aspect)
      .addScaledVector(_up, spot.y * DEPTH * tanY)

    // How fast (and which way) the camera is moving, in screen terms.
    if (!started.current) {
      _prevCam.copy(cam.position)
      started.current = true
    }
    _vel.subVectors(cam.position, _prevCam).divideScalar(Math.max(dt, 1e-3))
    _prevCam.copy(cam.position)
    const along = _vel.dot(_fwd)
    const side = _vel.dot(_right)
    const speed = Math.min(1, _vel.length() / 25)
    easing.damp(m, 'speed', speed, 0.25, dt)
    easing.damp(m, 'bank', reducedMotion ? 0 : MathUtils.clamp(-side / 20, -0.7, 0.7), 0.35, dt)
    easing.damp(m, 'pitch', reducedMotion ? 0 : MathUtils.clamp(along / 30, -0.5, 0.9), 0.35, dt)

    // Hide while a project panel or grid is open.
    easing.damp(m, 'show', isModalOpen(ui) || !ui.ready ? 0 : 1, 0.25, dt)
    easing.damp(m, 'wiggle', hover ? 1 : 0, 0.15, dt)
    easing.damp(m, 'flare', 0, 0.5, dt)
    m.spin = Math.max(0, m.spin - dt * 1.6)

    r.position.copy(_target)
    // Face the camera's frame, then add the toy pose: nose up-right, leaning into motion.
    _look.setFromRotationMatrix(_m.lookAt(cam.position, _target, cam.up))
    r.quaternion.copy(_look)
    const t = clock.elapsedTime
    const bob = reducedMotion ? 0 : Math.sin(t * 1.6) * 0.03
    s.position.set(0, bob, 0)
    s.rotation.set(
      -0.35 - m.pitch * 0.8, // lean forward (into the screen) when flying outward
      0,
      -0.55 + m.bank + Math.sin(t * 9) * 0.12 * m.wiggle,
    )
    s.rotateY(t * 0.6 + easeSpin(m.spin) * Math.PI * 2) // slow turn + barrel roll on click
    s.scale.setScalar(SIZE * m.show * (1 + m.wiggle * 0.08))

    // Flame: flickers, grows with speed and on take-off.
    if (flame.current) {
      const f = 0.55 + m.speed * 1.4 + m.flare * 1.6 + m.wiggle * 0.3
      flame.current.scale.set(1, f * (0.85 + Math.sin(t * 40) * 0.08 + Math.random() * 0.1), 1)
    }

    // Smoke puffs: emitted from the nozzle, more when moving.
    const p = puffs.current
    if (p) {
      flame.current?.getWorldPosition(_nozzle)
      spawn.current += dt * (m.show > 0.5 ? 6 + m.speed * 40 + m.flare * 60 : 0)
      while (spawn.current >= 1) {
        spawn.current -= 1
        const puff = pool.find((q) => q.age >= q.life)
        if (!puff) break
        puff.pos.copy(_nozzle)
        // Drift backwards relative to the camera so the trail streams behind the journey.
        puff.vel
          .copy(_vel)
          .multiplyScalar(-0.04)
          .addScaledVector(_up, -0.15 * SIZE)
          .add(_jitter.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.12 * SIZE))
        puff.age = 0
        puff.life = 0.9 + Math.random() * 0.8
        puff.size = (0.025 + Math.random() * 0.03) * SIZE
      }
      pool.forEach((q, i) => {
        q.age += dt
        q.pos.addScaledVector(q.vel, dt)
        const k = q.age / q.life
        const sc = k >= 1 ? 0 : q.size * (0.6 + k * 1.8) * (1 - k * k)
        p.setMatrixAt(i, _m.compose(q.pos, _q.identity(), _s.setScalar(sc)))
      })
      p.instanceMatrix.needsUpdate = true
    }
  })

  const ride = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (!useUi.getState().ready || isModalOpen(useUi.getState())) return
    const m = motion.current
    if (!reducedMotion) m.spin = 1
    m.flare = 1
    cueBoop(1.1)
    cueWhoosh()
    const u = scrollStore.u
    const next = timeline.stops.find((s) => s.arrive > u + 0.02) ?? timeline.stops[0]
    glideTo(next.arrive)
  }

  const nextLabel = () => {
    const u = scrollStore.u
    const next = timeline.stops.find((s) => s.arrive > u + 0.02)
    return next ? `Next stop: ${next.chapter.navLabel}` : 'Fly home'
  }

  return (
    <group>
      <group ref={root}>
        <group ref={ship}>
          {/* Body */}
          <mesh geometry={body}>
            <meshPhysicalMaterial color="#f4efe6" roughness={0.7} bumpMap={grain} bumpScale={0.3} sheen={0.6} sheenRoughness={0.8} />
          </mesh>
          {/* Red nose cap */}
          <mesh position={[0, 0.27, 0]}>
            <sphereGeometry args={[0.062, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ff5a5f" roughness={0.75} />
          </mesh>
          {/* Porthole */}
          <mesh position={[0, 0.08, 0.104]} rotation-x={0.12}>
            <torusGeometry args={[0.045, 0.014, 10, 24]} />
            <meshStandardMaterial color="#ff5a5f" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.08, 0.1]} rotation-x={0.12}>
            <circleGeometry args={[0.04, 24]} />
            <meshStandardMaterial color="#7cc8ff" emissive="#2a6fb0" emissiveIntensity={0.5} roughness={0.3} />
          </mesh>
          {/* Fins */}
          {[0, 1, 2].map((i) => (
            <group key={i} rotation-y={(i / 3) * Math.PI * 2}>
              <mesh position={[0, -0.14, 0.11]} rotation-x={0.35} scale={[0.25, 1, 1]}>
                <capsuleGeometry args={[0.05, 0.07, 6, 12]} />
                <meshStandardMaterial color="#ff5a5f" roughness={0.75} />
              </mesh>
            </group>
          ))}
          {/* Nozzle + flame */}
          <mesh position={[0, -0.235, 0]}>
            <cylinderGeometry args={[0.055, 0.075, 0.04, 20]} />
            <meshStandardMaterial color="#6b6f8a" roughness={0.6} />
          </mesh>
          <mesh ref={flame} position={[0, -0.255, 0]}>
            <coneGeometry args={[0.05, 0.16, 16, 1, true]} />
            <meshBasicMaterial color={FLAME} toneMapped={false} transparent opacity={0.92} />
          </mesh>
          {/* Generous invisible hit area. */}
          <mesh
            onPointerOver={(e) => {
              e.stopPropagation()
              setHover(true)
              document.body.style.cursor = 'pointer'
              cueBoop(1.4)
            }}
            onPointerOut={() => {
              setHover(false)
              document.body.style.cursor = ''
            }}
            onClick={ride}
          >
            <sphereGeometry args={[0.55, 10, 8]} />
            <meshBasicMaterial visible={false} />
          </mesh>
          {hover && (
            <Html center position={[0, 0.75, 0]} zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
              <span className="rounded-full border border-white/15 bg-black/60 px-3 py-1 font-display text-[12px] whitespace-nowrap text-white/90 backdrop-blur-sm">
                {nextLabel()} →
              </span>
            </Html>
          )}
        </group>
      </group>
      <instancedMesh ref={puffs} args={[undefined, undefined, PUFFS]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#fff2e6" roughness={0.9} emissive="#ffb08a" emissiveIntensity={0.25} />
      </instancedMesh>
    </group>
  )
}

/** HDR orange so the flame blooms. */
const FLAME = new Color(2.2, 1.0, 0.35)

/** Barrel roll: quick start, soft landing. `spin` runs 1 → 0. */
const easeSpin = (s: number) => {
  const t = 1 - s
  return t === 1 ? 0 : 1 - Math.pow(1 - t, 3)
}
