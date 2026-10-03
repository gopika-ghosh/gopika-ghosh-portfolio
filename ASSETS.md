# Assets

Everything the site needs is already committed under `public/`. This file explains where it came from and how to rebuild it.

## Planet textures (realistic theme)

**Source:** [Solar System Scope](https://www.solarsystemscope.com/textures/), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) and based on NASA imagery. The attribution is shown in the Contact section (`Credits` in `src/ui/Chapters.tsx`). Keep it if you redesign that section.

| Source file (download page) | Output | Used for |
|---|---|---|
| `8k_earth_daymap.jpg` | `earth_day` (4K + 2K) | Earth surface |
| `8k_earth_nightmap.jpg` | `earth_night` (4K + 2K) | City lights |
| `8k_earth_clouds.jpg` | `earth_clouds` (4K + 2K) | Clouds and cloud shadows |
| `2k_earth_specular_map.tif` | `earth_specular` (2K) | Ocean sun glint |
| `8k_mars.jpg` | `mars` (4K + 2K) | Mars |
| `8k_jupiter.jpg` | `jupiter` (4K + 2K) | Jupiter |
| `8k_saturn.jpg` | `saturn` (4K + 2K) | Saturn |
| `2k_saturn_ring_alpha.png` | `saturn_ring` (2048×16) | Saturn's rings |
| `2k_mercury.jpg` | `mercury` (2K) | Mercury |
| `2k_venus_atmosphere.jpg` | `venus` (2K) | Venus |
| `2k_uranus.jpg` | `uranus` (2K) | Uranus |
| `2k_neptune.jpg` | `neptune` (2K) | Neptune |
| `2k_moon.jpg` | `moon` (2K) | Moons (Phase 3) |
| `8k_stars_milky_way.jpg` | `milky_way` (4K + 2K) | Background panorama |

The Sun has no texture. It's drawn entirely by shaders (`src/scene/shaders/sun.frag.glsl`, `corona.frag.glsl`).

### Rebuilding

1. Download the source files above into `assets-src/textures/`. That folder is git-ignored because the sources are about 36 MB.
2. Run `npm run textures`.

The script (`scripts/build-textures.mjs`) resizes each map and encodes it to **KTX2 / Basis Universal (ETC1S)** with mipmaps. It writes `public/textures/4k/` and `public/textures/2k/`. It uses a WebAssembly encoder, so nothing needs installing beyond `npm install`. Files that are already up to date are skipped.

### How they load

- Every **2K** map loads and uploads behind the loading screen, about 3 MB in total. (4K versions are still built but not used: streaming them mid-journey caused GPU stalls, and 2K looked equivalent at these sizes.)
- The KTX2 transcoder lives in `public/basis/`, copied from `three/examples/jsm/libs/basis/`. Re-copy it if you upgrade three.js.

## Clay theme (default)

Everything in the toy universe is generated in code: lumpy clay planets, the star guide, clouds, stars and asteroids. The planets' "paint jobs" (continents, bands, craters) are defined in `src/scene/clay/painters.ts` and pre-rendered to small WebP textures in `public/textures/clay/` (≈150 KB total) by `npm run clay-textures`. Re-run it after editing a painter.

## Fonts

Self-hosted through npm, so there's no request to Google at runtime:

- **Fredoka** (display, rounded): `@fontsource-variable/fredoka`, SIL Open Font License
- **Nunito** (body): `@fontsource-variable/nunito`, SIL Open Font License

## Tool logos

`public/images/tools/`: Figma, Photoshop, Illustrator and Canva from [Devicon](https://devicon.dev) (MIT); Cursor from [Simple Icons](https://simpleicons.org) (CC0); PowerPoint from Wikimedia Commons (public domain). Trademarks belong to their owners and are used only to show which tools Gopika works with.

## Other

- `public/favicon.svg` was drawn for this project.
- Simplex noise in `src/scene/shaders/noise.glsl` is by Ashima Arts / Stefan Gustavson (MIT).
