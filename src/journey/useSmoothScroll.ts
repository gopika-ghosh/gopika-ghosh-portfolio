import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollStore } from './scrollStore'
import { activeIndex, locate, type Segment, type Timeline } from './timeline'
import { isModalOpen, useUi } from '../state/uiStore'
import { reducedMotion } from '../lib/env'

gsap.registerPlugin(ScrollTrigger)

/** Only snap when released this close (in units) to a stop's pinned range. */
const SNAP_RANGE = 0.35
/** Wait this long after scrolling settles before snapping (ms). */
const SNAP_DELAY = 140

let lenis: Lenis | null = null
/** First run only: start at the top and honour a #chapter link. (The timeline can be
 *  rebuilt later, e.g. when phone content is measured, and that mustn't move the reader.) */
let started = false
let jumped = false

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Glide to a scroll position (in units). Used by snapping, keyboard and (later) nav. */
export function glideTo(u: number, duration?: number) {
  if (!lenis) return
  // Reduced motion: jump instead of glide (the camera fades rather than flies).
  if (reducedMotion) {
    lenis.scrollTo(u * scrollStore.unit, { immediate: true, force: true })
    return
  }
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

    // Start at the beginning (or at a #chapter deep link), and hold scrolling until the scene is ready.
    const first = !started
    started = true
    if (first) {
      history.scrollRestoration = 'manual'
      window.scrollTo(0, 0)
    }
    const linked = timeline.stops.find((s) => `#${s.chapter.id}` === window.location.hash && s.index > 0)
    // Reduced motion: native wheel scrolling, no inertia.
    lenis = new Lenis({ autoRaf: false, lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: !reducedMotion })
    // Scrolling runs only once the scene is ready, and pauses while a project panel or grid is open.
    const syncLock = () => {
      const s = useUi.getState()
      if (s.ready && !isModalOpen(s)) lenis?.start()
      else lenis?.stop()
    }
    syncLock()
    const unsubLock = useUi.subscribe((s) => {
      syncLock()
      // Deep link: once the scene is ready, appear at the linked stop without a long flight.
      if (s.ready && linked && !jumped) {
        jumped = true
        lenis?.scrollTo(linked.arrive * scrollStore.unit, { immediate: true, force: true })
        // An immediate jump doesn't reliably emit Lenis's scroll event; sync from the real position.
        sync(window.scrollY)
      }
    })
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

    /** Push a scroll position (px) into the journey: camera input, active chapter, address. */
    const sync = (y: number) => {
      scrollStore.u = y / scrollStore.unit
      ScrollTrigger.update()
      const i = activeIndex(locate(scrollStore.u, timeline, seg))
      if (i !== useUi.getState().active) {
        useUi.getState().setActive(i)
        // Keep the address shareable without adding history entries.
        const id = timeline.stops[i].chapter.id
        history.replaceState(null, '', i === 0 ? window.location.pathname + window.location.search : `#${id}`)
      }
    }

    lenis.on('scroll', (l: Lenis) => {
      sync(l.scroll)
      window.clearTimeout(snapTimer)
      snapTimer = window.setTimeout(snap, SNAP_DELAY)
    })

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return
      // Space on a focused button or link should press it, not move the journey.
      if (e.key === ' ' && e.target instanceof Element && e.target.closest('button, a, [role="button"]')) return
      const forward = ['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey)
      const back = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey)
      if (!forward && !back) return
      // Leave keys alone inside panels/grids (scrolling text, pressing buttons).
      const ui = useUi.getState()
      if (isModalOpen(ui)) return
      e.preventDefault()
      if (!ui.ready) return
      // Next/previous arrival point, with a tolerance so a glide that settles a hair
      // short of a stop doesn't count as "still travelling" towards it.
      const EPS = 0.02
      const u = scrollStore.u
      const { stops } = timeline
      const target = forward ? stops.find((s) => s.arrive > u + EPS) : stops.findLast((s) => s.arrive < u - EPS)
      if (target) glideTo(target.arrive)
    }
    window.addEventListener('keydown', onKey)

    // In-page hash changes (#links, editing the address) would make the browser jump to
    // the section's top edge, which is mid-flight. Glide to the stop itself instead.
    const onHash = () => {
      const stop = timeline.stops.find((s) => `#${s.chapter.id}` === window.location.hash)
      if (stop && useUi.getState().ready) glideTo(stop.arrive)
    }
    window.addEventListener('hashchange', onHash)

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', onHash)
      window.clearTimeout(snapTimer)
      unsubLock()
      gsap.ticker.remove(tick)
      lenis?.destroy()
      lenis = null
    }
  }, [timeline])
}
