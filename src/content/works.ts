import type { Work } from './types'

/**
 * Every project. Each one becomes a moon orbiting its category's planet:
 *   uiux → Earth · graphic → Mars · video → Jupiter  (set in chapters.ts)
 *
 * Add an entry → a moon appears. Remove one → it's gone. Orbits rebalance
 * automatically for any count. Images live in /public/images/works/<id>/.
 * See CONTENT_GUIDE.md for details.
 *
 * Everything below is placeholder content — replace it with your own.
 */

/** Shorthand for the standard image set of a work. */
const img = (id: string, gallery = 3) => ({
  thumbnail: `/images/works/${id}/thumb.webp`,
  images: Array.from({ length: gallery }, (_, i) => `/images/works/${id}/${String(i + 1).padStart(2, '0')}.webp`),
})

export const works: Work[] = [
  // ── UI/UX ──────────────────────────────────────────────────────────────
  {
    id: 'orbit-design-system',
    title: 'Orbit Design System',
    category: 'uiux',
    role: 'Design systems lead',
    year: 2025,
    summary: 'A multi-brand design system serving 14 product teams.',
    description:
      'Orbit unified four product lines that had drifted apart over years of fast growth. I led a small team auditing 1,200+ components down to a core of 64, with tokens that let each brand keep its own voice.\n\nAdoption was the real project: office hours, migration tooling and a documentation site that designers and engineers actually enjoy using. Twelve months in, 90% of new UI ships with Orbit components.',
    ...img('orbit-design-system'),
    externalLink: { label: 'View case study', url: 'https://example.com/orbit' },
    featured: true,
    tags: ['Design systems', 'Tokens', 'Documentation'],
  },
  {
    id: 'lumen-banking',
    title: 'Lumen — Banking for Freelancers',
    category: 'uiux',
    role: 'Senior product designer',
    year: 2024,
    summary: 'Invoicing, tax pots and payments in one calm mobile app.',
    description:
      'Freelancers told us money felt chaotic: income arrives irregularly and tax is a constant worry. Lumen sets aside tax automatically and shows a single, honest number — what you can actually spend.\n\nI ran discovery interviews, prototyped the "safe to spend" model and shipped the iOS and Android apps with a team of six.',
    ...img('lumen-banking'),
    tags: ['Fintech', 'Mobile', 'Research'],
  },
  {
    id: 'atlas-health',
    title: 'Atlas Health Patient Portal',
    category: 'uiux',
    role: 'UX lead',
    year: 2023,
    summary: 'An accessible patient portal used by 400k people a month.',
    description:
      'Atlas replaced three legacy portals with one. Accessibility shaped every decision: WCAG 2.2 AA throughout, plain-language content and flows tested with screen-reader users and older patients.\n\nAppointment booking time dropped from 6 minutes to under 90 seconds.',
    ...img('atlas-health'),
    tags: ['Healthcare', 'Accessibility', 'Web'],
  },
  {
    id: 'wayfare',
    title: 'Wayfare Travel Planner',
    category: 'uiux',
    role: 'Product designer',
    year: 2022,
    summary: 'Collaborative trip planning for groups who never agree.',
    description:
      'Wayfare turns group chat chaos into a shared itinerary. Friends drop ideas onto a map, vote, and the plan assembles itself.\n\nI designed the core planning canvas and the voting interaction, iterating through five rounds of usability testing.',
    ...img('wayfare', 2),
    tags: ['Consumer', 'Collaboration'],
  },
  {
    id: 'kindred',
    title: 'Kindred Community App',
    category: 'uiux',
    role: 'Product designer',
    year: 2021,
    summary: 'Helping neighbours share tools, skills and time.',
    description:
      'A non-profit app for neighbourhood lending libraries. The challenge was trust between strangers: profiles, gentle reputation and clear expectations for every exchange.',
    ...img('kindred', 2),
    tags: ['Non-profit', 'Mobile'],
  },

  // ── Graphic design ─────────────────────────────────────────────────────
  {
    id: 'saffron-salt',
    title: 'Saffron & Salt',
    category: 'graphic',
    role: 'Brand designer',
    year: 2025,
    summary: 'Identity for a modern Keralan restaurant.',
    description:
      'A visual identity rooted in coastal Kerala: a hand-cut wordmark, a palette drawn from spice markets and a pattern system built from fishing-net geometry.\n\nApplied across signage, menus, packaging and a bold set of illustrated wall murals.',
    ...img('saffron-salt'),
    featured: true,
    tags: ['Identity', 'Hospitality'],
  },
  {
    id: 'monsoon-festival',
    title: 'Monsoon Arts Festival',
    category: 'graphic',
    role: 'Art director',
    year: 2024,
    summary: 'Campaign and wayfinding for a 10-day arts festival.',
    description:
      'A campaign built around the first rain: posters that change as they weather, a variable typeface that "drips" and wayfinding across twelve city venues.',
    ...img('monsoon-festival'),
    tags: ['Campaign', 'Typography', 'Wayfinding'],
  },
  {
    id: 'paper-planets',
    title: 'Paper Planets',
    category: 'graphic',
    role: 'Editorial designer',
    year: 2023,
    summary: 'A science magazine series on the solar system.',
    description:
      'Eight issues, one per planet. Each cover was built from cut paper and photographed in studio; inside, data-led spreads make orbital mechanics feel tactile.',
    ...img('paper-planets', 2),
    tags: ['Editorial', 'Illustration'],
  },
  {
    id: 'ferrow-coffee',
    title: 'Ferrow Coffee Packaging',
    category: 'graphic',
    role: 'Packaging designer',
    year: 2022,
    summary: 'Single-origin packaging that maps each farm.',
    description:
      'Every bag carries a contour map of the farm its beans came from, printed in two inks on recycled kraft.',
    ...img('ferrow-coffee', 2),
    tags: ['Packaging', 'Print'],
  },

  // ── Video editing ──────────────────────────────────────────────────────
  {
    id: 'showreel-2025',
    title: 'Showreel 2025',
    category: 'video',
    role: 'Editor & colourist',
    year: 2025,
    summary: 'Two minutes of the work I’m proudest of.',
    description:
      'A selection of commercial, documentary and music work from the past three years, cut to a single track.',
    ...img('showreel-2025', 2),
    // Paste your YouTube / Vimeo link or an .mp4 path here:
    // video: { url: 'https://vimeo.com/123456789' },
    featured: true,
    tags: ['Showreel'],
  },
  {
    id: 'northbound',
    title: 'Northbound',
    category: 'video',
    role: 'Editor',
    year: 2024,
    summary: 'A short documentary following a sleeper train north.',
    description:
      'Shot over four nights on a single train, Northbound weaves the stories of six strangers. I cut 40 hours of footage into 18 minutes, building the structure around the train’s own rhythm.\n\nSelected for three festivals in 2024.',
    ...img('northbound'),
    tags: ['Documentary', 'Short film'],
  },
  {
    id: 'volt-launch',
    title: 'Volt EV Launch Film',
    category: 'video',
    role: 'Editor & motion designer',
    year: 2023,
    summary: 'A 60-second launch spot for an electric scooter.',
    description:
      'Fast, graphic and rhythmic: a launch film combining live action with kinetic type, delivered in seven aspect ratios for every platform.',
    ...img('volt-launch', 2),
    tags: ['Commercial', 'Motion'],
  },
  {
    id: 'studio-sessions',
    title: 'Studio Sessions',
    category: 'video',
    role: 'Editor',
    year: 2022,
    summary: 'A live music video series, one take at a time.',
    description: 'Twelve episodes of live performances, edited to feel like you’re standing in the room.',
    ...img('studio-sessions', 2),
    tags: ['Music', 'Series'],
  },
]
