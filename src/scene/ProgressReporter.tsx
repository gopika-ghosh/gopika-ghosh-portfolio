import { useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import { useUi } from '../state/uiStore'

/** Forwards three's loading progress to the UI store for the loading screen. */
export function ProgressReporter() {
  const { progress } = useProgress()
  useEffect(() => useUi.getState().setProgress(progress), [progress])
  return null
}
