import { useEffect } from 'react'
import { scrollStore } from '../journey/scrollStore'
import type { Timeline } from '../journey/timeline'
import { useUi } from '../state/uiStore'
import { cueHover, cueOpen, isSoundOn, setDepth } from './ambient'

/** Connects journey and UI events to the ambient sound (all no-ops while sound is off). */
export function useAudioCues(timeline: Timeline) {
  useEffect(() => {
    const unsub = useUi.subscribe((s, prev) => {
      if (s.hovered && s.hovered !== prev.hovered) cueHover()
      if (s.openWorkId && s.openWorkId !== prev.openWorkId) cueOpen()
    })
    // Depth follows the journey a few times a second — plenty for a slow pad.
    const timer = window.setInterval(() => {
      if (isSoundOn()) setDepth(Math.min(1, Math.max(0, scrollStore.u / timeline.max)))
    }, 250)
    return () => {
      unsub()
      window.clearInterval(timer)
    }
  }, [timeline])
}
