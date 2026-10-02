import type { SkillGroup } from './types'

/**
 * Skills and tools, shown in the asteroid belt.
 * Items in the floating group become labelled rocks in front of the camera;
 * every group is also listed as text. Source: Gopika's résumé.
 */
export const skills: SkillGroup[] = [
  {
    name: 'UI/UX',
    items: ['User flows', 'Wireframing', 'High-fidelity UI', 'Design systems', 'Accessibility', 'Responsive web design'],
  },
  {
    name: 'Graphic & brand',
    items: [
      'Graphic design',
      'Visual communication',
      'Brand identity',
      'Logo design',
      'Marketing & ad creatives',
      'Social media design',
      'Presentations & pitch decks',
      'Brochures & review cards',
    ],
  },
  {
    name: 'Tools',
    items: ['Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Canva', 'Microsoft PowerPoint', 'Cursor AI'],
  },
  {
    name: 'Development',
    items: ['Front-end web development (basic)'],
  },
]

/** Which group's items become the floating labelled rocks. */
export const floatingSkillGroup = 'Tools'
