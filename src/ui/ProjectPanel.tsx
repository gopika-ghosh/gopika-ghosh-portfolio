import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { categoryLabel, sortedWorks, workById } from '../content'
import type { Work } from '../content/types'
import { parseVideo } from '../lib/video'
import { useUi } from '../state/uiStore'
import { useDialog } from './useDialog'

/** How long the slide-out lasts before the panel unmounts (ms). Matches the CSS duration. */
const EXIT_MS = 500

/**
 * Project details for the open work. Slides in from the right on desktop and up
 * from the bottom on phones, leaving the focused moon visible beside/above it.
 */
export function ProjectPanel() {
  const openId = useUi((s) => s.openWorkId)
  const closeWork = useUi((s) => s.closeWork)

  // Keep the last work rendered during the exit transition.
  const [shownId, setShownId] = useState<string | null>(openId)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (openId) {
      setShownId(openId)
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    setVisible(false)
    const t = window.setTimeout(() => setShownId(null), EXIT_MS)
    return () => window.clearTimeout(t)
  }, [openId])

  const panel = useRef<HTMLDivElement>(null)
  // Only once it's actually rendered, so focus can move into it.
  useDialog(!!openId && shownId === openId, closeWork, panel)

  const work = shownId ? workById.get(shownId) : undefined
  if (!work) return null

  return (
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-title"
      tabIndex={-1}
      data-lenis-prevent
      data-state={visible ? 'in' : 'out'}
      className={`fixed z-40 flex flex-col overflow-hidden border-white/10 bg-[#07080d]/88 shadow-2xl backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none
        inset-x-0 bottom-0 h-[64svh] rounded-t-3xl border-t
        md:inset-y-0 md:right-0 md:left-auto md:h-auto md:w-[min(600px,48vw)] md:rounded-none md:border-t-0 md:border-l
        ${visible ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full md:translate-y-0'}`}
    >
      <header className="flex items-center justify-between px-6 pt-5 pb-3 md:px-10 md:pt-8">
        <p data-reveal style={{ '--i': 0 } as CSSProperties} className="text-xs tracking-[0.3em] text-sun/80 uppercase">
          {categoryLabel[work.category]} · {work.year}
        </p>
        <button
          type="button"
          data-autofocus
          onClick={closeWork}
          className="grid size-10 place-items-center rounded-full border border-white/15 text-white/80 transition hover:border-sun/60 hover:text-white focus-visible:outline-2 focus-visible:outline-sun"
          aria-label="Close project"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      {/* Keyed by work so switching projects replays the reveal. */}
      <div key={work.id} className="flex-1 overflow-y-auto overscroll-contain px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-10">
        <h2 data-reveal style={{ '--i': 1 } as CSSProperties} id="project-title" className="font-display text-4xl leading-[1.05] md:text-5xl">
          {work.title}
        </h2>
        <p data-reveal style={{ '--i': 2 } as CSSProperties} className="mt-3 text-sm text-white/60">
          {work.role}
        </p>
        {work.tags && work.tags.length > 0 && (
          <ul data-reveal style={{ '--i': 3 } as CSSProperties} className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
            {work.tags.map((t) => (
              <li key={t} className="rounded-full border border-white/12 px-3 py-1 text-[11px] text-white/65">
                {t}
              </li>
            ))}
          </ul>
        )}

        <div data-reveal style={{ '--i': 4 } as CSSProperties} className="mt-7">
          <Hero work={work} key={work.id} />
        </div>

        <div className="mt-7 space-y-4 text-[15px] leading-relaxed text-white/75">
          {work.description.split(/\n\s*\n/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {work.externalLink && (
          <a
            href={work.externalLink.url}
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-sun px-5 py-2.5 text-sm font-medium text-[#1a0d02] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun"
          >
            {work.externalLink.label}
            <span aria-hidden="true">↗</span>
          </a>
        )}

        {/* The first image is the hero (unless there's a video), the rest form the gallery. */}
        <div className="mt-8 grid gap-3">
          {work.images.slice(work.video ? 0 : 1).map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`${work.title} — image ${i + (work.video ? 1 : 2)}`}
              loading="lazy"
              className="w-full rounded-xl bg-white/5"
            />
          ))}
        </div>

        <Neighbours work={work} />
      </div>
    </div>
  )
}

/** Video (click-to-load) or the first image. */
function Hero({ work }: { work: Work }) {
  const [playing, setPlaying] = useState(false)
  const video = work.video ? parseVideo(work.video.url) : null
  const poster = work.video?.poster ?? work.images[0] ?? work.thumbnail

  if (!video) {
    return <img src={work.images[0] ?? work.thumbnail} alt={work.title} className="w-full rounded-xl bg-white/5" />
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
      {playing ? (
        video.kind === 'file' ? (
          <video src={video.src} poster={poster} controls autoPlay playsInline className="size-full" />
        ) : (
          <iframe
            src={video.src}
            title={`${work.title} (${video.provider})`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        )
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0" aria-label={`Play ${work.title}`}>
          <img src={poster} alt="" className="size-full object-cover opacity-85 transition group-hover:opacity-100" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-16 place-items-center rounded-full bg-black/40 ring-1 ring-white/50 backdrop-blur-sm transition group-hover:scale-105 group-hover:ring-sun">
              <svg viewBox="0 0 24 24" className="ml-1 size-6 fill-white" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  )
}

/** Previous / next work in the same category. */
function Neighbours({ work }: { work: Work }) {
  const openWork = useUi((s) => s.openWork)
  const list = sortedWorks(work.category)
  if (list.length < 2) return null
  const i = list.findIndex((w) => w.id === work.id)
  const prev = list[(i - 1 + list.length) % list.length]
  const next = list[(i + 1) % list.length]
  return (
    <nav className="mt-10 flex justify-between gap-4 border-t border-white/10 pt-6 text-sm" aria-label="More projects">
      <button type="button" onClick={() => openWork(prev.id)} className="text-left text-white/60 transition hover:text-white">
        <span className="block text-[11px] tracking-[0.2em] text-white/35 uppercase">Previous</span>
        {prev.title}
      </button>
      <button type="button" onClick={() => openWork(next.id)} className="text-right text-white/60 transition hover:text-white">
        <span className="block text-[11px] tracking-[0.2em] text-white/35 uppercase">Next</span>
        {next.title}
      </button>
    </nav>
  )
}
