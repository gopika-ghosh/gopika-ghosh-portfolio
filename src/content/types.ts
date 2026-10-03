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
   * For `works` chapters: at most this many moons orbit the planet (default 8).
   * Beyond that, a "+N" moon opens a grid of every work in the category.
   */
  maxVisibleWorks?: number
  /**
   * Optional pacing, in screen-heights of scrolling.
   * `travel` = scroll spent flying here from the previous stop.
   * `dwell`  = scroll spent parked here while the text is read (min 1).
   */
  travel?: number
  dwell?: number
}

/**
 * A video: paste a YouTube or Vimeo link, or the path of an .mp4 in /public.
 * Videos only load when the viewer presses play.
 */
export interface VideoSource {
  url: string
  /** Still image shown before playing (path in /public). Defaults to the work's thumbnail. */
  poster?: string
}

/** One piece of work. Each work becomes a moon orbiting its category's planet. */
export interface Work {
  /** Unique, URL-safe id (also used for the image folder name). */
  id: string
  title: string
  category: WorkCategory
  /** Your role, e.g. "Lead product designer". */
  role: string
  year: number
  /** One line, shown in lists and on the moon label. */
  summary: string
  /** Full description for the project panel. Separate paragraphs with a blank line. */
  description: string
  /** Square-ish image for the moon label and grids (path in /public). */
  thumbnail: string
  /** Gallery images for the project panel (paths in /public). */
  images: string[]
  video?: VideoSource
  externalLink?: { label: string; url: string }
  /**
   * The client's Instagram profile (shown as "See more on Instagram"). The posts and reels
   * shown in the panel come from src/content/embeds.ts (generated from works.xlsx).
   */
  instagram?: { profile?: string }
  /** Extra links shown in the project panel, e.g. a LinkedIn page. */
  links?: { label: string; url: string }[]
  /** Featured works get slightly larger moons and are listed first. */
  featured?: boolean
  /** Optional short tags, e.g. ["Fintech", "iOS"]. */
  tags?: string[]
  /**
   * Tools used, matching names in skills.ts (e.g. 'Figma'). In the asteroid belt,
   * hovering a tool draws lines to every project that lists it.
   */
  tools?: string[]
}

export interface Role {
  company: string
  /** Optional short name for the marker on the rings (defaults to `company`). */
  short?: string
  title: string
  /** e.g. "2021" */
  start: string
  /** e.g. "2024" or "Present" */
  end: string
  location?: string
  /** One line; optional (education entries often don't need one). */
  summary?: string
}

export interface SkillGroup {
  name: string
  items: string[]
}

export interface Testimonial {
  quote: string
  name: string
  /** e.g. "Head of Product, Lumen" */
  title: string
}

export interface Award {
  title: string
  /** Who gave it, e.g. "Awwwards" */
  by: string
  year: number
}
