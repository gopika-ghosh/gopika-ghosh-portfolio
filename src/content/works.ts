import type { Work } from './types'

/**
 * Every project. Each one becomes a moon orbiting its category's planet:
 *   uiux → Earth · graphic → Mars · video → Jupiter  (set in chapters.ts)
 *
 * Add an entry → a moon appears. Remove one → it's gone. Orbits rebalance
 * automatically for any count. Images live in /public/images/works/<id>/.
 * See CONTENT_GUIDE.md for details.
 *
 * Source: Gopika's résumé and her clients' Instagram accounts.
 * TODO (marked below): client project images are placeholders, years are best guesses,
 * embedded posts/reels need their links (instagram.com/p/… or /reel/…), and the client
 * projects need their `tools` (e.g. ['Canva', 'Adobe Photoshop']) to join the skill lines.
 */

/** Shorthand for the standard image set of a work. */
const img = (id: string, gallery = 3) => ({
  thumbnail: `/images/works/${id}/thumb.webp`,
  images: Array.from({ length: gallery }, (_, i) => `/images/works/${id}/${String(i + 1).padStart(2, '0')}.webp`),
})

/** Client accounts whose social content Gopika designs and edits. */
const ig = {
  crayoIndia: 'https://www.instagram.com/crayotech.in/',
  crayo: 'https://www.instagram.com/crayotech/',
  inhavo: 'https://www.instagram.com/inhavo.furniture/',
  nexa: 'https://www.instagram.com/nexaelectromechanical/',
  access: 'https://www.instagram.com/access.innovation.tvm/',
  metg: 'https://www.instagram.com/met_g_architechural/',
}

