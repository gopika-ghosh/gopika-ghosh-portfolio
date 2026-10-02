# Project Brief: "Heliocentric" — a 3D solar-system portfolio

## Who this is for
A portfolio site for an experienced **UI/UX designer, graphic designer and video editor**. The concept is *heliocentric*: **she is the Sun** at the centre, and everything she's made orbits around her. Visitors land on a view of the solar system, and scrolling takes them on a guided camera journey outward through the planets. Each stop reveals a part of her story and her work.

Quality bar: this site is itself a portfolio piece for a designer. It must feel cinematic, polished and buttery smooth. No placeholder-looking geometry, no janky scroll, no low-res textures. Treat every frame as something a senior designer will judge.

---

## Tech stack (use this unless you have a strong, stated reason to change it)
- **Vite + React + TypeScript**
- **three.js** via **@react-three/fiber** and **@react-three/drei**
- **@react-three/postprocessing** — bloom on the Sun, subtle vignette, film grain, optional chromatic aberration on fast camera moves
- **GSAP + ScrollTrigger** for scroll-driven timelines, **Lenis** for smooth scrolling (sync Lenis with ScrollTrigger and the R3F frame loop)
- Custom **GLSL shaders** where they beat textures: animated Sun surface (noise-based plasma + corona/fresnel glow), planet atmospheres (fresnel rim), Saturn's rings with shadowing, starfield
- **Tailwind CSS** (or CSS modules) for the HTML overlay UI
- Textures: high-quality planet maps (e.g. Solar System Scope textures, CC BY 4.0 — add attribution in the footer; NASA imagery where applicable). Use 4K for hero bodies, 2K elsewhere, compressed to **KTX2/Basis**; any GLB models compressed with **Draco/Meshopt**

---

## The journey (scroll flow)
The whole page is one continuous scroll-driven camera path. Use a `CatmullRomCurve3` (or keyframed position + lookAt targets) mapped to scroll progress, with eased transitions and short "dwell" zones at each stop so content can be read comfortably. Camera should never cut — always glide.

| # | Stop | What it shows |
|---|------|---------------|
| 0 | **Establishing shot** | Top-down/angled view of the whole system, planets slowly orbiting. Her name and title fade in. A subtle "scroll to explore" cue. |
| 1 | **The Sun** | Camera dives toward the Sun. About her: photo, short bio, design philosophy. She is the centre of everything. |
| 2 | **Mercury** | Quick intro: what she does, in one line per discipline. |
| 3 | **Earth** | **UI/UX** work (Earth = human-centred design). |
| 4 | **Mars** | **Graphic design** work. |
| 5 | **Asteroid belt** | **Skills & tools** — floating rocks labelled with tools (Figma, After Effects, Premiere, Illustrator, etc.), gently tumbling. |
| 6 | **Jupiter** | **Video editing** work. Showreel available here. |
| 7 | **Saturn** | **Experience timeline** — roles/companies placed along the rings. |
| 8 | **Uranus / Neptune** | Clients, testimonials or awards. |
| 9 | **Beyond Neptune** | Contact. Camera turns back to look at the whole system, now tiny ("pale blue dot" moment). Email, socials, resume download. |

The mapping of stops to content must live in config (see below) so it can be reassigned without touching scene code.

### How works are shown — the key requirement
**Each work is a moon orbiting its category planet.** When the camera arrives at a planet:
- Its moons (works) orbit slowly and display small glowing thumbnails/labels
- Hovering a moon highlights it and pauses its orbit; clicking it smoothly focuses the camera on it and opens a **project panel** (title, role, year, description, image gallery or embedded video, external link)
- Closing the panel returns the camera to the planet and resumes the scroll journey

**The number of works must be fully configurable.** Adding or removing an entry in the content file automatically adds or removes a moon. Orbit radii, speeds, inclinations and spacing are computed procedurally from the count so it always looks balanced, whether a planet has 1 work or 12. Optionally expose a `maxVisibleWorks` per planet, with a "view all" grid fallback when exceeded.

---

## Content & configuration
All editable content lives in `src/content/`, fully typed, with clear comments. I will fill in the real text and links myself, so ship with realistic placeholder content and placeholder images.

- `site.ts` — name, title, tagline, bio, photo, philosophy, contact email, social links, resume URL
- `chapters.ts` — the ordered list of stops: which celestial body, which content type (`about | works | skills | timeline | testimonials | contact`), heading, intro text
- `works.ts` — array of works, each with: `id, title, category (which planet), role, year, summary, description, thumbnail, images[], video? (YouTube/Vimeo URL or mp4 + poster), externalLink?, featured?`
- `experience.ts`, `skills.ts`, `testimonials.ts`

Include a short **`CONTENT_GUIDE.md`** explaining exactly how to add/remove works, change images, and reorder chapters.

---

## Interaction & UX details
- Fixed minimal nav: progress indicator showing which "planet" you're at; clicking a planet name glides there
- Keyboard: arrow keys / space step between stops; Esc closes panels
- Custom cursor that reacts over interactive bodies (optional, but tasteful)
- Ambient: slow planet self-rotation, orbiting motion, twinkling multi-layer parallax starfield, faint orbit lines that fade in only near the active planet
- Typography: elegant, modern display font + clean sans for body (Google Fonts). Dark space palette with one warm accent drawn from the Sun
- Optional ambient sound toggle (off by default)

---

## Performance & robustness (non-negotiable)
- Target a steady **60fps** on a mid-range laptop. Use `PerformanceMonitor` / adaptive DPR, instancing for asteroids and stars, frustum culling, and avoid re-renders from React state inside the frame loop
- Lazy-load textures per chapter; show a **designed loading screen** with real progress (drei `useProgress`)
- **Mobile:** must work and look good. Reduce texture sizes, particle counts and post-processing; touch scrolling must feel natural
- Respect `prefers-reduced-motion`: replace big camera flights with gentle fades
- Graceful fallback if WebGL is unavailable: a static, still-beautiful 2D version of the portfolio content
- Accessible: all content also exists as real HTML text (screen readers, SEO), proper meta tags + Open Graph image, semantic headings
- Lighthouse: aim for good performance and accessibility scores despite the 3D

---

## How to work
1. **Plan first.** Before writing code, propose: folder structure, scene/component architecture, how scroll maps to the camera path, and how the procedural moon layout works. Wait for my approval.
2. Build in phases, and stop for my review after each:
   - **Phase 1:** project setup, scene with Sun + planets + starfield, scroll-driven camera path through all stops (grey-box content OK)
   - **Phase 2:** visual quality — shaders, textures, lighting, post-processing, loading screen
   - **Phase 3:** content system + overlay UI + moons-as-works with project panels
   - **Phase 4:** polish — transitions, micro-interactions, nav, sound toggle
   - **Phase 5:** mobile, reduced-motion, WebGL fallback, performance pass, SEO/meta
3. Keep code clean and well commented. Separate scene logic, scroll/camera logic, and content.
4. Tell me which asset files (textures, fonts) need downloading and where to put them, and include attribution where licences require it.
5. Set it up to deploy easily on **Vercel** or **Netlify**.
