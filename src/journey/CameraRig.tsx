import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import { easing } from 'maath'
import { stations } from '../config/stations'
import { cameraMotion } from './cameraMotion'
import { blendPoses, createPose, easeFlight, stationPose } from './cameraPath'
import { scrollStore } from './scrollStore'
import { locate, type Segment, type Timeline } from './timeline'

/** Seconds for the camera to catch up with its target; small, just enough to absorb jitter. */
const SMOOTH = 0.16
const MAX_PORTRAIT_FOV = 75

const poseA = createPose()
const poseB = createPose()
const target = createPose()
const seg: Segment = { from: 0, to: 0, t: 0 }
const UP = new Vector3(0, 1, 0)
const _d = new Vector3()
const _r = new Vector3()
const _u = new Vector3()
const _look = new Vector3()
const _prev = new Vector3()

/**
 * Drives the camera from scroll position. Runs entirely inside the frame loop:
 * scroll → segment → two station poses → blended pose → damped camera.
 */
export function CameraRig({ timeline }: { timeline: Timeline }) {
  const focus = useRef(new Vector3())
  const screen = useRef({ x: 0, y: 0 })
  const started = useRef(false)

  useFrame(({ camera, size }, dt) => {
    const cam = camera as PerspectiveCamera
    const aspect = size.width / size.height
    const portrait = aspect < 0.9

    // 1. Where are we along the journey?
    locate(scrollStore.u, timeline, seg)
    const stopA = timeline.stops[seg.from].chapter.station
    const stopB = timeline.stops[seg.to].chapter.station

    // 2. Resolve both ends from live orbital positions and blend.
    stationPose(stations[stopA], portrait, poseA)
    if (seg.from === seg.to) {
      target.position.copy(poseA.position)
      target.focus.copy(poseA.focus)
      target.screen.copy(poseA.screen)
      target.fov = poseA.fov
    } else {
      stationPose(stations[stopB], portrait, poseB)
      blendPoses(poseA, poseB, easeFlight(seg.t), target)
    }

    // Portrait screens are narrow: widen the vertical FOV so the horizontal view matches a square one.
    let fov = target.fov
    if (aspect < 1) {
      const half = Math.atan(Math.tan(MathUtils.degToRad(fov / 2)) / aspect)
      fov = Math.min(MAX_PORTRAIT_FOV, MathUtils.radToDeg(half * 2))
    }

    // 3. Damp towards the target (snap on the very first frame).
    if (!started.current) {
      cam.position.copy(target.position)
      focus.current.copy(target.focus)
      screen.current.x = target.screen.x
      screen.current.y = target.screen.y
      cam.fov = fov
      _prev.copy(target.position)
      started.current = true
    } else {
      easing.damp3(cam.position, target.position, SMOOTH, dt)
      easing.damp3(focus.current, target.focus, SMOOTH, dt)
      easing.damp(screen.current, 'x', target.screen.x, SMOOTH * 2, dt)
      easing.damp(screen.current, 'y', target.screen.y, SMOOTH * 2, dt)
      easing.damp(cam, 'fov', fov, SMOOTH, dt)
    }
    cam.updateProjectionMatrix()

    // Motion signal for effects: speed relative to distance from what we're looking at,
    // so a fast flight across the outer system reads the same as a fast inner one.
    if (dt > 0) {
      const rel = cam.position.distanceTo(_prev) / dt / Math.max(cam.position.distanceTo(focus.current), 1)
      easing.damp(cameraMotion, 'speed', Math.min(1, Math.max(0, rel - 0.15) / 1.1), 0.25, dt)
    }
    _prev.copy(cam.position)

    // 4. Aim so the focused body lands at its screen offset (text gets the other side).
    _d.subVectors(focus.current, cam.position).normalize()
    _r.crossVectors(_d, UP).normalize()
    _u.crossVectors(_r, _d)
    const tanY = Math.tan(MathUtils.degToRad(cam.fov / 2))
    _look
      .copy(_d)
      .addScaledVector(_r, -screen.current.x * tanY * aspect)
      .addScaledVector(_u, -screen.current.y * tanY)
      .add(cam.position)
    cam.lookAt(_look)
  })

  return null
}
