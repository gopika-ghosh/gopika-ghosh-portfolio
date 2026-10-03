import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { categoryLabel, sortedWorks, workById } from '../content'
import type { Work } from '../content/types'
import { cleanInstagramUrl, socialEmbed, type SocialEmbed } from '../lib/instagram'
import { embeds } from '../content/embeds'
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
  const posts = (embeds[work.id] ?? []).map(socialEmbed).filter((e): e is SocialEmbed => !!e)

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
          {posts.length > 0 ? <SocialFeed work={work} posts={posts} key={work.id} /> : <Hero work={work} key={work.id} />}
        </div>

        <div className="mt-7 space-y-4 text-[15px] leading-relaxed text-white/75">
          {work.description.split(/\n\s*\n/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <Links work={work} />

        {/* Gallery: the first image is the hero (unless there's a video or a social feed). */}
        <div className="mt-8 grid gap-3">
          {(posts.length > 0 ? [] : work.images.slice(work.video ? 0 : 1)).map((src, i) => (
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

/** Primary link (filled) plus Instagram profile and any extra links (outlined). */
function Links({ work }: { work: Work }) {
  const secondary = [
    ...(work.instagram?.profile ? [{ label: 'See more on Instagram', url: cleanInstagramUrl(work.instagram.profile) }] : []),
    ...(work.links ?? []),
  ]
  if (!work.externalLink && !secondary.length) return null
  return (
    <div className="mt-7 flex flex-wrap gap-3">
      {work.externalLink && (
        <a
          href={work.externalLink.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-sun px-5 py-2.5 text-sm font-medium text-[#1a0d02] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun"
        >
          {work.externalLink.label}
          <span aria-hidden="true">↗</span>
        </a>
      )}
      {secondary.map((l) => (
        <a
          key={l.url}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/85 transition hover:border-sun/60 hover:text-white"
        >
          {l.label}
          <span aria-hidden="true">↗</span>
        </a>
      ))}
    </div>
  )
}

/** How many preview tiles show before "Show all". */
const TILE_LIMIT = 9

/**
 * A project's posts and reels. One live embed at a time (the first loads straight away);
 * the rest are preview tiles — click one to load it into the player. Keeps the panel
 * fast even for a client with 30+ posts.
 */
function SocialFeed({ work, posts }: { work: Work; posts: SocialEmbed[] }) {
  const [current, setCurrent] = useState(0)
  const [all, setAll] = useState(false)
  const live = posts[current]
  const tiles = all ? posts : posts.slice(0, TILE_LIMIT)
  const counts = {
    posts: posts.filter((p) => p.kind === 'post').length,
    reels: posts.filter((p) => p.kind === 'reel').length,
    linkedin: posts.filter((p) => p.kind === 'linkedin').length,
  }
  const summary = [
    counts.posts && `${counts.posts} post${counts.posts > 1 ? 's' : ''}`,
    counts.reels && `${counts.reels} reel${counts.reels > 1 ? 's' : ''}`,
    counts.linkedin && `${counts.linkedin} LinkedIn post${counts.linkedin > 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <section aria-label={`${work.title}: posts and reels`}>
      <div className="overflow-hidden rounded-xl bg-white">
        <iframe
          key={live.src}
          src={live.src}
          title={`${work.title} — ${live.provider} ${live.kind === 'reel' ? 'reel' : 'post'} ${current + 1}`}
          allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
          className={`block w-full border-0 ${live.kind === 'linkedin' ? 'h-[560px]' : live.kind === 'reel' ? 'h-[720px]' : 'h-[640px]'}`}
        />
      </div>
      {posts.length > 1 && (
        <>
          <div className="mt-5 mb-3 flex items-baseline justify-between">
            <h3 className="text-[11px] tracking-[0.25em] text-white/45 uppercase">{summary}</h3>
            <span className="text-[11px] text-white/35">Tap to play</span>
          </div>
          <ul className="grid grid-cols-3 gap-2">
            {tiles.map((p, i) => (
              <li key={p.url}>
                <button
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-current={i === current}
                  aria-label={`Show ${p.provider} ${p.kind === 'reel' ? 'reel' : 'post'} ${i + 1}`}
                  className={`group relative grid aspect-square w-full place-items-center overflow-hidden rounded-lg border transition ${
                    i === current ? 'border-sun ring-2 ring-sun/40' : 'border-white/10 hover:border-sun/60'
                  } bg-gradient-to-br from-[#2a1a3a] via-[#3a1f2a] to-[#4a2a14]`}
                >
                  {/* Captured preview where we have one (npm run capture-posts), otherwise an icon. */}
                  {work.images[i] && p.provider === 'Instagram' ? (
                    <img src={work.images[i]} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition group-hover:scale-105" />
                  ) : null}
                  <span className="relative grid size-9 place-items-center rounded-full bg-black/45 ring-1 ring-white/40 backdrop-blur-sm">
                    {p.kind === 'reel' ? (
                      <svg viewBox="0 0 24 24" className="ml-0.5 size-4 fill-white" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : p.kind === 'linkedin' ? (
                      <span className="text-[11px] font-bold text-white">in</span>
                    ) : (
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="white" strokeWidth="1.8" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="5" />
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!all && posts.length > TILE_LIMIT && (
            <button type="button" onClick={() => setAll(true)} className="mt-3 text-xs tracking-[0.2em] text-sun/85 uppercase hover:text-sun">
              Show all {posts.length} →
            </button>
          )}
        </>
      )}
    </section>
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
