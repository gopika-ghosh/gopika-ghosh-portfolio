import { useEffect, useRef } from 'react'
import { scrollStore } from '../journey/scrollStore'
import type { Timeline } from '../journey/timeline'
import { useUi } from '../state/uiStore'

/** Development overlay, shown with ?debug in the URL. */
export function DebugHud({ timeline }: { timeline: Timeline }) {
  const active = useUi((s) => s.active)
  const uRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (uRef.current) uRef.current.textContent = scrollStore.u.toFixed(2)
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="fixed right-3 bottom-3 z-50 rounded bg-black/70 px-3 py-2 font-mono text-xs text-white/80">
      u <span ref={uRef} /> / {timeline.max.toFixed(2)} · stop {active} ({timeline.stops[active].chapter.station})
    </div>
  )
}
