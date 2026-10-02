import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode, type ChromaticAberrationEffect } from 'postprocessing'
import { Vector2 } from 'three'
import { quality } from '../../config/quality'
import { cameraMotion } from '../../journey/cameraMotion'

const MAX_ABERRATION = 0.0022

/**
 * Post-processing stack:
 *  - Bloom on HDR values only (the Sun, its corona, bright glints) — threshold 1
 *  - Chromatic aberration that appears only during fast camera flights
 *  - Filmic tone mapping, then a soft vignette and fine film grain
 */
export function Effects() {
  const aberration = useRef<ChromaticAberrationEffect>(null)
  const offset = useRef(new Vector2(0, 0))

  useFrame(() => {
    const a = cameraMotion.speed * MAX_ABERRATION
    offset.current.set(a, a * 0.6)
    if (aberration.current) aberration.current.offset = offset.current
  })

  return (
    <EffectComposer multisampling={quality.msaa}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.1} intensity={0.75} radius={0.62} />
      <ChromaticAberration ref={aberration} offset={offset.current} radialModulation modulationOffset={0.35} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.72} />
      {quality.grain ? <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.18} /> : <></>}
    </EffectComposer>
  )
}
