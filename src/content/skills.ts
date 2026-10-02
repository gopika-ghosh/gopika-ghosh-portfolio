import type { SkillGroup } from './types'

/**
 * Skills and tools, shown in the asteroid belt.
 * Items in `tools` become labelled rocks floating in front of the camera;
 * every group is also listed as text.
 * Placeholder content — replace with your own.
 */
export const skills: SkillGroup[] = [
  {
    name: 'Design',
    items: ['Product strategy', 'User research', 'Interaction design', 'Design systems', 'Brand identity', 'Typography'],
  },
  {
    name: 'Motion & video',
    items: ['Editing', 'Colour grading', 'Motion graphics', 'Sound design'],
  },
  {
    name: 'Tools',
    items: ['Figma', 'Illustrator', 'Photoshop', 'InDesign', 'After Effects', 'Premiere Pro', 'DaVinci Resolve', 'Blender', 'Framer', 'ProtoPie'],
  },
]

/** Which group's items become the floating labelled rocks. */
export const floatingSkillGroup = 'Tools'
