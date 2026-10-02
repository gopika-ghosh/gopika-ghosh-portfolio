import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { suspend } from 'suspend-react'
import { NoColorSpace, SRGBColorSpace, type Texture, type WebGLRenderer } from 'three'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { quality } from '../config/quality'

/**
 * KTX2 texture loading.
 *
 * - One shared loader (one transcoder worker pool) for the whole app.
 * - It reports to three's DefaultLoadingManager, so drei's useProgress — and the
 *   loading screen — see real progress.
 * - Everything loads and uploads behind the loading screen: 4K for hero planets on
 *   capable devices, 2K otherwise. (Streaming 4K in mid-journey was measured to cause
 *   0.3–2 s GPU stalls on integrated graphics, so it isn't done.)
 */

export type TextureKind = 'color' | 'data'
export interface TextureSpec {
  /** File name in public/textures/{2k,4k}/ without extension. */
  name: string
  kind: TextureKind
  /** A 4K version exists. */
  hero?: boolean
}
export type Res = '2k' | '4k'

/** Resolution to use for a texture on this device. */
export const resFor = (spec: TextureSpec): Res => (spec.hero && quality.hiResTextures ? '4k' : '2k')

let loader: KTX2Loader | null = null
const cache = new Map<string, Promise<Texture>>()

function getLoader(gl: WebGLRenderer) {
  if (!loader) {
    loader = new KTX2Loader().setTranscoderPath('/basis/').detectSupport(gl)
  }
  return loader
}

export function loadTexture(gl: WebGLRenderer, spec: TextureSpec, res: Res): Promise<Texture> {
  const url = `/textures/${res}/${spec.name}.ktx2`
  let p = cache.get(url)
  if (!p) {
    p = getLoader(gl)
      .loadAsync(url)
      .then((tex) => {
        tex.colorSpace = spec.kind === 'color' ? SRGBColorSpace : NoColorSpace
        tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
        // Upload to the GPU now, while the loading screen is up. Creating large textures can
        // stall the GPU for hundreds of ms on some drivers; that must never happen mid-journey.
        gl.initTexture(tex)
        return tex
      })
    cache.set(url, p)
  }
  return p
}

type SpecMap = Record<string, TextureSpec | undefined>
/** Texture for every key; optional specs give optional textures. */
type Loaded<S extends SpecMap> = { [K in keyof S]: undefined extends S[K] ? Texture | undefined : Texture }

const present = <S extends SpecMap>(specs: S) =>
  (Object.keys(specs) as (keyof S & string)[]).filter((k) => specs[k] !== undefined)

/** Load a set of textures (at this device's resolution), suspending until all are ready. */
export function useTextures<S extends SpecMap>(specs: S): Loaded<S> {
  const gl = useThree((s) => s.gl)
  const keys = present(specs)
  const textures = suspend(
    () => Promise.all(keys.map((k) => loadTexture(gl, specs[k]!, resFor(specs[k]!)))),
    ['ktx2', ...keys.map((k) => `${resFor(specs[k]!)}/${specs[k]!.name}`)],
  )
  return Object.fromEntries(keys.map((k, i) => [k, textures[i]])) as Loaded<S>
}

/**
 * Starts every texture download at once. Without this, sibling components inside one
 * Suspense boundary would suspend one after another and load as a waterfall.
 * Mount it outside the Suspense boundary that uses the textures.
 */
export function PreloadTextures({ specs }: { specs: TextureSpec[] }) {
  const gl = useThree((s) => s.gl)
  useLayoutEffect(() => {
    for (const spec of specs) loadTexture(gl, spec, resFor(spec)).catch(() => undefined)
  }, [gl, specs])
  return null
}
