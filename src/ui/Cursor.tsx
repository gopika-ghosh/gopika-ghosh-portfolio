import { useEffect, useRef } from 'react'
import { useUi } from '../state/uiStore'

/** Only for precise pointers, and not for people who asked for less motion. */
const enabled =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A quiet custom cursor: a precise dot plus a ring that trails slightly behind.
 * The ring grows over links and buttons, and over a moon it expands and says
 * what a click will do. Runs on its own rAF loop, never re-renders React.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('has-custom-cursor')

    const pos = { x: -100, y: -100 }
    const lag = { x: -100, y: -100, s: 1 }
    let overUi = false
    let visible = false
    let raf = 0

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      if (!visible) {
        visible = true
        lag.x = pos.x
        lag.y = pos.y
        dot.current?.classList.remove('opacity-0')
        ring.current?.classList.remove('opacity-0')
      }
      const t = e.target as Element | null
      // Moon labels are buttons too, but they should read as "the moon", not generic UI.
      overUi = !!t?.closest?.('a, button, [role="button"], input, label') && !t?.closest?.('.moon-label')
    }
    const onLeave = () => {
      visible = false
      dot.current?.classList.add('opacity-0')
      ring.current?.classList.add('opacity-0')
    }
    const onDown = () => ring.current?.style.setProperty('--press', '0.85')
    const onUp = () => ring.current?.style.setProperty('--press', '1')

    const loop = () => {
      const { hovered, openWorkId } = useUi.getState()
      // A hovered moon (not an overlay list item, which is already a button).
      const moon = !!hovered && !overUi && !openWorkId
      const target = moon ? 2.6 : overUi ? 1.6 : 1
      lag.x += (pos.x - lag.x) * 0.2
      lag.y += (pos.y - lag.y) * 0.2
      lag.s += (target - lag.s) * 0.18
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      if (ring.current) {
        ring.current.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0) scale(calc(${lag.s.toFixed(3)} * var(--press, 1)))`
        ring.current.dataset.mode = moon ? 'moon' : overUi ? 'ui' : 'idle'
      }
      if (label.current) {
        label.current.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0)`
        // Only touch text/opacity when they change; rewriting them every frame stops them painting.
        const text = moon ? (hovered!.startsWith('more:') ? 'View all' : 'Open') : label.current.textContent
        if (text !== label.current.textContent) label.current.textContent = text
        const op = moon ? '1' : '0'
        if (label.current.style.opacity !== op) label.current.style.opacity = op
      }
      raf = requestAnimationFrame(loop)
    }
    loop()

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  if (!enabled) return null
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]">
      <div ref={ring} className="cursor-ring opacity-0" />
      <span ref={label} className="cursor-label" />
      <div ref={dot} className="cursor-dot opacity-0" />
    </div>
  )
}
