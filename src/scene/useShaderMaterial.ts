import { useEffect, useMemo, useRef } from 'react'
import { ShaderMaterial, type ShaderMaterialParameters } from 'three'

/**
 * Creates a ShaderMaterial once and disposes it on unmount.
 *
 * Use this instead of JSX <shaderMaterial uniforms={…}>: R3F copies each uniform
 * into the material's own object, so later writes to your uniforms object would
 * never reach the GPU. Here the material keeps the exact object you pass, and
 * per-frame updates like `uniforms.uTime.value = t` just work.
 */
export function useShaderMaterial(create: () => ShaderMaterialParameters, deps: unknown[] = []) {
  const material = useMemo(() => new ShaderMaterial(create()), deps)
  const pending = useRef(0)
  useEffect(() => {
    // Dispose a tick after unmount, and cancel if we're remounted straight away
    // (React StrictMode does that in development, and reuses the memoised material).
    window.clearTimeout(pending.current)
    return () => {
      pending.current = window.setTimeout(() => material.dispose(), 0)
    }
  }, [material])
  return material
}
