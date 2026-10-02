/**
 * Derived lookups over the content files. Nothing to edit here.
 */
import type { WorkCategory } from './types'
import { works } from './works'

export const workById = new Map(works.map((w) => [w.id, w]))

export const worksIn = (category: WorkCategory) => works.filter((w) => w.category === category)

/** Featured first, then content order (matches the moon layout). */
export const sortedWorks = (category: WorkCategory) =>
  [...worksIn(category)].sort((a, b) => Number(!!b.featured) - Number(!!a.featured))

export const DEFAULT_MAX_VISIBLE_WORKS = 8

export const categoryLabel: Record<WorkCategory, string> = {
  uiux: 'UI/UX Design',
  graphic: 'Graphic Design',
  video: 'Video Editing',
}

import { chapters } from './chapters'
import { awards, testimonials } from './testimonials'

/**
 * The chapters actually shown. A testimonials stop with nothing to show is skipped
 * (the camera flies past Neptune) and returns as soon as a quote or award is added.
 */
export const journeyChapters = chapters.filter(
  (c) => c.kind !== 'testimonials' || testimonials.length > 0 || awards.length > 0,
)
