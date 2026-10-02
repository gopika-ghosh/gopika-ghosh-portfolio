import type { Award, Testimonial } from './types'

/**
 * Kind words and recognition, shown at Neptune.
 * Placeholder content (people and quotes are fictional) — replace with your own.
 */
export const testimonials: Testimonial[] = [
  {
    quote:
      'Gopika has a rare ability to hold the big picture and the last pixel at the same time. Our product feels calmer because of her.',
    name: 'Priya Raman',
    title: 'Head of Product, Lumen',
  },
  {
    quote: 'She edited forty hours of footage into eighteen minutes that made a festival audience cry. Twice.',
    name: 'Tomás Ferreira',
    title: 'Director, Northbound',
  },
  {
    quote: 'The identity she built for us is the reason people photograph our menus.',
    name: 'Anjali Menon',
    title: 'Founder, Saffron & Salt',
  },
]

// Fictional placeholders — replace with real recognition (or empty the list to hide it).
export const awards: Award[] = [
  { title: 'Site of the Day', by: 'Placeholder Web Awards', year: 2025 },
  { title: 'Official Selection — Northbound', by: 'Example Documentary Festival', year: 2024 },
  { title: 'Gold, Identity', by: 'Sample Design Annual', year: 2024 },
]
