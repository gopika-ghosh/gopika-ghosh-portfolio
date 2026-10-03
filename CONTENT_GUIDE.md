# Content guide

All the text, links and images live in **`src/content/`**. You never need to touch the 3D code to change what the site says.

After editing, run `npm run dev` and open http://localhost:5173. Changes appear as soon as you save. Add `?debug` to the URL to see which stop you're at.

| File | What it holds |
|---|---|
| `site.ts` | Your name, title, tagline, bio, photo, philosophy, disciplines, email, socials, résumé |
| `chapters.ts` | The journey: the order of stops, where the camera goes, headings and intros |
| `works.ts` | Every project. Each one becomes a moon |
| `experience.ts` | Work history (shown on Saturn's rings) |
| `skills.ts` | Skills and tools (the tools float as labelled asteroids) |
| `testimonials.ts` | Quotes and awards (shown at Neptune) |
| `guide.ts` | What the little star guide says: one line per stop, plus reactions and tips |

> Everything currently in these files is **placeholder** content. The people, quotes and awards in `testimonials.ts` are fictional, so replace or remove them before launch.

---

## Add a project

1. Make a folder for its images: `public/images/works/<id>/`, for example `public/images/works/aurora-app/`.
2. Put the images in it:
   - `thumb.webp`: square-ish, about 800×800. Used on the moon label and in grids.
   - `01.webp`, `02.webp`, …: about 1600×1000. The project panel gallery. The first one is the hero image.

   JPG and PNG work too. Just match the file names you use in step 3.
3. Add an entry to `works.ts`, in the section for its category:

   ```ts
   {
     id: 'aurora-app',                 // must match the folder name
     title: 'Aurora — Sleep Tracking',
     category: 'uiux',                 // 'uiux' (Earth) · 'graphic' (Mars) · 'video' (Jupiter)
     role: 'Lead product designer',
     year: 2025,
     summary: 'One line for lists and labels.',
     description: 'First paragraph.\n\nSecond paragraph.',
     ...img('aurora-app'),             // thumb + 3 gallery images; img('aurora-app', 5) for 5
     externalLink: { label: 'Read the case study', url: 'https://…' },  // optional
     featured: true,                   // optional: bigger moon, listed first
     tags: ['Health', 'iOS'],          // optional
   },
   ```

A new moon appears around the planet. The orbits rebalance themselves for any number of projects, from 1 to 20 or more.

**Not using the standard image names?** Skip `...img()` and list the files yourself:

```ts
thumbnail: '/images/works/aurora-app/cover.jpg',
images: ['/images/works/aurora-app/hero.jpg', '/images/works/aurora-app/flow.png'],
```

**Need placeholder images while you write?** Run `npm run placeholders`. It creates images only for projects that don't have any yet, and never overwrites your files.

## Remove a project

Delete its entry from `works.ts`, and its moon disappears. You can also delete its image folder.

## Add a video

Paste a YouTube or Vimeo link, or the path of an MP4 in `/public`:

```ts
video: { url: 'https://vimeo.com/123456789' },
video: { url: 'https://youtu.be/VIDEO_ID' },
video: { url: '/media/showreel.mp4', poster: '/images/works/showreel-2025/01.webp' },
```

The video replaces the hero image in the project panel. Nothing loads from YouTube or Vimeo until the visitor presses play, which keeps the site fast and avoids tracking cookies.

## Instagram and LinkedIn posts (from the spreadsheet)

Gopika's client posters and reels come from **`assets-src/works.xlsx`**, sheet *All Client Works*, with the columns `No. | Client | Work Type | Link`. To add or remove posts:

1. Edit the spreadsheet. Work types: `Instagram Post` and `LinkedIn Post` go to Graphic Design (Mars); `Video`, `Video Editing` and `AI Video` go to Video Editing (Jupiter).
2. Run `npm run import-works`. This regenerates `src/content/embeds.ts` (don't edit that file by hand) and reports any row it couldn't place.
3. Run `npm run capture-posts`. This saves images of the first few posts per project to use as the moon surface, thumbnail and preview tiles.

**A new client** needs two small additions:
- in `scripts/import-works.py`, add the client name to `CLIENTS` with a short id, for example `'New Brand': 'newbrand'`;
- in `works.ts`, add a project with id `newbrand-creatives` (and/or `newbrand-reels`), following the existing ones.

In the project panel, the first post loads straight away and the rest show as tiles; tap a tile to play it. The client's profile goes in `instagram: { profile: '…' }`, shown as "See more on Instagram".

## Too many projects for one planet?

Each planet shows up to **8 moons** by default (Graphic Design and Video Editing are set to 4, so only the highlights are moons). If a category has more, the extra projects are gathered into a **"+N" moon** that opens a grid of every project. To change the limit for one planet, add this to its chapter in `chapters.ts`:

```ts
maxVisibleWorks: 6,
```

Featured projects always get their own moon, and the order in `works.ts` decides which others do. Everything else sits under the **"More work"** moon and link.

## Change images

Replace the file with one of the same name, or point the entry at a new path. Keep images reasonably small: WebP at quality 80–85 and 1600 px wide is plenty.

Your photo is `site.photo` (`public/images/gopika.webp`, a head-and-shoulders crop of `assets-src/profile.jpg`). Portrait orientation works best, at roughly 720×880 (9:11). Update `site.photoAlt` to describe it for screen readers.

## Reorder or change the journey

`chapters.ts` is the journey, in scroll order. Each entry is one stop:

```ts
{
  id: 'graphic',            // also the page anchor: yoursite.com/#graphic
  station: 'mars',          // where the camera goes
  kind: 'works',            // which layout to show
  category: 'graphic',      // works chapters only: which projects orbit here
  navLabel: 'Mars',
  heading: 'Graphic Design',
  intro: 'One or two sentences.',
  travel: 1.2,              // optional: scroll (in screen-heights) spent flying here
  dwell: 1.6,               // optional: scroll spent parked here (min 1)
}
```

- **Reorder:** move entries up or down. The camera path follows automatically.
- **Retarget:** change `station`. Options are `system`, `sun`, `mercury`, `venus`, `earth`, `mars`, `asteroids`, `jupiter`, `saturn`, `uranus`, `neptune` and `beyond`.
- **Kinds:** `intro`, `about`, `disciplines`, `works`, `skills`, `timeline`, `testimonials` and `contact`.
- **Moving a category to another planet:** put the `works` chapter on any planet, and the moons go with it. For example, to have video work orbit Saturn, set `station: 'saturn'` on the video chapter (and move the experience chapter elsewhere).
- **Experience** markers sit on Saturn's rings. On a planet without rings, they circle the planet instead.
- **Skills:** the labelled tool rocks only appear when the skills chapter is at the `asteroids` station. Choose which skill group floats with `floatingSkillGroup` in `skills.ts`.
- **Testimonials:** while `testimonials.ts` has no quotes and no awards, that stop is skipped automatically and the camera flies past Neptune. Add one entry and the stop returns.
- **Splitting Uranus and Neptune:** to give testimonials and awards separate stops, add a chapter with `station: 'uranus'`.

## The star guide's lines

The little clay star is Gopika, showing visitors around. Her lines are in `guide.ts`:

- `stops`: one line per stop, keyed by the chapter `id` from `chapters.ts`. If you add a chapter, add a line for it here (or leave it out and she'll stay quiet there).
- `openWork`, `pokeHome`, `toolUsed`…: short reactions. Words in `{braces}` are filled in automatically, for example `{title}` becomes the project's name.
- `tips`: what she says when someone taps her.

Keep each line to one or two short sentences, because they're typed into a small speech bubble. Screen readers also read each stop's line.

## Contact details and résumé

Edit `email`, `socials` and `resumeUrl` in `site.ts`. Replace `public/gopika-resume.pdf` with your CV (keep the name, or update `resumeUrl`).

## Credits

Planet textures are from Solar System Scope (CC BY 4.0). The required credit is shown under the contact details. Please keep it. See `ASSETS.md` for details.
