/**
 * Viewer environment, decided once at startup.
 *
 * URL flags for testing:  ?reduced  (pretend prefers-reduced-motion)
 *                         ?nowebgl  (force the 2D fallback)
 */
const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)
const media = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches

/** The viewer asked their OS/browser for less motion. */
export const reducedMotion = params.has('reduced') || media('(prefers-reduced-motion: reduce)')

/** Mouse/trackpad (hover + precise pointer), as opposed to touch. */
export const finePointer = media('(hover: hover) and (pointer: fine)')

/** Can we run the 3D scene? Needs WebGL 2 (three.js r163+). */
export const webglAvailable = (() => {
  if (params.has('nowebgl') || typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (!gl) return false
    // Release the probe context straight away so it doesn't count against the browser's limit.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
})()

/**
 * Visual theme. 'clay' = the hand-made toy universe (default); 'real' = the cinematic
 * space version (kept for reference; see also the `realistic` git branch). ?theme=real
 */
export const theme: 'real' | 'clay' = params.get('theme') === 'real' ? 'real' : 'clay'
