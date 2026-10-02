import type { CSSProperties } from 'react'
import type { Stop, Timeline } from '../journey/timeline'
import { site } from '../content/site'

/**
 * The scrolling HTML layer. Every chapter is a real <section> whose height matches
 * its slice of the camera timeline, so scroll length, camera stops and content
 * always line up. This is also what screen readers and search engines read.
 *
 * Phase 1: grey-box layouts. Phase 3 adds the real per-kind designs.
 */
export function Chapters({ timeline }: { timeline: Timeline }) {
  return (
    <main className="relative z-10">
      {timeline.stops.map((stop) => (
        <ChapterSection key={stop.chapter.id} stop={stop} />
      ))}
    </main>
  )
}

/** Height in timeline units (1 unit = one viewport height, see useSmoothScroll). */
const units = (n: number): CSSProperties => ({ height: `calc(${n} * var(--unit, 100vh))` })

function ChapterSection({ stop }: { stop: Stop }) {
  const { chapter, travel, dwell } = stop
  // Wide system shots put the system below the intro text and above the contact text.
  const layout =
    chapter.kind === 'intro'
      ? 'items-start justify-center pt-[14vh] text-center'
      : chapter.kind === 'contact'
        ? 'items-end justify-center pb-[12vh] text-center md:pb-[12vh]'
        : 'items-end md:items-center'

  return (
    <section id={chapter.id} aria-labelledby={`${chapter.id}-heading`} className="pointer-events-none relative">
      {/* Scroll spent flying here. */}
      <div style={units(travel)} />
      {/* Scroll spent parked here: the content pins for (dwell − 1) units. */}
      <div style={units(dwell)}>
        <div
          className={`sticky top-0 flex px-6 pb-14 md:px-16 md:pb-0 ${layout}`}
          style={units(1)}
        >
          {chapter.kind === 'intro' ? (
            <Intro />
          ) : (
            <div className="pointer-events-auto max-w-md">
              <p className="mb-3 text-xs tracking-[0.3em] text-sun/80 uppercase">
                {String(stop.index).padStart(2, '0')} · {chapter.navLabel}
              </p>
              <h2 id={`${chapter.id}-heading`} className="font-display text-5xl leading-[1.05] md:text-7xl">
                {chapter.heading}
              </h2>
              <p className="mt-5 text-base text-white/70 md:text-lg">{chapter.intro}</p>
              {chapter.kind === 'contact' && (
                <a href={`mailto:${site.email}`} className="mt-8 inline-block border-b border-sun/60 pb-1 text-sun">
                  {site.email}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Intro() {
  return (
    <div className="pointer-events-auto">
      <h1 id="home-heading" className="font-display text-7xl leading-none md:text-[9rem]">
        {site.name}
      </h1>
      <p className="mt-4 text-sm tracking-[0.25em] text-white/70 uppercase md:text-base">{site.title}</p>
      <p className="absolute inset-x-0 bottom-10 text-xs tracking-[0.3em] text-white/45 uppercase">Scroll to explore</p>
    </div>
  )
}
