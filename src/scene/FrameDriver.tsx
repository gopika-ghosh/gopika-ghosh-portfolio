import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'

/**
 * Renders the R3F scene from GSAP's ticker instead of R3F's own requestAnimationFrame.
 * Lenis is registered on the same ticker with priority, so within a single frame the
 * order is always: scroll update → camera/scene update → render. No one-frame lag, no jitter.
 * Requires <Canvas frameloop="never">.
 */
export function FrameDriver() {
  const advance = useThree((s) => s.advance)
  useEffect(() => {
    // In "never" mode R3F expects the timestamp in seconds, which is what GSAP gives us.
    const tick = (time: number) => advance(time)
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [advance])
  return null
}
