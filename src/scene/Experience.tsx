import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { bodyList, type BodyDef, type BodyLook } from '../config/bodies'
import { quality } from '../config/quality'
import { CameraRig } from '../journey/CameraRig'
import type { Timeline } from '../journey/timeline'
import { FrameDriver } from './FrameDriver'
import { OrbitClock } from './OrbitClock'
import { Ready } from './Ready'
import { PreloadTextures, type TextureSpec } from './textures'
import { AsteroidBelt } from './bodies/AsteroidBelt'
import { OrbitLines } from './bodies/OrbitLines'
import { Planet } from './bodies/Planet'
import { Sun } from './bodies/Sun'
import { Effects } from './effects/Effects'
import { MILKY_WAY, MilkyWay } from './environment/MilkyWay'
import { Starfield } from './environment/Starfield'
import { RingTimeline } from './features/RingTimeline'
import { SkillRocks } from './features/SkillRocks'
import { MOON_TEXTURE, MoonSystem } from './moons/MoonSystem'
import { experience } from '../content/experience'
import { useUi } from '../state/uiStore'

const MAX_DPR = Math.min(quality.maxDpr, window.devicePixelRatio || 1)
const planets = bodyList.filter((b): b is BodyDef & { look: BodyLook } => b.kind === 'planet' && !!b.look)
const allTextures: TextureSpec[] = [
  MILKY_WAY.map,
  MOON_TEXTURE.map,
  ...planets.flatMap((p) => Object.values(p.look.textures).filter((t): t is TextureSpec => !!t)),
]

/** The fixed, full-screen WebGL layer behind the scrolling HTML. */
export function Experience({ timeline }: { timeline: Timeline }) {
  // Adaptive resolution: drop pixel ratio when frames slow down, restore it when there's headroom.
  const [dpr, setDpr] = useState(MAX_DPR)

  // Which chapters visit each planet (drives 4K texture streaming).
  const stopsByBody = useMemo(() => {
    const map: Record<string, number[]> = {}
    for (const s of timeline.stops) (map[s.chapter.station] ??= []).push(s.index)
    return map
  }, [timeline])

  return (
    <div className="fixed inset-0" aria-hidden="true">
      <Canvas
        frameloop="never"
        dpr={dpr}
        camera={{ fov: 45, near: 0.3, far: 6000, position: [0, 150, 120] }}
        // Anti-aliasing is done by the post-processing composer (MSAA), not the default framebuffer.
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false }}
        // Clicking empty space closes an open project. Only clicks on the canvas itself count:
        // DOM labels (moon titles) live in the same event container and must not close it.
        onPointerMissed={(e) => {
          if (!(e.target instanceof HTMLCanvasElement)) return
          if (useUi.getState().openWorkId) useUi.getState().closeWork()
        }}
      >
        <color attach="background" args={['#030409']} />
        <PerformanceMonitor
          onIncline={() => setDpr(MAX_DPR)}
          onDecline={() => setDpr((d) => Math.max(1, d * 0.75))}
        />
        <FrameDriver />
        <OrbitClock />
        <CameraRig timeline={timeline} />
        <PreloadTextures specs={allTextures} />

        <Suspense fallback={null}>
          <MilkyWay />
          <Starfield density={quality.starDensity} />
          <Sun />
          {planets.map((b) => {
            // Content attached to this planet by chapters.ts: moons for works, ring markers for a timeline.
            const here = timeline.stops.filter((s) => s.chapter.station === b.id)
            const works = here.find((s) => s.chapter.kind === 'works' && s.chapter.category)
            const history = here.find((s) => s.chapter.kind === 'timeline')
            return (
              <Planet
                key={b.id}
                def={b}
                stops={stopsByBody[b.id] ?? []}
                equatorial={
                  history && (
                    <RingTimeline
                      roles={experience}
                      chapterIndex={history.index}
                      radius={b.radius * (b.rings ? b.rings.outer - 0.1 : 2.2)}
                    />
                  )
                }
              >
                {works && (
                  <MoonSystem
                    planet={b}
                    category={works.chapter.category!}
                    chapterIndex={works.index}
                    maxVisible={works.chapter.maxVisibleWorks}
                  />
                )}
              </Planet>
            )
          })}
          <ambientLight intensity={0.03} />
          <AsteroidBelt />
          {timeline.stops
            .filter((s) => s.chapter.kind === 'skills' && s.chapter.station === 'asteroids')
            .map((s) => (
              <SkillRocks key={s.chapter.id} chapterIndex={s.index} />
            ))}
          <OrbitLines timeline={timeline} />
          <Effects />
          <Ready />
        </Suspense>
      </Canvas>
    </div>
  )
}
