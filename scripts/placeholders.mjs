/**
 * Generates placeholder imagery so the site looks finished before real assets exist:
 *   public/images/works/<id>/thumb.webp + 01.webp …   (from src/content/works.ts)
 *   public/images/gopika.webp                          (portrait)
 *   public/gopika-resume.pdf                           (one-page stand-in)
 *
 *   npm run placeholders            # only creates missing files
 *   npm run placeholders -- --force # regenerate everything
 *
 * Existing files are never overwritten without --force, so your real images are safe.
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const force = process.argv.includes('--force')
const OUT = 'public'

// Read works.ts without a TS toolchain: pull out id / title / category / image count.
const src = await readFile('src/content/works.ts', 'utf8')
const works = [...src.matchAll(/id: '([^']+)',\s*title: '([^']+)',\s*category: '(\w+)'[\s\S]*?\.\.\.img\('\1'(?:, (\d+))?\)/g)].map(
  ([, id, title, category, gallery]) => ({ id, title, category, gallery: Number(gallery ?? 3) }),
)

const PALETTES = {
  uiux: { bg: ['#0b1d3a', '#123f6b', '#1f7a8c'], ink: '#e8f4ff', accent: '#7ee0ff' },
  graphic: { bg: ['#3b0d0c', '#a1321b', '#f28f3b'], ink: '#fff3e6', accent: '#ffd166' },
  video: { bg: ['#07070b', '#1b1530', '#4a2b5e'], ink: '#f2ecff', accent: '#ff8a5c' },
}

/** Deterministic pseudo-random from a string. */
function rng(seedText) {
  let h = 2166136261
  for (const c of seedText) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

function composition(work, w, h, variant) {
  const p = PALETTES[work.category]
  const r = rng(`${work.id}-${variant}`)
  const shapes = []

  if (work.category === 'uiux') {
    // Floating interface cards.
    for (let i = 0; i < 4; i++) {
      const cw = w * (0.28 + r() * 0.2)
      const ch = cw * (1.4 + r() * 0.6)
      const x = w * (0.12 + i * 0.22) + r() * w * 0.04
      const y = h * (0.18 + r() * 0.3)
      shapes.push(
        `<g transform="rotate(${(r() - 0.5) * 10} ${x + cw / 2} ${y + ch / 2})">
          <rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="${cw * 0.08}" fill="${p.ink}" fill-opacity="${0.08 + r() * 0.1}" stroke="${p.ink}" stroke-opacity="0.25"/>
          <rect x="${x + cw * 0.1}" y="${y + ch * 0.08}" width="${cw * 0.5}" height="${ch * 0.04}" rx="${ch * 0.02}" fill="${p.accent}" fill-opacity="0.8"/>
          <rect x="${x + cw * 0.1}" y="${y + ch * 0.18}" width="${cw * 0.8}" height="${ch * 0.3}" rx="${cw * 0.05}" fill="${p.ink}" fill-opacity="0.12"/>
          <rect x="${x + cw * 0.1}" y="${y + ch * 0.55}" width="${cw * 0.7}" height="${ch * 0.03}" rx="${ch * 0.015}" fill="${p.ink}" fill-opacity="0.35"/>
          <rect x="${x + cw * 0.1}" y="${y + ch * 0.62}" width="${cw * 0.55}" height="${ch * 0.03}" rx="${ch * 0.015}" fill="${p.ink}" fill-opacity="0.25"/>
        </g>`,
      )
    }
  } else if (work.category === 'graphic') {
    // Bold geometry and type.
    shapes.push(`<circle cx="${w * (0.55 + r() * 0.2)}" cy="${h * (0.45 + r() * 0.1)}" r="${Math.min(w, h) * (0.28 + r() * 0.1)}" fill="${p.accent}" fill-opacity="0.9"/>`)
    for (let i = 0; i < 7; i++) {
      shapes.push(`<rect x="${-w * 0.1}" y="${h * (0.1 + i * 0.12)}" width="${w * 1.2}" height="${h * 0.035}" fill="${p.ink}" fill-opacity="${0.05 + r() * 0.12}" transform="rotate(-12 ${w / 2} ${h / 2})"/>`)
    }
    shapes.push(`<path d="M ${w * 0.1} ${h * 0.85} Q ${w * 0.4} ${h * (0.4 + r() * 0.2)} ${w * 0.9} ${h * 0.75}" stroke="${p.ink}" stroke-width="${w * 0.012}" fill="none" stroke-opacity="0.7"/>`)
  } else {
    // Cinematic frame: letterbox, horizon glow, play mark.
    shapes.push(`<ellipse cx="${w * (0.3 + r() * 0.4)}" cy="${h * 0.62}" rx="${w * 0.6}" ry="${h * 0.18}" fill="${p.accent}" fill-opacity="0.35" filter="url(#blur)"/>`)
    shapes.push(`<rect x="0" y="${h * 0.66}" width="${w}" height="${h * 0.34}" fill="#000" fill-opacity="0.35"/>`)
    shapes.push(`<rect x="0" y="0" width="${w}" height="${h * 0.1}" fill="#000"/><rect x="0" y="${h * 0.9}" width="${w}" height="${h * 0.1}" fill="#000"/>`)
    const s = Math.min(w, h) * 0.07
    shapes.push(`<circle cx="${w / 2}" cy="${h / 2}" r="${s * 1.6}" fill="none" stroke="${p.ink}" stroke-opacity="0.7" stroke-width="${s * 0.12}"/>`)
    shapes.push(`<path d="M ${w / 2 - s * 0.45} ${h / 2 - s * 0.7} L ${w / 2 + s * 0.8} ${h / 2} L ${w / 2 - s * 0.45} ${h / 2 + s * 0.7} Z" fill="${p.ink}" fill-opacity="0.85"/>`)
  }

  const showTitle = variant !== 'thumb'
  const fs = Math.round(Math.min(w, h) * 0.055)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${p.bg[0]}"/><stop offset="0.6" stop-color="${p.bg[1]}"/><stop offset="1" stop-color="${p.bg[2]}"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="${w * 0.04}"/></filter>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    ${shapes.join('\n')}
    <rect width="${w}" height="${h}" filter="url(#grain)"/>
    ${
      showTitle
        ? `<text x="${w * 0.06}" y="${h * 0.86}" font-family="Georgia, serif" font-size="${fs}" fill="${p.ink}" fill-opacity="0.92">${esc(work.title)}</text>
           <text x="${w * 0.06}" y="${h * 0.86 + fs * 1.1}" font-family="Arial, sans-serif" font-size="${fs * 0.36}" letter-spacing="${fs * 0.08}" fill="${p.ink}" fill-opacity="0.55">PLACEHOLDER · ${variant.toUpperCase()}</text>`
        : ''
    }
  </svg>`
}

async function render(svg, file, w, h) {
  if (existsSync(file) && !force) return false
  await mkdir(path.dirname(file), { recursive: true })
  await sharp(Buffer.from(svg)).resize(w, h).webp({ quality: 82 }).toFile(file)
  return true
}

let made = 0
for (const work of works) {
  const dir = path.join(OUT, 'images/works', work.id)
  if (await render(composition(work, 800, 800, 'thumb'), path.join(dir, 'thumb.webp'), 800, 800)) made++
  for (let i = 1; i <= work.gallery; i++) {
    const n = String(i).padStart(2, '0')
    if (await render(composition(work, 1600, 1000, n), path.join(dir, `${n}.webp`), 1600, 1000)) made++
  }
}

// Portrait: warm gradient with a soft abstract silhouette.
const portrait = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100">
  <defs>
    <radialGradient id="bg" cx="0.35" cy="0.3" r="1"><stop offset="0" stop-color="#ffcf8f"/><stop offset="0.45" stop-color="#e2733a"/><stop offset="1" stop-color="#2a0f10"/></radialGradient>
    <filter id="b"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect width="900" height="1100" fill="url(#bg)"/>
  <g fill="#1a0b0c" fill-opacity="0.78" filter="url(#b)">
    <ellipse cx="450" cy="470" rx="150" ry="180"/>
    <path d="M 160 1100 C 180 800 330 720 450 720 C 570 720 720 800 740 1100 Z"/>
  </g>
  <text x="450" y="1050" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" letter-spacing="6" fill="#fff" fill-opacity="0.6">PLACEHOLDER PORTRAIT</text>
</svg>`
if (await render(portrait, path.join(OUT, 'images/gopika.webp'), 900, 1100)) made++

// A minimal one-page PDF so the résumé link works until the real file is added.
const resume = path.join(OUT, 'gopika-resume.pdf')
if (!existsSync(resume) || force) {
  const text = 'Resume placeholder - replace public/gopika-resume.pdf with your CV.'
  const stream = `BT /F1 18 Tf 72 720 Td (${text}) Tj ET`
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = []
  objs.forEach((o, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  await writeFile(resume, pdf)
  made++
}

console.log(`${works.length} works found; ${made} placeholder file(s) written${force ? ' (forced)' : ''}.`)
