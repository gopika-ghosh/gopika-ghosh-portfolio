/**
 * Per-frame scroll state, deliberately outside React.
 * Written by the Lenis scroll handler, read inside useFrame — never causes a re-render.
 */
export const scrollStore = {
  /** Scroll position in units (viewport heights). */
  u: 0,
  /** Pixel size of one unit. Kept in sync with the --unit CSS variable. */
  unit: typeof window === 'undefined' ? 800 : window.innerHeight,
  /** True while a programmatic glide (nav, keys, snap) is running. */
  gliding: false,
}
