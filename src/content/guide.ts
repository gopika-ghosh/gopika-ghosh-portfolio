/**
 * What the little star (Gopika's guide) says, in her own voice. Edit freely.
 *
 * - `stops`: one line per chapter, keyed by the chapter `id` in chapters.ts. Shown when
 *   the journey arrives there. A chapter without a line just shows the star quietly.
 * - The rest are short reactions. Words in {braces} are filled in automatically.
 * Keep lines short: one or two sentences reads best in the speech bubble.
 */
export const guide = {
  stops: {
    home: "Hi, I'm Gopika! ✦ Welcome to my little universe. Scroll down — I'll show you around.",
    about: "This is me — the warm bit in the middle. Everything I make orbits one idea: design is for people.",
    'what-i-do': 'I wear three hats: UI/UX, graphic design and video editing. Same brain, three toolboxes!',
    'ui-ux': 'Earth is my human-centred corner. Every moon here is a real website I designed — tap one to look inside!',
    graphic: 'Mars is where my posters, logos and social creatives live. Pick a moon to see the brand.',
    skills: "These floating rocks are my tools. Hover one and I'll show you what I made with it!",
    video: 'Big Jupiter keeps my reels — short videos for the brands I work with.',
    experience: "Saturn's rings are my story so far: engineering, a UI/UX programme, POKAK, and now Crayo Tech.",
    'kind-words': "People said nice things… I'm blushing!",
    contact: "That's my whole universe! If you enjoyed the trip, say hello — I'd love to make something with you.",
  } as Record<string, string>,

  /** Opening a project, by category. */
  openWork: {
    uiux: 'Ooh, {title}! I designed this one from wireframes to the live site.',
    graphic: '{title}! I had so much fun with this one.',
    video: '{title} — press play, it’s better with sound!',
  },
  openViewAll: "Here's everything in one place — pick anything!",

  /** Poking a planet. {name} = planet, {heading} = its chapter heading. */
  pokeHome: "Boop! That's {name} — my {heading} lives there.",
  pokeOther: '{name}! Just a pretty planet passing by.',

  /** Hovering a tool in the asteroid belt. {n} = number of projects that used it. */
  toolUsed: '{tool}! I used it on {n} of the projects here.',
  toolUsedOne: '{tool}! I used it on one of the projects here.',
  toolEveryday: '{tool} is part of my everyday toolkit.',

  /** Tapping the star cycles through these. */
  tips: [
    'Tip: arrow keys or space hop between stops.',
    'Tap any moon to open a project.',
    'Psst — the planets are squishy. Try poking one!',
    'Turn on the sound (top right) for a little space music.',
    "Hehe, that tickles! Shall we keep going?",
  ],

  /** Label for the button that flies to the next stop. */
  next: 'Next stop',
  home: 'Back to start',
}

/** Fill {placeholders} in a guide line. */
export const fill = (line: string, values: Record<string, string | number>) =>
  line.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''))
