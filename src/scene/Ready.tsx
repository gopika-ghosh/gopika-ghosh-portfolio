import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useUi } from '../state/uiStore'

/**
 * Mounted inside the scene's Suspense boundary, so it only runs once every texture
 * has loaded. It then compiles all shaders up front (no hitch on the first flight)
 * and lets the first frames render before telling the UI the scene is ready.
 */
export function Ready() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    let cancelled = false
    gl.compileAsync(scene, camera)
      .catch(() => undefined) // compiling is an optimisation; never block on it
      .then(() => {
        // Two frames so the first real render is on screen before the loader fades.
        requestAnimationFrame(() => requestAnimationFrame(() => !cancelled && useUi.getState().setReady()))
      })
    return () => {
      cancelled = true
    }
  }, [gl, scene, camera])
  return null
}
