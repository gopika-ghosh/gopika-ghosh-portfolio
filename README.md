# Heliocentric — Gopika's portfolio

A 3D solar-system portfolio. Gopika is the Sun; her work orbits around her. Scrolling flies the camera outward through the planets, and each project is a moon.

Built with Vite, React, TypeScript, three.js (React Three Fiber), GSAP + Lenis and Tailwind CSS.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:5173  (add ?debug for a position readout)
```

Useful URL flags for checking special cases: `?reduced` (reduced-motion version), `?nowebgl` (2D fallback), `?quality=low` (phone-level settings).

## Edit the content

Everything you'll want to change is in `src/content/`. **See [CONTENT_GUIDE.md](CONTENT_GUIDE.md)** for adding or removing projects, images, videos and contact details.

Before launch, check these:
- `src/content/site.ts`: name, `url` (your real domain), email, socials, bio, photo
- `src/content/works.ts`: your projects (the current ones are placeholders)
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
| `npm run textures` | Rebuild planet textures (see [ASSETS.md](ASSETS.md)) |
| `npm run og-image` | Refresh the link-preview image and touch icon |

## How it behaves

- **Performance:** the text content loads first (≈20 kB); the 3D layer loads in the background behind a loading screen. Post-processing is kept minimal (bloom + tone mapping). It measured ~100 fps on an Intel UHD integrated GPU.
- **Phones:** lighter settings automatically (fewer particles, smaller textures, lower resolution).
- **Reduced motion:** camera flights become gentle fades; no parallax or drifting.
- **No WebGL:** a complete 2D version of the site with the same content.
- **Accessibility and SEO:** all content is real HTML, keyboard-navigable (arrow keys / space step between stops, Esc closes panels), with full meta tags and a no-JavaScript fallback. Lighthouse scores 100 for accessibility, best practices and SEO.

Credits: planet textures by [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0).
