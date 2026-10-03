import type { CSSProperties, ReactNode } from 'react'
import type { Stop, Timeline } from '../journey/timeline'
import type { Chapter } from '../content/types'
import { site } from '../content/site'
import { guide } from '../content/guide'
import { theme } from '../lib/env'
import { DEFAULT_MAX_VISIBLE_WORKS, sortedWorks } from '../content'
import { experience } from '../content/experience'
import { skills, toolLogos } from '../content/skills'
import { awards, testimonials } from '../content/testimonials'
import { hoverTool, isModalOpen, leaveTool, useUi } from '../state/uiStore'
import { Testimonials } from './Testimonials'

/**
 * The scrolling HTML layer. Every chapter is a real <section> whose height matches
 * its slice of the camera timeline, so scroll length, camera stops and content
 * always line up. This is also what screen readers and search engines read.
 */
export function Chapters({ timeline }: { timeline: Timeline }) {
  // While a project panel or grid is open, the page behind it is inert (no focus, hidden from screen readers).
  const modal = useUi(isModalOpen)
  return (
    <main
      className={`pointer-events-none relative z-10 transition-opacity duration-500 ${modal ? 'opacity-0' : 'opacity-100'}`}
      inert={modal}
    >
      {timeline.stops.map((stop) => (
        <ChapterSection key={stop.chapter.id} stop={stop} />
      ))}
    </main>
  )
}

/** Height in timeline units (1 unit = one viewport height, see useSmoothScroll). */
const units = (n: number): CSSProperties => ({ height: `calc(${n} * var(--unit, 100vh))` })

/** Stagger index for a revealed element (see [data-reveal] in index.css). */
const r = (i: number) => ({ 'data-reveal': '', style: { '--i': i } as CSSProperties })

function ChapterSection({ stop }: { stop: Stop }) {
  const { chapter, travel, dwell } = stop
  // Wide system shots put the system below the intro text and above the contact text.
  const layout =
    chapter.kind === 'intro'
      ? 'items-start justify-center pt-[14vh] text-center'
      : chapter.kind === 'contact'
        ? 'items-end justify-center pb-[10vh] text-center md:pb-[10vh]'
        : 'items-end pb-10 md:items-center md:pb-0'

  // Content reveals (staggered) when this becomes the active stop, and fades as the camera leaves.
  const shown = useUi((s) => s.ready && s.active === stop.index)

  return (
    <section
      aria-labelledby={`${chapter.id}-heading`}
      data-state={shown ? 'in' : 'out'}
      className="pointer-events-none relative"
    >
      {/* Scroll spent flying here. */}
      <div style={units(travel)} />
      {/* Scroll spent parked here: the content pins for (dwell − 1) units. The #anchor lives
          here (not on the section) so native #links land exactly where the camera arrives. */}
      <div id={chapter.id} style={units(dwell)}>
        <div className={`sticky top-0 flex px-6 md:px-16 ${layout}`} style={units(1)}>
          <Content chapter={chapter} index={stop.index} />
        </div>
      </div>
    </section>
  )
}

/**
 * A chapter's content. `page` renders the static (no-WebGL) variant: works as a card
 * grid instead of a list next to moons.
 */
export function Content({ chapter, index, page }: { chapter: Chapter; index: number; page?: boolean }) {
  switch (chapter.kind) {
    case 'intro':
      return <Intro />
    case 'about':
      return (
        <Panel chapter={chapter} index={index} wide>
          <About />
        </Panel>
      )
    case 'disciplines':
      return (
        <Panel chapter={chapter} index={index}>
          <Disciplines />
        </Panel>
      )
    case 'works':
      return (
        <Panel chapter={chapter} index={index} wide={page}>
          {page ? <WorksGrid chapter={chapter} /> : <WorksList chapter={chapter} />}
        </Panel>
      )
    case 'skills':
      return (
        <Panel chapter={chapter} index={index} wide>
          <Skills />
        </Panel>
      )
    case 'timeline':
      return (
        <Panel chapter={chapter} index={index}>
          <Experience />
        </Panel>
      )
    case 'testimonials':
      return (
        <Panel chapter={chapter} index={index} wide>
          <Testimonials testimonials={testimonials} awards={awards} />
        </Panel>
      )
    case 'contact':
      return <Contact chapter={chapter} index={index} />
  }
}

/** Eyebrow, heading and intro shared by every chapter; children add the specifics. */
function Panel({ chapter, index, wide, children }: { chapter: Chapter; index: number; wide?: boolean; children?: ReactNode }) {
  return (
    <div className={`pointer-events-auto w-full ${wide ? 'max-w-xl' : 'max-w-md'}`}>
      <p {...r(0)} className="mb-3 text-xs tracking-[0.3em] text-sun/80 uppercase">
        <span className="reveal-rule" aria-hidden="true" />
        {String(index).padStart(2, '0')} · {chapter.navLabel}
      </p>
      <h2 {...r(1)} id={`${chapter.id}-heading`} className="font-display text-4xl leading-[1.05] md:text-6xl">
        {chapter.heading}
      </h2>
      <p {...r(2)} className="mt-4 text-[15px] text-white/70 md:text-lg">
        {chapter.intro}
      </p>
      {/* The star guide's line for this stop, for screen readers (the bubble is visual only). */}
      {guide.stops[chapter.id] && <p className="sr-only">{guide.stops[chapter.id]}</p>}
      {children && (
        <div {...r(3)} className="mt-6 md:mt-8">
          {children}
        </div>
      )}
    </div>
  )
}

