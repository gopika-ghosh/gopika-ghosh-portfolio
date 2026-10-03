# Heliocentric — Gopika's portfolio

A 3D solar-system portfolio in a hand-made **clay "toy universe"** style. Gopika is the Sun; her work orbits around her. Scrolling flies the camera outward through the planets, each project is a moon wrapped in its own image, and a little clay star — Gopika's guide — floats along, explaining each stop in her own words and reacting to what you explore.

The original cinematic, photo-real version lives on the **`realistic`** git branch (and is still reachable here with `?theme=real`).

Built with Vite, React, TypeScript, three.js (React Three Fiber), GSAP + Lenis and Tailwind CSS.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:5173  (add ?debug for a position readout)
```

Useful URL flags for checking special cases: `?reduced` (reduced-motion version), `?nowebgl` (2D fallback), `?quality=low` (phone-level settings), `?theme=real` (the cinematic version).

## Edit the content

Everything you'll want to change is in `src/content/`. **See [CONTENT_GUIDE.md](CONTENT_GUIDE.md)** for adding or removing projects, images, videos and contact details.

Before launch, check these:
- `src/content/site.ts`: name, `url` (your real domain), email, socials, bio, photo
- `src/content/works.ts`: client posters and reels come from `assets-src/works.xlsx` (see CONTENT_GUIDE); Logo Design and POKAK creatives still use placeholder images
- `src/content/guide.ts`: what the little star says at each stop (and her reactions)
- `src/content/testimonials.ts`: the quotes and awards are **fictional placeholders**, so replace or empty them
- `public/gopika-resume.pdf`: your CV
- After changing your name or title, run `npm run og-image` (with `npm run dev` running) to refresh the link-preview image

## Deploy

`npm run build` produces a static site in `dist/`. Any static host works; both of these are pre-configured.

### Vercel
1. Push this repository to GitHub.
2. On [vercel.com](https://vercel.com) choose **Add New → Project** and import the repository.
3. Vercel detects Vite. Keep the defaults (`npm run build`, output `dist`) and press **Deploy**.

`vercel.json` already sets long-term caching for the hashed assets and textures.

### Netlify
1. Push this repository to GitHub.
2. On [netlify.com](https://app.netlify.com) choose **Add new site → Import an existing project**.
3. The build settings come from `netlify.toml` (`npm run build`, publish `dist`). Press **Deploy**.

Or deploy straight from your machine: `npx netlify-cli deploy --prod --dir=dist` (after `npm run build`).

### Custom domain
Add the domain in your host's dashboard, then set the same address as `url` in `src/content/site.ts` and rebuild. It's used for search engines and link previews.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests (moon layout) |
| `npm run placeholders` | Placeholder images for projects that have none |
| `npm run clay-textures` | Re-paint the clay planets' textures after changing `src/scene/clay/painters.ts` |
| `npm run textures` | Rebuild the realistic theme's planet textures (see [ASSETS.md](ASSETS.md)) |
| `npm run capture-sites` | Re-screenshot the live websites used as UI/UX project images |
| `npm run import-works` | Read `assets-src/works.xlsx` into `src/content/embeds.ts` (Python + openpyxl) |
| `npm run capture-posts` | Capture images of the Instagram posts for moons and previews |
| `npm run og-image` | Refresh the link-preview image and touch icon |

## How it behaves

- **Performance:** the text content loads first (≈20 kB); the 3D layer loads in the background behind a loading screen. Post-processing is kept minimal (bloom + tone mapping). It measured ~100 fps on an Intel UHD integrated GPU.
- **Phones:** lighter settings automatically (fewer particles, smaller textures, lower resolution).
- **Reduced motion:** camera flights become gentle fades; no parallax or drifting.
- **No WebGL:** a complete 2D version of the site with the same content.
- **Accessibility and SEO:** all content is real HTML, keyboard-navigable (arrow keys / space step between stops, Esc closes panels), with full meta tags and a no-JavaScript fallback. Lighthouse scores 100 for accessibility, best practices and SEO.

Credits: clay planets, rocket and stars are generated in code; fonts are Fredoka and Nunito (SIL OFL); tool logos from Devicon (MIT), Simple Icons (CC0) and Wikimedia Commons (public domain). The realistic theme uses planet textures by [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0).
