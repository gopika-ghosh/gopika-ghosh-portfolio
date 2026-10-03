import { useEffect, useState } from 'react'
import { useUi } from '../state/uiStore'

/**
 * Stardust counter: one star per stop, collected by the rocket when you arrive somewhere
 * new. Pops when it ticks up; a little message celebrates the full set.
 */
export function Stardust({ total }: { total: number }) {
  const count = useUi((s) => s.visited.length)
  const celebrated = useUi((s) => s.celebrated)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    if (!celebrated) return
    setToast(true)
    const t = window.setTimeout(() => setToast(false), 5200)
    return () => window.clearTimeout(t)
  }, [celebrated])

  const done = count >= total
  return (
    <>
      <div
        role="status"
        aria-label={`Stardust: ${count} of ${total} stops explored`}
        title="Stardust: visit every stop to collect them all"
        className={`flex h-10 items-center gap-1.5 rounded-full border px-3.5 font-display text-sm tabular-nums backdrop-blur-md transition-colors ${
          done ? 'border-sun/70 bg-sun/15 text-sun' : 'border-white/15 bg-black/30 text-white/85'
        }`}
      >
        {/* Keyed by count so the star pops each time one is collected. */}
        <span key={count} className="stardust-pop text-sun" aria-hidden="true">
          ✦
        </span>
        <span>
          {count}
          <span className="text-white/45"> / {total}</span>
        </span>
      </div>

      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-6 transition-all duration-500 md:top-24 ${
          toast ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
        }`}
      >
        {toast && (
          <p className="rounded-full border border-sun/50 bg-[#120c2b]/90 px-5 py-2.5 text-center font-display text-base text-white shadow-[0_8px_30px_-6px_rgb(255_179_92/0.45)] backdrop-blur-md">
            <span className="text-sun">✦</span> You've explored Gopika's whole universe! <span className="text-sun">✦</span>
          </p>
        )}
      </div>
    </>
  )
}
