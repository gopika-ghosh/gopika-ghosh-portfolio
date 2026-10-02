import type { Award, Testimonial } from './types'

/**
 * Kind words and recognition, shown at Neptune. Empty lists simply aren't shown.
 *
 * Add a testimonial:
 *   { quote: 'What they said…', name: 'Their name', title: 'Role, Company' },
 *
 * Add an award:
 *   { title: 'Gold, Identity', by: 'Awarding body', year: 2025 },
 */
export const testimonials: Testimonial[] = []

export const awards: Award[] = []
