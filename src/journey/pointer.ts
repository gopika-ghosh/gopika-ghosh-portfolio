import { finePointer, reducedMotion } from '../lib/env'

/**
 * Normalised pointer position (-1…1, +y up), for subtle camera parallax.
 * Only tracks precise pointers; stays at 0 on touch devices and for reduced motion.
 */
export const pointer = { x: 0, y: 0 }

if (finePointer && !reducedMotion) {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    },
    { passive: true },
  )
  document.addEventListener('pointerleave', () => {
    pointer.x = 0
    pointer.y = 0
  })
}
