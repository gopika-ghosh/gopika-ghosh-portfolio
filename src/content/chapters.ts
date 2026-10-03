import type { Chapter } from './types'

/**
 * The journey, in scroll order. Each entry is one stop.
 *
 * - Reorder entries to reorder the journey.
 * - Change `station` to send the camera somewhere else (see StationId in types.ts).
 * - `travel` / `dwell` tune pacing in screen-heights (defaults: 1 and 1.4).
 * - `works` chapters show every work in `category` as moons (see works.ts).
 */
export const chapters: Chapter[] = [
  {
    id: 'home',
    station: 'system',
    kind: 'intro',
    navLabel: 'Home',
    heading: 'Gopika',
    intro: 'UI/UX Designer · Graphic Designer · Video Editor',
    dwell: 1.2,
  },
  {
    id: 'about',
    station: 'sun',
    kind: 'about',
    navLabel: 'The Sun',
    heading: 'At the centre of it all',
    intro:
      'Every project starts here — with curiosity, empathy and an obsession with getting the details right.',
    travel: 1.4,
  },
  {
    id: 'what-i-do',
    station: 'mercury',
    kind: 'disciplines',
    navLabel: 'Mercury',
    heading: 'What I do',
    intro: 'Three disciplines, one way of thinking.',
  },
  {
    id: 'ui-ux',
    station: 'earth',
    kind: 'works',
    category: 'uiux',
    dwell: 1.6,
    navLabel: 'Earth',
    heading: 'UI/UX Design',
    intro: 'Human-centred products, from first sketch to shipped interface.',
    travel: 1.2,
  },
  {
    id: 'graphic',
    station: 'mars',
    kind: 'works',
    category: 'graphic',
    maxVisibleWorks: 4, // featured ones as moons; the rest under "More work"
    dwell: 1.6,
    navLabel: 'Mars',
    heading: 'Graphic Design',
    intro: 'Brand identities, social creatives and marketing design for growing businesses.',
  },
  {
    id: 'skills',
    station: 'asteroids',
    kind: 'skills',
    navLabel: 'Asteroid Belt',
    heading: 'Skills & Tools',
    intro: 'The instruments I reach for every day.',
  },
  {
    id: 'video',
    station: 'jupiter',
    kind: 'works',
    category: 'video',
    maxVisibleWorks: 4, // featured ones as moons; the rest under "More work"
    dwell: 1.6,
    navLabel: 'Jupiter',
    heading: 'Video Editing',
    intro: 'Reels and short-form video for the brands I work with.',
    travel: 1.2,
  },
  {
    id: 'experience',
    station: 'saturn',
    kind: 'timeline',
    navLabel: 'Saturn',
    heading: 'Experience',
    intro: 'Where I have worked and learned.',
    travel: 1.2,
  },
  {
    id: 'kind-words',
    station: 'neptune',
    kind: 'testimonials',
    navLabel: 'Neptune',
    heading: 'Kind Words',
    intro: 'Clients, collaborators and recognition along the way.',
    travel: 1.5,
  },
  {
    id: 'contact',
    station: 'beyond',
    kind: 'contact',
    navLabel: 'Contact',
    heading: "Let's make something",
    intro: 'From out here, it all looks small. Let’s build something that matters.',
    travel: 1.8,
    dwell: 1.2,
  },
]
