import type { CSSProperties } from 'react'
import { bodies, bodyList } from '../config/bodies'
import { chapters } from '../content/chapters'
import { site } from '../content/site'
import type { StationId } from '../content/types'
import { Content } from './Chapters'
import { ProjectPanel } from './ProjectPanel'
import { SoundToggle } from './SoundToggle'
import { ViewAllGrid } from './ViewAllGrid'

/**
 * The portfolio without WebGL: same content, same project panels, native scrolling,
 * and an illustrated solar system in place of the 3D scene. Shown when WebGL 2 is
 * unavailable or the 3D layer fails to start.
 */
export function Fallback2D() {
  const sections = chapters.map((chapter, index) => ({ chapter, index })).filter(({ chapter }) => chapter.kind !== 'intro')

  return (
    <div className="fallback-sky min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#030409]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
          <a href="#top" className="font-display text-xl text-white/90">
            {site.name}
            <span className="text-sun">.</span>
          </a>
          <nav aria-label="Sections" className="-mx-2 flex flex-1 gap-1 overflow-x-auto text-xs tracking-[0.18em] whitespace-nowrap uppercase">
            {sections.map(({ chapter }) => (
              <a key={chapter.id} href={`#${chapter.id}`} className="rounded-full px-2 py-1 text-white/55 transition hover:text-white">
                {chapter.navLabel}
              </a>
            ))}
          </nav>
          <SoundToggle />
        </div>
      </header>

      <main id="top">
        <section aria-labelledby="home-heading" className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-16 pb-10 text-center">
          <h1 id="home-heading" className="font-display text-7xl leading-none md:text-[8rem]">
            {site.name}
          </h1>
          <p className="mt-4 text-sm tracking-[0.25em] text-white/70 uppercase md:text-base">{site.title}</p>
          <p className="mt-5 max-w-md text-white/60">{site.tagline}</p>
          <SystemIllustration />
        </section>

        {sections.map(({ chapter, index }) => (
          <section
            key={chapter.id}
            id={chapter.id}
            aria-labelledby={`${chapter.id}-heading`}
            data-state="in"
            className="mx-auto max-w-6xl scroll-mt-20 border-t border-white/5 px-6 py-20 md:py-28"
          >
            <div className={`flex gap-10 ${chapter.kind === 'contact' ? 'justify-center text-center' : ''}`}>
              {chapter.kind !== 'contact' && <PlanetBadge station={chapter.station} />}
              <Content chapter={chapter} index={index} page />
            </div>
          </section>
        ))}
      </main>

      <ProjectPanel />
      <ViewAllGrid />
    </div>
  )
}

/** A small rendered planet for each section, in that body's colours. */
function PlanetBadge({ station }: { station: StationId }) {
  const body = station in bodies ? bodies[station as keyof typeof bodies] : undefined
  if (!body || body.kind === 'belt') return <span className="hidden w-20 shrink-0 md:block" aria-hidden="true" />
  const isSun = body.kind === 'star'
  return (
    <span aria-hidden="true" className="relative mt-2 hidden size-20 shrink-0 md:block">
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: isSun
            ? 'radial-gradient(circle at 50% 50%, #fff1cf 0%, #ffb35c 45%, #ff7a1a 100%)'
            : `radial-gradient(circle at 32% 30%, ${body.color} 0%, ${body.color} 35%, #05060a 100%)`,
          boxShadow: isSun ? '0 0 40px 8px rgb(255 160 70 / 0.45)' : `0 0 24px -6px ${body.color}`,
        }}
      />
      {body.rings && (
        <span className="absolute top-1/2 left-1/2 h-4 w-32 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-[50%] border border-[#d9c08f]/50" />
      )}
    </span>
  )
}

/** The whole system as a flat diagram: orbits, the Sun's glow, planets at their start angles. */
function SystemIllustration() {
  const planets = bodyList.filter((b) => b.kind === 'planet')
  const max = Math.max(...planets.map((p) => p.orbitRadius))
  const R = 290 // svg units for the outermost orbit
  const scale = (r: number) => 40 + (r / max) * (R - 40)

  return (
    <svg viewBox="-320 -170 640 340" className="mt-12 w-full max-w-4xl" role="img" aria-label="An illustration of the solar system">
      <defs>
        <radialGradient id="fb-sun">
          <stop offset="0" stopColor="#fff1cf" />
          <stop offset="0.45" stopColor="#ffb35c" />
          <stop offset="1" stopColor="#ff7a1a" />
        </radialGradient>
        <radialGradient id="fb-glow">
          <stop offset="0" stopColor="#ffb35c" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffb35c" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Tilted, as if seen from above the plane. */}
      <g transform="scale(1 0.5)">
        {planets.map((p) => (
          <circle key={p.id} r={scale(p.orbitRadius)} fill="none" stroke="#ffd9a8" strokeOpacity="0.12" />
        ))}
        <circle r={scale(40)} fill="none" stroke="#9a8f86" strokeOpacity="0.18" strokeWidth="10" strokeDasharray="1 5" />
      </g>
      <circle r="70" fill="url(#fb-glow)" />
      <circle r="18" fill="url(#fb-sun)" />
      <g className="fallback-orbits">
        {planets.map((p, i) => {
          const a = p.startAngle
          const x = Math.cos(a) * scale(p.orbitRadius)
          const y = -Math.sin(a) * scale(p.orbitRadius) * 0.5
          const r = 3 + p.radius * 2.2
          return (
            <g key={p.id} style={{ '--i': i } as CSSProperties}>
              {p.rings && <ellipse cx={x} cy={y} rx={r * 2.2} ry={r * 0.6} fill="none" stroke="#d9c08f" strokeOpacity="0.6" />}
              <circle cx={x} cy={y} r={r} fill={p.color} />
            </g>
          )
        })}
      </g>
    </svg>
  )
}
