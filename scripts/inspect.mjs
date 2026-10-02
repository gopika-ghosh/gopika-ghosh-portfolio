/**
 * Dev visual check: opens the site in your installed Chrome, waits for the loader,
 * then screenshots each journey stop. Prints console errors and load timing.
 *
 *   node scripts/inspect.mjs [--url http://localhost:5173] [--stops 0,1,3] [--at 3.4,9.5] [--out dir] [--size 1568x710]
 *
 * --at shoots arbitrary scroll positions (in units) instead of stops, e.g. mid-flight.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright-core'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : fallback
}
const url = arg('url', 'http://localhost:5173') + '/?debug'
const out = arg('out', 'inspect-out')
const [width, height] = arg('size', '1568x710').split('x').map(Number)
const stopsArg = arg('stops', 'all')
const atArg = arg('at', null)

await mkdir(out, { recursive: true })
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: false,
  args: [
    // Keep rendering even if the window is covered or in the background.
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--disable-features=CalculateNativeWinOcclusion',
    `--window-size=${width},${height + 90}`,
  ],
})
const page = await browser.newPage({ viewport: { width, height } })
const t0 = Date.now()
page.on('console', (m) => {
  const text = m.text()
  if (m.type() === 'error' || m.type() === 'warning' || text.startsWith('[perf]')) {
    if (!text.includes('THREE.Clock')) console.log(`  [${m.type()}] +${Date.now() - t0}ms ${text.slice(0, 300)}`)
  }
})
page.on('pageerror', (e) => console.log(`  [pageerror] ${e.message}`))

await page.goto(url)
const gpu = await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2')
  const ext = gl?.getExtension('WEBGL_debug_renderer_info')
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown'
})
console.log(`GPU: ${gpu}`)

await page.waitForFunction(() => !document.querySelector('[role=progressbar]'), null, { timeout: 90_000 })
console.log(`Loader gone after ${Date.now() - t0}ms`)

if (atArg) {
  for (const u of atArg.split(',').map(Number)) {
    await page.evaluate((u) => window.scrollTo(0, u * window.__journey.unit()), u)
    await page.waitForTimeout(2200)
    const file = path.join(out, `at-${u.toFixed(2)}.png`)
    await page.screenshot({ path: file })
    console.log(`  shot ${file}`)
  }
  await browser.close()
  process.exit(0)
}

const count = await page.evaluate(() => window.__journey.stops.length)
const stops = stopsArg === 'all' ? [...Array(count).keys()] : stopsArg.split(',').map(Number)
for (const i of stops) {
  const name = await page.evaluate((i) => {
    const s = window.__journey.stops[i]
    window.scrollTo(0, s.arrive * window.__journey.unit())
    return s.chapter.station
  }, i)
  await page.waitForTimeout(2600)
  const file = path.join(out, `stop-${String(i).padStart(2, '0')}-${name}.png`)
  await page.screenshot({ path: file })
  console.log(`  shot ${file}`)
}
await browser.close()
