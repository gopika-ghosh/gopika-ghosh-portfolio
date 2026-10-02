/**
 * Shared content types. You normally don't need to edit this file —
 * it exists so your editor can autocomplete and catch typos in the
 * other content files.
 */

/**
 * Places the camera can stop at. Each one is defined in
 * `src/config/stations.ts` (camera framing) and, for real bodies,
 * `src/config/bodies.ts` (size, orbit, look).
 *
 * - `system` — the wide establishing shot of the whole solar system
 * - `beyond` — far past Neptune, looking back at the tiny system
 */
export type StationId =
  | 'system'
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'asteroids'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'beyond'

/** What kind of content a chapter shows. Decides which overlay layout is used. */
export type ChapterKind =
  | 'intro' // name + title, "scroll to explore"
  | 'about' // photo, bio, philosophy
  | 'disciplines' // one line per discipline
  | 'works' // moons = works of one category
  | 'skills'
  | 'timeline'
  | 'testimonials'
  | 'contact'

/** Work categories. A `works` chapter shows every work whose category matches. */
export type WorkCategory = 'uiux' | 'graphic' | 'video'

export interface Chapter {
  /** Unique, URL-safe id. Also used as the section's HTML anchor (#id). */
  id: string
  /** Where the camera goes for this chapter. */
  station: StationId
  kind: ChapterKind
  /** Short label for the navigation. */
  navLabel: string
  /** Main heading shown on screen (and used as the section's <h2>). */
  heading: string
  /** One or two sentences under the heading. */
  intro: string
  /** For `works` chapters: which category of works orbits this planet. */
  category?: WorkCategory
  /**
   * Optional pacing, in screen-heights of scrolling.
   * `travel` = scroll spent flying here from the previous stop.
   * `dwell`  = scroll spent parked here while the text is read (min 1).
   */
  travel?: number
  dwell?: number
}