function Intro() {
  return (
    <div className="pointer-events-auto">
      <div className="intro-scrim relative">
      {/* Letters rise in one by one; screen readers get the plain name. */}
      <h1 id="home-heading" aria-label={site.name} className="font-display text-6xl leading-[0.95] font-semibold md:text-[8rem]">
        {/* Letters of each word stay together, so a long name wraps between words, never inside one. */}
        {site.name.split(' ').map((word, w, words) => {
          const offset = words.slice(0, w).join('').length
          return (
            <span key={w} className="inline-block whitespace-nowrap" aria-hidden="true">
              {[...word].map((ch, i) => (
                <span key={i} className="reveal-letter" style={{ '--i': offset + i } as CSSProperties}>
                  {ch}
                </span>
              ))}
              {w < words.length - 1 && <span className="inline-block w-[0.28em]" />}
            </span>
          )
        })}
      </h1>
      <p
        {...r(4)}
        className="mt-5 flex flex-wrap items-center justify-center gap-y-1 text-[13px] font-semibold tracking-[0.18em] text-white/95 uppercase md:text-base"
      >
        {/* Roles separated by sun-coloured dots, so they read as three distinct things. */}
        {site.title.split('·').map((role, i) => (
          // Never break inside a role; lines wrap between roles.
          <span key={i} className="whitespace-nowrap">
            {i > 0 && <span className="mx-2 text-sun md:mx-3" aria-hidden="true">•</span>}
            {role.trim()}
          </span>
        ))}
      </p>
      <p {...r(6)} className="mx-auto mt-5 hidden max-w-md text-white/80 md:block">
        {site.tagline}
      </p>
      </div>
      <div {...r(9)} className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3">
        <span className="text-xs tracking-[0.3em] text-white/45 uppercase">Scroll to explore</span>
        <span className="scroll-cue" aria-hidden="true" />
      </div>
    </div>
  )
}

function About() {
  return (
    <div className="flex gap-5">
      <img
        src={site.photo}
        alt={site.photoAlt}
        className="hidden h-36 w-28 shrink-0 rounded-2xl object-cover ring-1 ring-white/10 sm:block"
      />
      <div>
        <p className="text-[15px] leading-relaxed text-white/75">{site.bio}</p>
        <blockquote className="mt-5 border-l-2 border-sun/70 pl-4 font-display text-xl leading-snug text-white/90 italic md:text-2xl">
          {site.philosophy}
        </blockquote>
      </div>
    </div>
  )
}

function Disciplines() {
  return (
    <ul className="space-y-4">
      {site.disciplines.map((d) => (
        <li key={d.name} className="border-t border-white/10 pt-4">
          <h3 className="font-display text-2xl">{d.name}</h3>
          <p className="mt-1 text-sm text-white/65">{d.line}</p>
        </li>
      ))}
    </ul>
  )
}

