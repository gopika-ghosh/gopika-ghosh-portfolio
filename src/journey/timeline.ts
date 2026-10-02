import type { Chapter } from '../content/types'

/**
 * Turns the chapter list into scroll ranges.
 *
 * All values are in "units" = one viewport height of scrolling.
 * For each stop:
 *   start ──travel──▶ arrive ══dwell══ leave ──▶ (next stop's travel)
 *
 * The DOM mirrors this exactly: each chapter <section> is `travel + dwell` units
 * tall and its content is sticky for the dwell part, so the text pins in place
 * precisely while the camera is parked at the stop.
 */

export const DEFAULT_TRAVEL = 1
export const DEFAULT_DWELL = 1.4

export interface Stop {
  index: number
  chapter: Chapter
  /** Section top. */
  start: number
  travel: number
  dwell: number
  /** Scroll position where the camera arrives and the text pins. */
  arrive: number
  /** Scroll position where the camera leaves and the text unpins. */
  leave: number
}

export interface Timeline {
  stops: Stop[]
  /** Total document height in units. */
  total: number
  /** Maximum scroll position in units (total − one viewport). */
  max: number
}

export function buildTimeline(chapters: Chapter[]): Timeline {
  let cursor = 0
  const stops = chapters.map((chapter, index) => {
    // The first stop is where we start, so there's nothing to travel from.
    const travel = index === 0 ? 0 : (chapter.travel ?? DEFAULT_TRAVEL)
    const dwell = Math.max(1, chapter.dwell ?? DEFAULT_DWELL)
    const start = cursor
    const arrive = start + travel
    // The sticky content (one viewport tall) stays pinned for dwell − 1 units.
    const leave = arrive + dwell - 1
    cursor = start + travel + dwell
    return { index, chapter, start, travel, dwell, arrive, leave }
  })
  return { stops, total: cursor, max: cursor - 1 }
}

export interface Segment {
  from: number
  to: number
  /** Linear 0→1 progress of the flight from `from` to `to` (0 while parked). */
  t: number
}

/** Where along the journey a scroll position falls. Allocation-free. */
export function locate(u: number, tl: Timeline, out: Segment): Segment {
  const { stops } = tl
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i]
    if (u <= s.leave) {
      if (u >= s.arrive || i === 0) {
        out.from = out.to = i
        out.t = 0
      } else {
        const prev = stops[i - 1]
        out.from = i - 1
        out.to = i
        out.t = (u - prev.leave) / (s.arrive - prev.leave)
      }
      return out
    }
  }
  out.from = out.to = stops.length - 1
  out.t = 0
  return out
}

/** The stop the viewer is "at" for nav/UI purposes. */
export function activeIndex(seg: Segment) {
  return seg.t < 0.5 ? seg.from : seg.to
}
