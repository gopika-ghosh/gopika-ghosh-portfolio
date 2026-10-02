import { useEffect, useRef, useState } from 'react'
import { categoryLabel, sortedWorks } from '../content'
import type { WorkCategory } from '../content/types'
import { useUi } from '../state/uiStore'
import { useDialog } from './useDialog'

/**
 * Every work in a category as a grid — opened from a planet's "+N" moon or the
 * chapter's "View all" link when there are more works than moons.
 */
export function ViewAllGrid() {
  const category = useUi((s) => s.viewAll)
  const close = useUi((s) => s.closeViewAll)
  const openWork = useUi((s) => s.openWork)

  const [shown, setShown] = useState<WorkCategory | null>(category)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (category) {
      setShown(category)
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    setVisible(false)
    const t = window.setTimeout(() => setShown(null), 400)
    return () => window.clearTimeout(t)
  }, [category])

  const ref = useRef<HTMLDivElement>(null)
  useDialog(!!category && shown === category, close, ref)

  if (!shown) return null
  const list = sortedWorks(shown)

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="grid-title"
      tabIndex={-1}
      data-lenis-prevent
      className={`fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-[#05060a]/80 backdrop-blur-xl transition-opacity duration-400 outline-none ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-12 md:py-16">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.3em] text-sun/80 uppercase">{list.length} projects</p>
            <h2 id="grid-title" className="mt-2 font-display text-4xl md:text-6xl">
              {categoryLabel[shown]}
            </h2>
          </div>
          <button
            type="button"
            data-autofocus
            onClick={close}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-white/15 text-white/80 transition hover:border-sun/60 hover:text-white"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((w, i) => (
            <li
              key={w.id}
              className={`transition duration-500 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <button
                type="button"
                onClick={() => openWork(w.id)}
                className="group block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition hover:border-sun/50"
              >
                <img src={w.thumbnail} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                <span className="block p-5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-2xl leading-tight">{w.title}</span>
                    <span className="text-xs text-white/40">{w.year}</span>
                  </span>
                  <span className="mt-2 block text-sm text-white/60">{w.summary}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
