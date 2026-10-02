import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollStore } from './scrollStore'
import { activeIndex, locate, type Segment, type Timeline } from './timeline'
import { useUi } from '../state/uiStore'

gsap.registerPlugin(ScrollTrigger)

/** Only snap when released this close (in units) to a stop's pinned range. */
const SNAP_RANGE = 0.35
/** Wait this long after scrolling settles before snapping (ms). */
const SNAP_DELAY = 140

let lenis: Lenis | null = null

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Glide to a scroll position (in units). Used by snapping, keyboard and (later) nav. */
export function glideTo(u: number, duration?: number) {
  if (!lenis) return
  const d = duration ?? Math.min(2.6, 0.9 + Math.abs(u - scrollStore.u) * 0.35)
  scrollStore.gliding = true
  lenis.scrollTo(u * scrollStore.unit, {
    duration: d,
    easing: easeInOutCubic,
    onComplete: () => (scrollStore.gliding = false),
  })
}

/**
 * Sets up the scroll engine:
 *  - Lenis smooths wheel input (touch stays native so it feels natural on phones)
 *  - GSAP's ticker is the one clock: it drives Lenis, then ScrollTrigger, then the R3F frame
 *  - gentle snapping onto stops when the viewer lets go nearby
 *  - arrow keys / space / page keys step between stops
 */
export function useSmoothScroll(timeline: Timeline) {
  useEffect(() => {
    const root = document.documentElement
    const seg: Segment = { from: 0, to: 0, t: 0 }

    // One "unit" = one viewport height, frozen except on real resizes so the
    // mobile URL bar showing/hiding doesn't make the whole layout jump.
    const setUnit = () => {
      const h = window.innerHeight
      if (Math.abs(h - scrollStore.unit) > 120 || !root.style.getPropertyValue('--unit')) {
        scrollStore.unit = h
        root.style.setProperty('--unit', `${h}px`)
      }
    }
    setUnit()
    let lastWidth = window.innerWidth
    const onResize = () => {
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth
        scrollStore.unit = 0 // force update on width change
      }
      setUnit()
      ScrollTrigger.refresh()
    }
    window.addEventListener('resize', onResize)

    lenis = new Lenis({ autoRaf: false, lerp: 0.085, wheelMultiplier: 0.9 })
    const tick = (time: number) => lenis!.raf(time * 1000)
    gsap.ticker.add(tick, false, true) // prioritised: scroll updates before the scene renders
    gsap.ticker.lagSmoothing(0)

    let snapTimer = 0
    const snap = () => {
      if (scrollStore.gliding) return
      const u = scrollStore.u
      let best = Infinity
      let target = u
      for (const s of timeline.stops) {
        if (u >= s.arrive && u <= s.leave) return // parked: leave the reader alone
        const edge = u < s.arrive ? s.arrive : s.leave
        const d = Math.abs(u - edge)
        if (d < best) {
          best = d
          target = edge
        }
      }
      if (best > 0.005 && best < SNAP_RANGE) glideTo(target, 0.7 + best * 1.5)
    }

    lenis.on('scroll', (l: Lenis) => {
      scrollStore.u = l.scroll / scrollStore.unit
      ScrollTrigger.update()
      const i = activeIndex(locate(scrollStore.u, timeline, seg))
      if (i !== useUi.getState().active) useUi.getState().setActive(i)
      window.clearTimeout(snapTimer)
      snapTimer = window.setTimeout(snap, SNAP_DELAY)
    })

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return
      const forward = ['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey)
      const back = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey)
      if (!forward && !back) return
      e.preventDefault()
      // Next/previous arrival point, with a tolerance so a glide that settles a hair
      // short of a stop doesn't count as "still travelling" towards it.
      const EPS = 0.02
      const u = scrollStore.u
      const { stops } = timeline
      const target = forward
        ? stops.find((s) => s.arrive > u + EPS)
        : stops.findLast((s) => s.arrive < u - EPS)
      if (target) glideTo(target.arrive)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(snapTimer)
      gsap.ticker.remove(tick)
      lenis?.destroy()
      lenis = null
    }
  }, [timeline])
}
