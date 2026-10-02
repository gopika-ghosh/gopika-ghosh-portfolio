import type { Object3D } from 'three'
import type { WorkCategory } from '../../content/types'

/**
 * Live moon objects by work id, so the camera rig can fly to whichever moon's
 * project panel is open. Written by <Moon> on mount, read inside useFrame.
 */
export interface MoonHandle {
  object: Object3D
  /** Moon radius (scene units), for framing the close-up. */
  size: number
}

export const moonRegistry = new Map<string, MoonHandle>()

/** Registry key for a category's "+N" moon (focused for works without their own moon). */
export const moreKey = (category: WorkCategory) => `more:${category}`
