/**
 * Converts the source planet maps in assets-src/textures/ into compressed KTX2
 * textures in public/textures/{4k,2k}/.
 *
 *   npm run textures
 *
 * Uses the Basis Universal encoder compiled to WebAssembly (ktx2-encoder), so no
 * system tools are needed. ETC1S keeps files small and transcodes on any GPU.
 * Source files: https://www.solarsystemscope.com/textures/ (CC BY 4.0).
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { encodeToKTX2 } from 'ktx2-encoder'

const SRC = 'assets-src/textures'
const OUT = 'public/textures'

/**
 * name:   output file name (without extension)
 * src:    source file in assets-src/textures
 * hero:   also build a 4K version (desktop); everything gets a 2K version (mobile + non-hero)
 * linear: data texture, not colour (skip sRGB-perceptual encoding)
 * size:   explicit output size [w, h] (default: equirectangular 2:1)
 */
const TEXTURES = [
  { name: 'earth_day', src: '8k_earth_daymap.jpg', hero: true },
  { name: 'earth_night', src: '8k_earth_nightmap.jpg', hero: true },
  { name: 'earth_clouds', src: '8k_earth_clouds.jpg', hero: true, linear: true },
  { name: 'earth_specular', src: '2k_earth_specular_map.tif', linear: true },
  { name: 'mars', src: '8k_mars.jpg', hero: true },
  { name: 'jupiter', src: '8k_jupiter.jpg', hero: true },
  { name: 'saturn', src: '8k_saturn.jpg', hero: true },
  // A 1D radial strip; compressed formats need dimensions in multiples of 4.
  { name: 'saturn_ring', src: '2k_saturn_ring_alpha.png', size: [2048, 16] },
  { name: 'mercury', src: '2k_mercury.jpg' },
  { name: 'venus', src: '2k_venus_atmosphere.jpg' },
  { name: 'uranus', src: '2k_uranus.jpg' },
  { name: 'neptune', src: '2k_neptune.jpg' },
  { name: 'moon', src: '2k_moon.jpg' },
  { name: 'milky_way', src: '8k_stars_milky_way.jpg', hero: true },
]

const decode = async (buffer) => {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data: new Uint8Array(data), width: info.width, height: info.height }
}

async function build(tex, width, dir) {
  const out = path.join(OUT, dir, `${tex.name}.ktx2`)
  const src = path.join(SRC, tex.src)
  if (existsSync(out) && (await stat(out)).mtimeMs > (await stat(src)).mtimeMs) {
    console.log(`  skip  ${out} (up to date)`)
    return
  }
  let img = sharp(await readFile(src))
  const [w, h] = tex.size ?? [width, width / 2]
  img = img.resize({ width: w, height: h, fit: 'fill', kernel: 'lanczos3' })
  const png = await img.png().toBuffer()

  const ktx2 = await encodeToKTX2(new Uint8Array(png), {
    isUASTC: false, // ETC1S: small files, fine for planet colour maps
    qualityLevel: 230,
    compressionLevel: 2,
    generateMipmap: true,
    isPerceptual: !tex.linear,
    // KTX2 textures can't be flipped at upload time, so bake the flip in.
    isYFlip: true,
    enableDebug: false,
    imageDecoder: decode,
  })
  await mkdir(path.dirname(out), { recursive: true })
  await writeFile(out, ktx2)
  console.log(`  wrote ${out} (${(ktx2.byteLength / 1024).toFixed(0)} KB)`)
}

for (const tex of TEXTURES) {
  if (!existsSync(path.join(SRC, tex.src))) {
    console.warn(`  MISSING ${tex.src} — download it from solarsystemscope.com/textures`)
    continue
  }
  if (tex.hero) await build(tex, 4096, '4k')
  await build(tex, 2048, '2k')
}
