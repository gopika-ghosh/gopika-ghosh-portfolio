/**
 * Ambient space sound, synthesised live with the Web Audio API — no audio files.
 *
 *  - Pad: detuned oscillators on an open A chord, through a slowly breathing low-pass
 *  - Shimmer: band-passed noise, very quiet, fading in and out
 *  - Space: a generated reverb tail
 *  - Depth: the further out the journey goes, the darker and lower the pad
 *  - Cues: a soft chime on hover, a gentle swell when a project opens
 *
 * Off by default. The AudioContext is only created after the viewer turns sound on
 * (browsers require a user gesture), and it's suspended while the tab is hidden.
 */

const STORAGE_KEY = 'heliocentric:sound'
const MASTER_LEVEL = 0.55

let ctx: AudioContext | null = null
let master: GainNode | null = null
let padFilter: BiquadFilterNode | null = null
let padBus: GainNode | null = null
let reverbSend: GainNode | null = null
let enabled = false
const listeners = new Set<(on: boolean) => void>()

export const isSoundOn = () => enabled

export function onSoundChange(fn: (on: boolean) => void) {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

/** Remembered preference (only ever "on" after the viewer chose it). */
export function soundPreferred() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

export async function setSound(on: boolean) {
  enabled = on
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    /* storage unavailable: preference just isn't remembered */
  }
  if (on) {
    build()
    await ctx!.resume()
    const t = ctx!.currentTime
    master!.gain.cancelScheduledValues(t)
    master!.gain.setTargetAtTime(MASTER_LEVEL, t, 1.2) // slow fade in
  } else if (ctx && master) {
    const t = ctx.currentTime
    master.gain.cancelScheduledValues(t)
    master.gain.setTargetAtTime(0, t, 0.35)
    window.setTimeout(() => !enabled && ctx?.suspend(), 1500)
  }
  listeners.forEach((fn) => fn(on))
}

/** 0 = the Sun, 1 = beyond Neptune. Darkens and lowers the pad with distance. */
export function setDepth(depth: number) {
  if (!ctx || !padFilter || !padBus || !enabled) return
  const t = ctx.currentTime
  padFilter.frequency.setTargetAtTime(900 - depth * 620, t, 1.5)
  padBus.gain.setTargetAtTime(0.9 - depth * 0.25, t, 1.5)
}

/** Soft high chime, for hovering a moon. */
let lastHover = 0
export function cueHover() {
  if (!ctx || !enabled) return
  // Sweeping across a list shouldn't become a xylophone.
  const now = performance.now()
  if (now - lastHover < 180) return
  lastHover = now
  chime(1318.5, 0.035, 0.9) // E6
}

/** A soft toy "boop" — a quick pitch drop. `pitch` 1 = default; planets use their own. */
export function cueBoop(pitch = 1) {
  if (!ctx || !enabled) return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(520 * pitch, t)
  osc.frequency.exponentialRampToValueAtTime(260 * pitch, t + 0.18)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.07, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
  osc.connect(g)
  g.connect(master!)
  osc.start(t)
  osc.stop(t + 0.4)
}

/** A rising whoosh, for the rocket taking off. */
export function cueWhoosh() {
  if (!ctx || !enabled) return
  const t = ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, 1.2)
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.Q.value = 1.4
  band.frequency.setValueAtTime(300, t)
  band.frequency.exponentialRampToValueAtTime(2400, t + 0.9)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.05, t + 0.15)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1)
  src.connect(band).connect(g)
  g.connect(master!)
  g.connect(reverbSend!)
  src.start(t)
  src.stop(t + 1.2)
}

/** A gentle two-note swell, for opening a project. */
export function cueOpen() {
  if (!ctx || !enabled) return
  chime(659.25, 0.05, 2.2) // E5
  window.setTimeout(() => chime(987.77, 0.04, 2.4), 90) // B5
}

// ── graph ──────────────────────────────────────────────────────────────────

function build() {
  if (ctx) return
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  // Reverb: a convolver fed with a generated, exponentially decaying noise burst.
  const reverb = ctx.createConvolver()
  reverb.buffer = impulse(ctx, 5.5, 2.4)
  reverbSend = ctx.createGain()
  reverbSend.gain.value = 0.6
  reverbSend.connect(reverb).connect(master)

  // Pad: open A chord (A1, E2, A2, E3, C#4 faint), each voice two slightly detuned oscillators.
  padFilter = ctx.createBiquadFilter()
  padFilter.type = 'lowpass'
  padFilter.frequency.value = 900
  padFilter.Q.value = 0.7
  padBus = ctx.createGain()
  padBus.gain.value = 0.9
  padFilter.connect(padBus)
  padBus.connect(master)
  padBus.connect(reverbSend)

  const voices: [number, number, OscillatorType][] = [
    [55, 0.05, 'sine'],
    [82.41, 0.035, 'triangle'],
    [110, 0.03, 'sine'],
    [164.81, 0.018, 'triangle'],
    [277.18, 0.006, 'sine'],
  ]
  for (const [freq, level, type] of voices) {
    for (const detune of [-6, 7]) {
      const osc = ctx.createOscillator()
      osc.type = type
      osc.frequency.value = freq
      osc.detune.value = detune
      const g = ctx.createGain()
      g.gain.value = level
      // Each voice breathes at its own slow rate.
      lfo(g.gain, 0.03 + Math.random() * 0.05, level * 0.45)
      osc.connect(g).connect(padFilter)
      osc.start()
    }
  }
  // The filter itself drifts very slowly, like light across a nebula.
  lfo(padFilter.frequency, 0.02, 220)

  // Shimmer: band-passed noise with a slow swell.
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer(ctx, 4)
  noise.loop = true
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 3200
  band.Q.value = 0.8
  const shimmer = ctx.createGain()
  shimmer.gain.value = 0.006
  lfo(shimmer.gain, 0.045, 0.005)
  noise.connect(band).connect(shimmer)
  shimmer.connect(reverbSend)
  noise.start()

  // Don't play to an empty room.
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) ctx.suspend()
    else if (enabled) ctx.resume()
  })
}

function lfo(param: AudioParam, rate: number, depth: number) {
  const osc = ctx!.createOscillator()
  osc.frequency.value = rate
  const amt = ctx!.createGain()
  amt.gain.value = depth
  osc.connect(amt).connect(param)
  osc.start()
}

function chime(freq: number, level: number, decay: number) {
  const t = ctx!.currentTime
  const osc = ctx!.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = freq
  const g = ctx!.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(level, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  osc.connect(g)
  g.connect(master!)
  g.connect(reverbSend!)
  osc.start(t)
  osc.stop(t + decay + 0.1)
}

function noiseBuffer(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function impulse(c: AudioContext, seconds: number, decay: number) {
  const len = c.sampleRate * seconds
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}
