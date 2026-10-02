/**
 * Site-wide details: who you are and how to reach you.
 * Placeholder text — replace with your own.
 */
export const site = {
  name: 'Gopika',
  /** Shown under your name on the opening shot. */
  title: 'UI/UX Designer · Graphic Designer · Video Editor',
  tagline: 'Everything I make orbits one idea: design is for people.',
  /** Paths are relative to /public. */
  photo: '/images/gopika.jpg',
  bio: 'I design interfaces, identities and edits that feel inevitable — calm on the surface, carefully engineered underneath. Over the past eight years I have worked with product teams, studios and independent brands across three continents.',
  philosophy:
    'Start with the person, not the pixel. Remove until it breaks, then add one thing back.',
  email: 'hello@gopika.design',
  resumeUrl: '/gopika-resume.pdf',
  socials: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
    { label: 'Behance', url: 'https://www.behance.net/' },
    { label: 'Dribbble', url: 'https://dribbble.com/' },
    { label: 'Vimeo', url: 'https://vimeo.com/' },
  ],
} as const
