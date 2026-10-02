import { useEffect, useRef, useState } from 'react'
import { site } from '../content/site'
import { scrollStore } from '../journey/scrollStore'
import { locate, type Segment, type Timeline } from '../journey/timeline'
import { glideTo } from '../journey/useSmoothScroll'
import { isModalOpen, useUi } from '../state/uiStore'
import { SoundToggle } from './SoundToggle'
import { useDialog } from './useDialog'

const seg: Segment = { from: 0, to: 0, t: 0 }

/**
 * Fixed navigation:
 *  - desktop: a vertical progress rail on the right (one dot per stop, fill tracks the
 *    exact journey position, names appear on hover), home mark top-left, sound top-right
 *  - phones: a top bar with the current chapter; tapping it opens a full-screen list
 * Every entry glides the camera there.
 */
export function Nav({ timeline }: { timeline: Timeline }) {
  const active = useUi((s) => s.active)
  const ready = useUi((s) => s.ready)
  const modal = useUi(isModalOpen)
  const [menu, setMenu] = useState(false)
  const fill = useRef<HTMLDivElement>(null)
  const n = timeline.stops.length

  // Rail fill follows the scroll every frame, outside React.
  useEffect(() => {
    let raf = 0
    const loop = () => {
      locate(scrollStore.u, timeline, seg)
      const pos = (seg.from + (seg.to - seg.from) * seg.t) / Math.max(1, n - 1)
      if (fill.current) fill.current.style.transform = `scaleY(${pos.toFixed(4)})`
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [timeline, n])

  const go = (i: number) => {
    setMenu(false)
    glideTo(timeline.stops[i].arrive)
  }

  const hidden = !ready || modal
  const fade = `transition-opacity duration-700 ${hidden ? 'pointer-events-none opacity-0' : 'opacity-100'}`

  return (
    <>
      {/* Home mark */}
      <button
        type="button"
        onClick={() => go(0)}
        className={`fixed top-5 left-6 z-30 font-display text-xl tracking-wide text-white/85 transition-colors hover:text-white md:top-7 md:left-10 ${fade}`}
        aria-label={`${site.name} — back to the start`}
      >
        {site.name}
        <span className="text-sun">.</span>
      </button>

      {/* Top-right controls: sound everywhere, chapter menu on phones */}
      <div className={`fixed top-4 right-4 z-30 flex items-center gap-2 md:top-6 md:right-8 ${fade}`}>
        <SoundToggle />
        <button
          type="button"
          onClick={() => setMenu(true)}
          className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 text-xs tracking-[0.2em] text-white/80 uppercase backdrop-blur-md md:hidden"
          aria-haspopup="dialog"
          aria-expanded={menu}
        >
          <span className="tabular-nums text-sun/80">{String(active).padStart(2, '0')}</span>
          {timeline.stops[active]?.chapter.navLabel}
        </button>
      </div>

      {/* Desktop progress rail */}
      <nav aria-label="Journey" className={`fixed top-1/2 right-7 z-30 hidden -translate-y-1/2 md:block ${fade}`}>
        <div className="relative">
          <div className="absolute top-2 bottom-2 left-1/2 w-px -translate-x-1/2 bg-white/12" aria-hidden="true">
            <div ref={fill} className="h-full w-full origin-top bg-gradient-to-b from-sun/40 to-sun" />
          </div>
          <ol className="relative flex flex-col gap-5">
            {timeline.stops.map((s, i) => {
              const isActive = i === active
              return (
                <li key={s.chapter.id} className="group relative flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={`${s.chapter.navLabel}: ${s.chapter.heading}`}
                    className="relative grid size-4 place-items-center rounded-full outline-offset-4"
                  >
                    <span
                      className={`block rounded-full transition-all duration-500 ${
                        isActive
                          ? 'size-2.5 bg-sun shadow-[0_0_12px_2px_rgb(255_179_92/0.7)]'
                          : 'size-1.5 bg-white/45 group-hover:size-2 group-hover:bg-white'
                      }`}
                    />
                  </button>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute right-7 text-[11px] tracking-[0.25em] whitespace-nowrap uppercase transition-all duration-300 ${
                      isActive
                        ? 'translate-x-0 text-sun/85 opacity-100'
                        : 'translate-x-1 text-white/70 opacity-0 group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100'
                    }`}
                  >
                    {s.chapter.navLabel}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      </nav>

      <MobileMenu open={menu} onClose={() => setMenu(false)} timeline={timeline} active={active} go={go} />
    </>
  )
}

function MobileMenu({
  open,
  onClose,
  timeline,
  active,
  go,
}: {
  open: boolean
  onClose: () => void
  timeline: Timeline
  active: number
  go: (i: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDialog(open, onClose, ref)
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Chapters"
      tabIndex={-1}
      data-lenis-prevent
      className={`fixed inset-0 z-50 flex flex-col bg-[#05060a]/92 px-6 pt-5 pb-8 backdrop-blur-xl transition-opacity duration-300 outline-none md:hidden ${
        open ? 'opacity-100' : 'pointer-events-none invisible opacity-0'
      }`}
    >
      <div className="flex justify-end">
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          className="grid size-10 place-items-center rounded-full border border-white/15 text-white/80"
          aria-label="Close menu"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <ol className="mt-6 flex flex-1 flex-col justify-center gap-1 overflow-y-auto">
        {timeline.stops.map((s, i) => (
          <li key={s.chapter.id}>
            <button
              type="button"
              onClick={() => go(i)}
              aria-current={i === active ? 'step' : undefined}
              className="flex w-full items-baseline gap-4 py-2 text-left"
            >
              <span className={`w-6 text-xs tabular-nums ${i === active ? 'text-sun' : 'text-white/35'}`}>
                {String(i).padStart(2, '0')}
              </span>
              <span className={`font-display text-3xl ${i === active ? 'text-white' : 'text-white/65'}`}>
                {s.chapter.navLabel}
              </span>
              <span className="truncate text-xs text-white/35">{s.chapter.heading}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
