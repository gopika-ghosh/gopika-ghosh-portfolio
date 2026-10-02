import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { bodyList } from '../config/bodies'
import { CameraRig } from '../journey/CameraRig'
import type { Timeline } from '../journey/timeline'
import { FrameDriver } from './FrameDriver'
import { OrbitClock } from './OrbitClock'
import { AsteroidBelt } from './bodies/AsteroidBelt'
import { OrbitLines } from './bodies/OrbitLines'
import { Planet } from './bodies/Planet'
import { Sun } from './bodies/Sun'
import { Starfield } from './environment/Starfield'

const MAX_DPR = Math.min(2, window.devicePixelRatio || 1)
const planets = bodyList.filter((b) => b.kind === 'planet')

/** The fixed, full-screen WebGL layer behind the scrolling HTML. */
export function Experience({ timeline }: { timeline: Timeline }) {
  // Adaptive resolution: drop pixel ratio when frames slow down, restore it when there's headroom.
  const [dpr, setDpr] = useState(MAX_DPR)

  return (
    <div className="fixed inset-0" aria-hidden="true">
      <Canvas
        frameloop="never"
        dpr={dpr}
        camera={{ fov: 45, near: 0.3, far: 6000, position: [0, 150, 120] }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      >
        <color attach="background" args={['#030409']} />
        <PerformanceMonitor
          onIncline={() => setDpr(MAX_DPR)}
          onDecline={() => setDpr((d) => Math.max(1, d * 0.75))}
        />
        <FrameDriver />
        <OrbitClock />

        <ambientLight intensity={0.035} />
        <Starfield />
        <Sun />
        {planets.map((b) => (
          <Planet key={b.id} def={b} />
        ))}
        <AsteroidBelt />
        <OrbitLines />

        <CameraRig timeline={timeline} />
      </Canvas>
    </div>
  )
}
