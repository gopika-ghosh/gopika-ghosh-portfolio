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

/** Which group's items become the floating rocks in the asteroid belt. */
export const floatingSkillGroup = 'Tools'

/**
 * Logos for the floating tools (files in /public/images/tools). A tool without a logo
 * shows its name instead. Sources: Devicon (MIT) for Figma, Photoshop, Illustrator and
 * Canva; Simple Icons (CC0) for Cursor; Wikimedia Commons (public domain) for PowerPoint.
 */
export const toolLogos: Record<string, string> = {
  Figma: '/images/tools/figma.svg',
  'Adobe Photoshop': '/images/tools/photoshop.svg',
  'Adobe Illustrator': '/images/tools/illustrator.svg',
  Canva: '/images/tools/canva.svg',
  'Microsoft PowerPoint': '/images/tools/powerpoint.svg',
  'Cursor AI': '/images/tools/cursor.svg',
}
