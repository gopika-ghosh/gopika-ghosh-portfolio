/**
 * Site-wide details: who you are and how to reach you.
 * Sourced from Gopika's résumé; lines marked TODO are still placeholders.
 */
export const site = {
  /** Shown large on the opening shot, in the navigation, and to search engines. */
  name: 'Gopika Ghosh',
  /** Full name (kept for search engines and link previews). */
  fullName: 'Gopika Ghosh',
  /** First name, for friendly copy. */
  firstName: 'Gopika',
  /**
   * Your live address (no trailing slash), for search engines and link previews.
   * Empty = the Vercel production address (your-project.vercel.app). Set it if you add a custom domain.
   */
  url: '' as string,
  /** One or two sentences for search results and link previews (~155 characters), in your own voice. */
  description:
    "Hi, I'm Gopika Ghosh: a UI/UX designer, graphic designer and video editor. Fly through my little universe to explore the websites, brands and reels I've made.",
  /** Preview image for links shared on social media (1200×630, in /public). */
  ogImage: '/og-image.jpg',
  /** Shown under your name on the opening shot. */
  title: 'UI/UX Designer · Graphic Designer · Video Editor',
  /** TODO: placeholder — replace with a line in Gopika's own words. */
  tagline: 'Everything I make orbits one idea: design is for people.',
  /** Paths are relative to /public. Cropped from assets-src/profile.jpg. */
  photo: '/images/gopika.webp',
  /** Describes the photo for screen readers. */
  photoAlt: 'Gopika Ghosh smiling on a beach, in black and white',
  bio: "I'm a UI/UX and graphic designer with 2+ years of experience designing web, mobile and admin interfaces. I focus on usability, accessibility and scalable design systems that connect the user experience with business goals — and I bring the same care to brand identities, marketing creatives and presentations.",
  /** Her design philosophy, shown under the bio. */
  philosophy: 'Start with the person, not the pixel. Remove until it breaks, then add one thing back.',
  /** Shown at Mercury: one line per discipline. */
  disciplines: [
    {
      name: 'UI/UX Design',
      line: 'Web, mobile and admin interfaces — from user flows and wireframes to high-fidelity UI and front-end handoff.',
    },
    {
      name: 'Graphic Design',
      line: 'Logos, brand identity, posters, ad creatives, brochures and pitch decks with a consistent visual voice.',
    },
    // TODO: placeholder line — Video Editing isn't on the résumé yet.
    { name: 'Video Editing', line: 'Pacing, colour and sound that keep people watching to the last frame.' },
  ],
  email: 'gopikaghoshh@gmail.com',
  /**
   * Path to a downloadable résumé in /public. Empty = no download button.
   * (Hidden for now: the current résumé includes a phone number.)
   */
  resumeUrl: '',
  socials: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/gopika-ghosh/' },
    { label: 'Behance', url: 'https://www.behance.net/gopikaGhoshh' },
  ],
} as const
