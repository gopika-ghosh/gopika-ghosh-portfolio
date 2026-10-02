import { useEffect, useRef, useState } from 'react'
import { site } from '../content/site'
import { useUi } from '../state/uiStore'

/**
 * Designed loading screen. Progress is real (three's loading manager, reported by
 * scene/ProgressReporter) and never runs backwards; it only leaves once the scene is ready —
 * textures loaded and shaders compiled — so the reveal is always a finished frame.
 */
export function Loader() {
  // Reported by the 3D chunk (kept out of this file so three.js isn't in the main bundle).
  const progress = useUi((s) => s.progress)
  const ready = useUi((s) => s.ready)
  const [gone, setGone] = useState(false)
  const shown = useRef(0)

  // Monotonic: later loads (e.g. 4K upgrades) must never pull the number back.
  shown.current = ready ? 100 : Math.max(shown.current, Math.min(progress, 99))
  const pct = Math.round(shown.current)

  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(() => setGone(true), 1400)
    return () => window.clearTimeout(t)
  }, [ready])

  if (gone) return null

  return (
    <div
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-space transition-[opacity,filter] duration-[1200ms] ease-out ${
        ready ? 'pointer-events-none opacity-0 blur-sm' : 'opacity-100'
      }`}
    >
      {/* A tiny heliocentric system: the Sun and one orbiting body. */}
      <div className="relative size-28">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-0 motion-safe:animate-[spin_3.2s_linear_infinite]">
          <div className="absolute -top-[3px] left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white/80" />
        </div>
        <div
          className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle, #fff1cf 0%, #ffb35c 45%, #ff7a1a 100%)',
            boxShadow: '0 0 28px 6px rgb(255 160 70 / 0.55), 0 0 80px 20px rgb(255 120 40 / 0.18)',
          }}
        />
      </div>

      <p className="mt-12 text-xs tracking-[0.45em] text-white/60 uppercase">{site.name}</p>

      <div className="mt-6 h-px w-40 overflow-hidden bg-white/10">
        <div
          className="h-full origin-left bg-sun transition-transform duration-500 ease-out"
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
      <p className="mt-4 font-display text-2xl text-white/85 tabular-nums">{pct}</p>
      <p className="mt-1 text-[11px] tracking-[0.3em] text-white/35 uppercase">Aligning orbits</p>
    </div>
  )
}
