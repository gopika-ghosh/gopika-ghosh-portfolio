import { BackSide } from 'three'
import { useTextures } from '../textures'

export const MILKY_WAY = { map: { name: 'milky_way', kind: 'color' as const } }

/**
 * A faint Milky Way panorama far behind the starfield, so deep space has
 * structure instead of flat black. Kept dim: it's atmosphere, not a subject.
 */
export function MilkyWay() {
  const { map } = useTextures(MILKY_WAY)
  return (
    <mesh scale={3200} rotation={[0.35, 0.8, 0.2]} renderOrder={-2}>
      <sphereGeometry args={[1, 64, 32]} />
      <meshBasicMaterial map={map} side={BackSide} color="#5a5f70" depthWrite={false} />
    </mesh>
  )
}
