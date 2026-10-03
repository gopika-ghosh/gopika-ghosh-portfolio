/**
 * Captures images of Gopika's Instagram posts/reels (from their public embed pages) to use
 * as moon surfaces, thumbnails and tile previews for the social projects:
 *
 *   public/images/works/<id>/thumb.webp      square, for the moon + labels
 *   public/images/works/<id>/01.webp … 04.webp  the first few posts
 *
 * Also writes src/content/postMeta.json with each project's Instagram handle.
 *
 *   npm run capture-posts            # every project in src/content/embeds.ts
 *   npm run capture-posts -- nexa-creatives
 *
 * Run after `npm run import-works`. Uses your installed Chrome (via playwright-core).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { chromium } from 'playwright-core'

const PER_WORK = 4
const only = process.argv[2]

const src = await readFile('src/content/embeds.ts', 'utf8')
const works = [...src.matchAll(/'([\w-]+)': \[([\s\S]*?)\]/g)]
  .map(([, id, body]) => ({ id, urls: [...body.matchAll(/'(https:\/\/www\.instagram\.com\/[^']+)'/g)].map((m) => m[1]) }))
  .filter((w) => w.urls.length && (!only || w.id === only))

const metaPath = 'src/content/postMeta.json'
const meta = JSON.parse(await readFile(metaPath, 'utf8').catch(() => '{}'))

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 540, height: 1000 }, deviceScaleFactor: 2 })

for (const work of works) {
  const dir = path.join('public/images/works', work.id)
  await mkdir(dir, { recursive: true })
  let saved = 0
  for (const url of work.urls) {
    if (saved >= PER_WORK) break
    const embed = url.replace(/\/$/, '') + '/embed/'
    try {
      await page.goto(embed, { waitUntil: 'networkidle', timeout: 45_000 })
    } catch {
      /* slow trackers: the image is usually there anyway */
    }
    await page.waitForTimeout(1200)
    // Posts show an <img>; reels may show a video player instead. Take the first visible one.
    let media = null
    for (const sel of ['img.EmbeddedMediaImage', 'video', '.EmbeddedMedia', '.EmbedVideo']) {
      const loc = page.locator(sel).first()
      if ((await loc.count()) && (await loc.isVisible().catch(() => false))) {
        media = loc
        break
      }
    }
    if (!media) {
      console.log(`  ${work.id}: no visible media for ${url} (removed, private or video-only?)`)
      continue
    }
    if (!meta[work.id]?.handle) {
      const handle = await page.locator('.UsernameText, a.Username, .Username').first().textContent().catch(() => null)
      if (handle) meta[work.id] = { handle: handle.trim() }
    }
    const shot = await media.screenshot({ timeout: 8000 }).catch(() => null)
    if (!shot) {
      console.log(`  ${work.id}: couldn't capture ${url}`)
      continue
    }
    saved++
    const n = String(saved).padStart(2, '0')
    await sharp(shot).resize({ width: 1080, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(dir, `${n}.webp`))
    if (saved === 1) {
      await sharp(shot).resize(800, 800, { fit: 'cover', position: 'attention' }).webp({ quality: 82 }).toFile(path.join(dir, 'thumb.webp'))
    }
    // Be polite to Instagram.
    await page.waitForTimeout(800)
  }
  console.log(`  ${work.id.padEnd(20)} ${saved} image(s)  @${meta[work.id]?.handle ?? '?'}`)
}
await browser.close()
await writeFile(metaPath, JSON.stringify(meta, null, 2) + '\n')
console.log(`wrote ${metaPath}`)
