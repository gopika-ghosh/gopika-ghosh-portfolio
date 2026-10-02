import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { quality } from '../../config/quality'

/**
 * WebGL post-processing — deliberately minimal, measured on Intel UHD (integrated):
 *  - Bloom on HDR values only (the Sun, its corona, bright glints), at half resolution;
 *    a soft glow loses nothing at half res
 *  - Filmic tone mapping
 *
 * Everything else is cheaper elsewhere or not worth its cost:
 *  - Vignette and film grain are static CSS layers over the canvas (see Experience.tsx),
 *    composited by the browser for free. As WebGL effects they cost ~35% of the frame.
 *  - No anti-aliasing pass: soft limbs, atmospheres and grain already hide edges; MSAA cost
 *    ~20 fps for no visible gain, and FXAA posterised the corona and gas-giant gradients.
 *  - No chromatic aberration: barely visible, and its pass ran every frame regardless.
 * Net: ~45 fps → ~100 fps on the same machine, visually equivalent.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        levels={quality.bloomLevels}
        resolutionScale={0.5}
        luminanceThreshold={1}
        luminanceSmoothing={0.1}
        intensity={0.75}
        radius={0.62}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
