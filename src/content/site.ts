/**
 * Site-wide details: who you are and how to reach you.
 * Placeholder text — replace with your own.
 */
export const site = {
  name: 'Gopika',
  /** Your live address (no trailing slash). Used for search engines and link previews. */
  url: 'https://gopika.design',
  /** One or two sentences for search results and link previews (~155 characters). */
  description:
    'Gopika is a UI/UX designer, graphic designer and video editor. Explore her work as a journey through a 3D solar system.',
  /** Preview image for links shared on social media (1200×630, in /public). */
  ogImage: '/og-image.jpg',
  /** Shown under your name on the opening shot. */
  title: 'UI/UX Designer · Graphic Designer · Video Editor',
  tagline: 'Everything I make orbits one idea: design is for people.',
  /** Paths are relative to /public. */
  photo: '/images/gopika.webp',
  /** Describes the photo for screen readers. */
  photoAlt: 'Portrait of Gopika',
  bio: 'I design interfaces, identities and edits that feel inevitable — calm on the surface, carefully engineered underneath. Over the past eight years I have worked with product teams, studios and independent brands across three continents.',
  philosophy:
    'Start with the person, not the pixel. Remove until it breaks, then add one thing back.',
  /** Shown at Mercury: one line per discipline. */
  disciplines: [
    { name: 'UI/UX Design', line: 'Products that feel obvious — researched, prototyped, tested, shipped.' },
    { name: 'Graphic Design', line: 'Identities and print with a point of view and a system behind it.' },
    { name: 'Video Editing', line: 'Pacing, colour and sound that keep people watching to the last frame.' },
  ],
  email: 'hello@gopika.design',
  resumeUrl: '/gopika-resume.pdf',
  socials: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
    { label: 'Behance', url: 'https://www.behance.net/' },
    { label: 'Dribbble', url: 'https://dribbble.com/' },
    { label: 'Vimeo', url: 'https://vimeo.com/' },
  ],
} as const
