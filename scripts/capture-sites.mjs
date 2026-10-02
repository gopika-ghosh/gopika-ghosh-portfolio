/**
 * Screenshots the live websites of UI/UX projects (category 'uiux' with an externalLink)
 * and writes them as the project's images:
 *   public/images/works/<id>/thumb.webp   square crop of the hero
 *   public/images/works/<id>/01.webp      first screen (desktop)
 *   public/images/works/<id>/02.webp      second screen (desktop)
 *
 *   npm run capture-sites            # all UI/UX projects with a live link
 *   npm run capture-sites -- ishloom # just one
 *   HEADED=1 WAIT=7000 npm run capture-sites -- utility-emc   # stubborn video heroes
 *
 * Uses your installed Chrome (via playwright-core). Overwrites those three files.
 */
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { chromium } from 'playwright-core'

const only = process.argv[2]
const src = await readFile('src/content/works.ts', 'utf8')
const sites = [...src.matchAll(/id: '([^']+)',[\s\S]*?category: 'uiux',[\s\S]*?externalLink: \{ label: '[^']*', url: '([^']+)' \}/g)]
  .map(([, id, url]) => ({ id, url }))
  .filter((s) => !only || s.id === only)

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  // Some heroes (background videos, lazy sliders) only render in a visible browser.
  headless: !process.env.HEADED,
  args: ['--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })

for (const { id, url } of sites) {
  const dir = path.join('public/images/works', id)
  await mkdir(dir, { recursive: true })
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 })
  } catch {
    // Some sites never go fully idle (chat widgets, analytics); a loaded page is enough.
  }
  // Nudge scroll-triggered animations and lazy media, then return to the top.
  await page.mouse.move(720, 450)
  await page.evaluate(() => window.scrollTo(0, 400))
  await page.waitForTimeout(800)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(Number(process.env.WAIT ?? 2500)) // let hero animations settle
  const first = await page.screenshot()
  await page.evaluate(() => window.scrollTo(0, window.innerHeight))
  await page.waitForTimeout(1500)
  const second = await page.screenshot()

  await sharp(first).resize(1600, 1000).webp({ quality: 82 }).toFile(path.join(dir, '01.webp'))
  await sharp(second).resize(1600, 1000).webp({ quality: 82 }).toFile(path.join(dir, '02.webp'))
  await sharp(first).extract({ left: 270, top: 0, width: 900, height: 900 }).resize(800, 800).webp({ quality: 82 }).toFile(path.join(dir, 'thumb.webp'))
  console.log(`  ${id}  ← ${url}`)
}
await browser.close()