/** Accessible list of the works the moons represent. */
function WorksList({ chapter }: { chapter: Chapter }) {
  const openWork = useUi((s) => s.openWork)
  const openViewAll = useUi((s) => s.openViewAll)
  if (!chapter.category) return null
  const list = sortedWorks(chapter.category)
  const max = chapter.maxVisibleWorks ?? DEFAULT_MAX_VISIBLE_WORKS
  const listed = list.length > max ? list.slice(0, max - 1) : list

  return (
    <div>
      <ol className="divide-y divide-white/10 border-y border-white/10">
        {listed.map((w) => (
          <li key={w.id}>
            <button
              type="button"
              onClick={() => openWork(w.id)}
              onPointerEnter={() => useUi.getState().setHovered(w.id)}
              onPointerLeave={() => useUi.getState().setHovered(null)}
              onFocus={() => useUi.getState().setHovered(w.id)}
              onBlur={() => useUi.getState().setHovered(null)}
              className="group flex w-full items-baseline justify-between gap-4 py-2.5 text-left"
            >
              <span className="flex items-baseline gap-2 text-[15px] text-white/85 transition group-hover:text-sun group-focus-visible:text-sun">
                <span
                  aria-hidden="true"
                  className="-mr-2 w-0 overflow-hidden text-sun opacity-0 transition-all duration-300 group-hover:mr-0 group-hover:w-3 group-hover:opacity-100 group-focus-visible:mr-0 group-focus-visible:w-3 group-focus-visible:opacity-100"
                >
                  →
                </span>
                {w.title}
                {w.featured && <span className="sr-only"> (featured)</span>}
              </span>
              <span className="shrink-0 text-xs text-white/40 tabular-nums">{w.year}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-center justify-between text-xs text-white/45">
        <span className="hidden md:inline">Select a moon or a title to open it.</span>
        {list.length > 1 && (
          <button
            type="button"
            onClick={() => openViewAll(chapter.category!)}
            className="tracking-[0.2em] text-sun/85 uppercase transition hover:text-sun"
          >
            {list.length > max ? `More work · ${list.length}` : `View all ${list.length}`} →
          </button>
        )}
      </div>
    </div>
  )
}

/** Static variant: every work as a card. */
function WorksGrid({ chapter }: { chapter: Chapter }) {
  const openWork = useUi((s) => s.openWork)
  if (!chapter.category) return null
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {sortedWorks(chapter.category).map((w) => (
        <li key={w.id}>
          <button
            type="button"
            onClick={() => openWork(w.id)}
            className="group block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition hover:border-sun/50"
          >
            <img src={w.thumbnail} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            <span className="block p-4">
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-display text-xl leading-tight">{w.title}</span>
                <span className="text-xs text-white/40">{w.year}</span>
              </span>
              <span className="mt-1.5 block text-sm text-white/60">{w.summary}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function Skills() {
  return (
    <div className="space-y-5">
      {skills.map((g) => (
        <div key={g.name}>
          <h3 className="mb-2 text-[11px] tracking-[0.25em] text-white/45 uppercase">{g.name}</h3>
          <ul className="flex flex-wrap gap-1.5">
            {g.items.map((s) => (
              <li
                key={s}
                onPointerEnter={() => toolLogos[s] && hoverTool(s)}
                onPointerLeave={() => toolLogos[s] && leaveTool(s)}
                className="flex items-center gap-1.5 rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[13px] text-white/80 backdrop-blur-sm"
              >
                {toolLogos[s] && <img src={toolLogos[s]} alt="" className="size-3.5 object-contain" />}
                {s}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function Experience() {
  return (
    <ol className="relative space-y-5 border-l border-white/15 pl-5">
      {experience.map((r) => (
        <li key={`${r.company}-${r.start}`} className="relative">
          <span className="absolute top-1.5 -left-[25px] size-2 rounded-full bg-sun shadow-[0_0_12px_rgb(255_179_92/0.8)]" aria-hidden="true" />
          <p className="text-xs text-white/45 tabular-nums">
            {r.start} – {r.end}
            {r.location && <span className="ml-2">· {r.location}</span>}
          </p>
          <h3 className="mt-0.5 text-[15px] text-white/90">
            {r.title} <span className="text-white/50">at</span> {r.company}
          </h3>
          {r.summary && <p className="mt-1 hidden text-sm text-white/55 md:block">{r.summary}</p>}
        </li>
      ))}
    </ol>
  )
}

function Contact({ chapter, index }: { chapter: Chapter; index: number }) {
  return (
    <div className="pointer-events-auto max-w-xl">
      <p {...r(0)} className="mb-3 text-xs tracking-[0.3em] text-sun/80 uppercase">
        {String(index).padStart(2, '0')} · {chapter.navLabel}
      </p>
      <h2 {...r(1)} id={`${chapter.id}-heading`} className="font-display text-5xl leading-[1.05] md:text-7xl">
        {chapter.heading}
      </h2>
      <p {...r(2)} className="mt-5 text-base text-white/70 md:text-lg">
        {chapter.intro}
      </p>
      <a
        {...r(3)}
        href={`mailto:${site.email}`}
        className="mt-8 inline-block border-b border-sun/60 pb-1 font-display text-2xl text-sun transition hover:border-sun md:text-3xl"
      >
        {site.email}
      </a>
      <div {...r(4)} className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
        {site.socials.map((s) => (
          <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="text-white/65 transition hover:text-white">
            {s.label}
          </a>
        ))}
        {site.resumeUrl && (
          <a
            href={site.resumeUrl}
            download
            className="rounded-full border border-white/20 px-4 py-1.5 text-white/85 transition hover:border-sun/60 hover:text-white"
          >
            Download résumé
          </a>
        )}
      </div>
      <Credits />
    </div>
  )
}

/** Licence attribution for third-party assets (required by CC BY 4.0). */
function Credits() {
  // The clay theme paints its own planets; the texture credit only applies to the real one.
  if (theme === 'clay') return null
  return (
    <p {...r(5)} className="mt-10 text-[11px] leading-relaxed text-white/35">
      Planet textures by{' '}
      <a className="underline decoration-white/20 hover:text-white/60" href="https://www.solarsystemscope.com/textures/">
        Solar System Scope
      </a>
      , licensed{' '}
      <a className="underline decoration-white/20 hover:text-white/60" href="https://creativecommons.org/licenses/by/4.0/">
        CC BY 4.0
      </a>
      , based on NASA imagery.
    </p>
  )
}
