import { useState } from 'react'
import type { Award, Testimonial } from '../content/types'

/** One quote at a time with previous/next controls, followed by awards. */
export function Testimonials({ testimonials, awards }: { testimonials: Testimonial[]; awards: Award[] }) {
  const [i, setI] = useState(0)
  if (!testimonials.length && !awards.length) return null
  const t = testimonials[i]
  const step = (d: number) => setI((n) => (n + d + testimonials.length) % testimonials.length)

  return (
    <div>
      {t && (
        <figure aria-roledescription="carousel" aria-label="Testimonials">
          <blockquote key={i} className="animate-[fade-in_0.5s_ease-out] font-display text-2xl leading-snug text-white/90 md:text-3xl">
            “{t.quote}”
          </blockquote>
          <figcaption className="mt-4 text-sm text-white/60">
            <span className="text-white/85">{t.name}</span> · {t.title}
          </figcaption>
          {testimonials.length > 1 && (
            <div className="mt-5 flex items-center gap-4">
              <ArrowButton label="Previous testimonial" onClick={() => step(-1)} flip />
              <span className="text-xs text-white/45 tabular-nums" aria-live="polite">
                {i + 1} / {testimonials.length}
              </span>
              <ArrowButton label="Next testimonial" onClick={() => step(1)} />
            </div>
          )}
        </figure>
      )}

      {awards.length > 0 && (
        <div className="mt-7 border-t border-white/10 pt-5">
          <h3 className="mb-3 text-[11px] tracking-[0.25em] text-white/45 uppercase">Recognition</h3>
          <ul className="space-y-1.5 text-sm">
            {awards.map((a) => (
              <li key={`${a.title}-${a.year}`} className="flex justify-between gap-4">
                <span className="text-white/80">
                  {a.title} <span className="text-white/45">— {a.by}</span>
                </span>
                <span className="shrink-0 text-white/40 tabular-nums">{a.year}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ArrowButton({ label, onClick, flip }: { label: string; onClick: () => void; flip?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-9 place-items-center rounded-full border border-white/15 text-white/75 transition hover:border-sun/60 hover:text-white"
    >
      <svg viewBox="0 0 24 24" className={`size-4 ${flip ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  )
}
