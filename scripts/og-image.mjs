/**
 * Captures the social preview image (public/og-image.jpg, 1200×630) from the real
 * opening shot, and renders the Apple touch icon from the favicon.
 *
 *   npm run dev            # in one terminal
 *   npm run og-image       # in another
 *
 * Uses your installed Chrome (via playwright-core). Re-run after changing your name/title.
 */
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { chromium } from 'playwright-core'

const url = process.argv[2] ?? 'http://localhost:5173/'
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: false,
  args: ['--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-features=CalculateNativeWinOcclusion'],
})
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })
await page.goto(url)
await page.waitForFunction(() => !document.querySelector('[role=progressbar]'), null, { timeout: 90_000 })
// Let the name reveal finish, then hide chrome that doesn't belong in a preview.
await page.waitForTimeout(3500)
await page.addStyleTag({ content: 'html { scrollbar-width: none } nav, button, .scroll-cue, [data-reveal]:last-child { visibility: hidden !important }' })
await page.waitForTimeout(300)
const png = await page.screenshot()
await sharp(png).resize(1200, 630).jpeg({ quality: 86, mozjpeg: true }).toFile('public/og-image.jpg')
await browser.close()

await sharp(await readFile('public/favicon.svg'), { density: 400 }).resize(180, 180).png().toFile('public/apple-touch-icon.png')
console.log('wrote public/og-image.jpg and public/apple-touch-icon.png')