export const works: Work[] = [
  // ── UI/UX ──────────────────────────────────────────────────────────────
  {
    id: 'utility-emc',
    title: 'Utility Electrical & Mechanical Contracting',
    category: 'uiux',
    role: 'UI/UX Designer · Front-end',
    year: 2025,
    summary: 'Corporate website for an electrical and mechanical contracting company, designed end to end.',
    description:
      'Led the end-to-end UI/UX design, from wireframes to high-fidelity interfaces, with user-centric layouts aligned to the business and its operational needs.\n\nAlso contributed to the front-end build, making sure the design translated accurately into code.\n\nTools: Figma, Photoshop, Cursor AI.',
    ...img('utility-emc', 2),
    externalLink: { label: 'Visit the live site', url: 'https://www.utility.com.bh/' },
    featured: true,
    tools: ['Figma', 'Adobe Photoshop', 'Cursor AI'],
    tags: ['Web', 'UI/UX', 'Front-end'],
  },
  {
    id: 'united-arab-engineering',
    title: 'United Arab Engineering Company',
    category: 'uiux',
    role: 'UI/UX Designer · Front-end',
    year: 2025,
    summary: 'Business website designed from user flows to high-fidelity UI, and built responsive.',
    description:
      'Delivered the end-to-end UI/UX design, from user flows and wireframes to high-fidelity interfaces, with intuitive, business-focused layouts aligned to operational requirements.\n\nContributed to front-end development for a seamless, responsive implementation.\n\nTools: Figma, Photoshop, Cursor AI.',
    ...img('united-arab-engineering', 2),
    externalLink: { label: 'Visit the live site', url: 'https://www.unitedarabengineering.com/' },
    tools: ['Figma', 'Adobe Photoshop', 'Cursor AI'],
    tags: ['Web', 'UI/UX', 'Responsive'],
  },
  {
    id: 'ishloom',
    title: 'Ishloom Clothing',
    category: 'uiux',
    role: 'UI/UX Designer · Front-end',
    year: 2025,
    summary: 'A clean, responsive landing page for a modern clothing brand.',
    description:
      'Designed a modern landing page for a clothing brand: clean, responsive UI/UX focused on engagement and product visibility.\n\nContributed to the front-end implementation to keep it responsive and consistent with the design.\n\nTools: Figma, Photoshop, Cursor AI.',
    ...img('ishloom', 2),
    externalLink: { label: 'Visit the live site', url: 'https://ishloom.com/' },
    tools: ['Figma', 'Adobe Photoshop', 'Cursor AI'],
    tags: ['Landing page', 'Fashion', 'UI/UX'],
  },
  {
    id: 'pokak-website',
    title: 'POKAK Technologies Website',
    category: 'uiux',
    role: 'UI/UX Designer',
    year: 2024,
    summary: 'Company website redesign focused on usability, visual clarity and modern UI standards.',
    description:
      'Redesigned the company website with a focus on improved usability, visual clarity and modern UI standards.\n\nTools: Figma, Photoshop.',
    ...img('pokak-website', 2),
    externalLink: { label: 'Visit the live site', url: 'https://pokaktech.com/' },
    tools: ['Figma', 'Adobe Photoshop'],
    tags: ['Web', 'Redesign'],
  },

  // ── Graphic design ─────────────────────────────────────────────────────
  // TODO: images are placeholders — add her artwork to public/images/works/<id>/.
  {
    id: 'crayo-creatives',
    title: 'Crayo Tech — Marketing & Social',
    category: 'graphic',
    role: 'Graphic Designer',
    year: 2025,
    summary: 'Posters, ad creatives, presentations, brochures and review cards with one consistent visual voice.',
    description:
      'Designed a consistent family of visual and marketing assets for Crayo Tech: posters, ad creatives, business presentations, brochures and review cards.',
    ...img('crayo-creatives', 2),
    instagram: { profile: ig.crayoIndia, posts: [] },
    links: [{ label: 'Crayo Tech Bahrain on Instagram', url: ig.crayo }],
    featured: true,
    tags: ['Social media', 'Marketing', 'Brand consistency'],
  },
  {
    id: 'inhavo-creatives',
    title: 'Inhavo Furniture — Social Creatives',
    category: 'graphic',
    role: 'Graphic Designer',
    year: 2025,
    summary: 'Posters and social media creatives for a furniture brand.',
    description: "Social media posters and creatives for Inhavo Furniture's Instagram.",
    ...img('inhavo-creatives', 2),
    instagram: { profile: ig.inhavo, posts: [] },
    tags: ['Social media', 'Furniture'],
  },
  {
    id: 'nexa-creatives',
    title: 'Nexa Electromechanical — Social Creatives',
    category: 'graphic',
    role: 'Graphic Designer',
    year: 2025,
    summary: 'Posters and social media creatives for an electromechanical company.',
    description: "Social media posters and creatives for Nexa Electromechanical's Instagram and LinkedIn.",
    ...img('nexa-creatives', 2),
    instagram: { profile: ig.nexa, posts: [] },
    links: [{ label: 'Nexa on LinkedIn', url: 'https://www.linkedin.com/company/nexaelectromechanical/' }],
    tags: ['Social media', 'Engineering'],
  },
  {
    id: 'access-creatives',
    title: 'Access Innovation — Social Creatives',
    category: 'graphic',
    role: 'Graphic Designer',
    year: 2025,
    summary: 'Posters and social media creatives for Access Innovation, Trivandrum.',
    description: "Social media posters and creatives for Access Innovation's Instagram.",
    ...img('access-creatives', 2),
    instagram: { profile: ig.access, posts: [] },
    tags: ['Social media'],
  },
  {
    id: 'metg-creatives',
    title: 'MET G Architectural — Social Creatives',
    category: 'graphic',
    role: 'Graphic Designer',
    year: 2025,
    summary: 'Posters and social media creatives for an architectural firm.',
    description: "Social media posters and creatives for MET G Architectural's Instagram.",
    ...img('metg-creatives', 2),
    instagram: { profile: ig.metg, posts: [] },
    tags: ['Social media', 'Architecture'],
  },
  {
    id: 'logo-design',
    title: 'Logo Design',
    category: 'graphic',
    role: 'Graphic Designer',
    year: 2025,
    summary: 'Logos and brand marks, drawn in Adobe Illustrator and Photoshop.',
    description: 'Logo design for brands and businesses, created in Adobe Illustrator and Adobe Photoshop.',
    ...img('logo-design', 2),
    tools: ['Adobe Illustrator', 'Adobe Photoshop'],
    tags: ['Logo', 'Brand identity'],
  },
  {
    id: 'pokak-creatives',
    title: 'POKAK Technologies — Posters & Social',
    category: 'graphic',
    role: 'Graphic Designer',
    year: 2024,
    summary: 'Posters, social media creatives and promotional materials.',
    description: 'Designed posters, social media creatives and promotional materials for POKAK Technologies.',
    ...img('pokak-creatives', 2),
    tags: ['Posters', 'Social media'],
  },

  // ── Video editing ──────────────────────────────────────────────────────
  // TODO: images are placeholders; add reel links to `posts` to embed them.
  {
    id: 'crayo-reels',
    title: 'Crayo Tech — Reels',
    category: 'video',
    role: 'Video Editor',
    year: 2025,
    summary: 'Short-form reels for Crayo Tech’s social channels.',
    description: "Reels edited for Crayo Tech's Instagram accounts in India and Bahrain.",
    ...img('crayo-reels', 2),
    instagram: { profile: ig.crayoIndia, posts: [] },
    links: [{ label: 'Crayo Tech Bahrain on Instagram', url: ig.crayo }],
    featured: true,
    tags: ['Reels', 'Social media'],
  },
  {
    id: 'inhavo-reels',
    title: 'Inhavo Furniture — Reels',
    category: 'video',
    role: 'Video Editor',
    year: 2025,
    summary: 'Short-form reels for a furniture brand.',
    description: "Reels edited for Inhavo Furniture's Instagram.",
    ...img('inhavo-reels', 2),
    instagram: { profile: ig.inhavo, posts: [] },
    tags: ['Reels', 'Furniture'],
  },
  {
    id: 'nexa-reels',
    title: 'Nexa Electromechanical — Reels',
    category: 'video',
    role: 'Video Editor',
    year: 2025,
    summary: 'Short-form reels for an electromechanical company.',
    description: "Reels edited for Nexa Electromechanical's Instagram.",
    ...img('nexa-reels', 2),
    instagram: { profile: ig.nexa, posts: [] },
    tags: ['Reels', 'Engineering'],
  },
  {
    id: 'access-reels',
    title: 'Access Innovation — Reels',
    category: 'video',
    role: 'Video Editor',
    year: 2025,
    summary: 'Short-form reels for Access Innovation, Trivandrum.',
    description: "Reels edited for Access Innovation's Instagram.",
    ...img('access-reels', 2),
    instagram: { profile: ig.access, posts: [] },
    tags: ['Reels'],
  },
  {
    id: 'metg-reels',
    title: 'MET G Architectural — Reels',
    category: 'video',
    role: 'Video Editor',
    year: 2025,
    summary: 'Short-form reels for an architectural firm.',
    description: "Reels edited for MET G Architectural's Instagram.",
    ...img('metg-reels', 2),
    instagram: { profile: ig.metg, posts: [] },
    tags: ['Reels', 'Architecture'],
  },
]
