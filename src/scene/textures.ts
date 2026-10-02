import { useEffect, useLayoutEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { suspend } from 'suspend-react'
import { NoColorSpace, SRGBColorSpace, type Texture, type WebGLRenderer } from 'three'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'

/**
 * KTX2 texture loading.
 *
 * - One shared loader (one transcoder worker pool) for the whole app.
 * - It reports to three's DefaultLoadingManager, so drei's useProgress — and the
 *   loading screen — see real progress.
 * - 2K maps load up-front (suspending); 4K hero maps stream in later via useHiRes().
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

/** Load a set of 2K textures, suspending until all are ready. */
export function useTextures<S extends SpecMap>(specs: S): Loaded<S> {
  const gl = useThree((s) => s.gl)
  const keys = present(specs)
  const textures = suspend(
    () => Promise.all(keys.map((k) => loadTexture(gl, specs[k]!, '2k'))),
    ['ktx2', ...keys.map((k) => specs[k]!.name)],
  )
  return Object.fromEntries(keys.map((k, i) => [k, textures[i]])) as Loaded<S>
}

/**
 * Returns 4K versions of the hero textures once `wanted` becomes true (and stays
 * with them afterwards). Until then returns null, and the 2K maps keep showing.
 */
export function useHiRes<S extends SpecMap>(specs: S, wanted: boolean) {
  const gl = useThree((s) => s.gl)
  const [hi, setHi] = useState<Partial<Record<keyof S, Texture>> | null>(null)
  useEffect(() => {
    if (!wanted || hi) return
    let cancelled = false
    const keys = present(specs).filter((k) => specs[k]!.hero)
    if (!keys.length) return
    Promise.all(keys.map((k) => loadTexture(gl, specs[k]!, '4k')))
      .then((list) => {
        if (!cancelled) setHi(Object.fromEntries(keys.map((k, i) => [k, list[i]])) as Partial<Record<keyof S, Texture>>)
      })
      .catch((e) => console.warn('[textures] 4K upgrade failed, keeping 2K', e))
    return () => {
      cancelled = true
    }
  }, [wanted, hi, specs, gl])
  return hi
}

/**
 * Starts every 2K download at once. Without this, sibling components inside one
 * Suspense boundary would suspend one after another and load as a waterfall.
 * Mount it outside the Suspense boundary that uses the textures.
 */
export function PreloadTextures({ specs }: { specs: TextureSpec[] }) {
  const gl = useThree((s) => s.gl)
  useLayoutEffect(() => {
    for (const spec of specs) loadTexture(gl, spec, '2k').catch(() => undefined)
  }, [gl, specs])
  return null
}
