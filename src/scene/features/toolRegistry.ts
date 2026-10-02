import type { Object3D } from 'three'

/** Tool rocks in the asteroid belt by tool name, so the skill lines can find them. */
export const toolRegistry = new Map<string, Object3D>()
