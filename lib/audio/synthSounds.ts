/**
 * synthSounds — GoT-flavored procedural SFX engine.
 *
 * Replaces the cheap beeps from the old GOTSoundManager with
 * layered, cinematic Web Audio synthesis grounded in the actual
 * Ramin Djawadi instrumentation palette:
 *   - cello-driven minor melodies (no flutes, no solo vocals)
 *   - brass horns for war moments
 *   - piano + organ + boys'-choir-ish swells for ceremony
 *   - C minor tonal center with VI/VII modal shifts
 *
 * Every routine is pure-function over an AudioContext + output
 * GainNode. The caller owns the ctx and the master gain (so the
 * existing AmbientAudioStore mute/volume gates still apply).
 *
 * No file I/O. No throws. All envelopes use exponentialRampToValue
 * with a 0.001 floor to avoid the "click on stop" Web Audio
 * gotcha.
 */

export type SoundEvent =
  | 'dragon_roar'
  | 'sword_clash'
  | 'horn_battle'
  | 'coin_drop'
  | 'chains'
  | 'ravens_wings'
  | 'triumph_fanfare'
  | 'fire_crackle'
  | 'throne_settle'
  | 'scroll_open'

// ============================================================
// Helpers
// ============================================================

/** Make a buffer of band-limited white noise (mono). */
function makeNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

/** Schedule an ADSR-ish envelope onto a GainNode parameter. */
function envelope(
  param: AudioParam,
  startTime: number,
  attack: number,
  decay: number,
  sustainLevel: number,
  release: number,
  peak = 1,
) {
  param.setValueAtTime(0.0001, startTime)
  param.exponentialRampToValueAtTime(peak, startTime + attack)
  param.exponentialRampToValueAtTime(
    Math.max(0.0001, sustainLevel),
    startTime + attack + decay,
  )
  param.exponentialRampToValueAtTime(0.0001, startTime + attack + decay + release)
}

/** Build a soft-knee waveshaper curve for warm saturation. */
function makeSaturationCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 1024
  const buf = new ArrayBuffer(samples * Float32Array.BYTES_PER_ELEMENT)
  const curve = new Float32Array(buf)
  const k = amount
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x))
  }
  return curve
}

/** Connect: source → filter → gain → out. Returns the gain. */
function tone(
  ctx: AudioContext,
  out: AudioNode,
  type: OscillatorType,
  freq: number,
  start: number,
  stop: number,
  filterFreq?: number,
  filterQ = 0.7,
): { osc: OscillatorNode; gain: GainNode } {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)

  let node: AudioNode = osc
  if (filterFreq !== undefined) {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(filterFreq, start)
    filter.Q.value = filterQ
    osc.connect(filter)
    node = filter
  }
  node.connect(gain)
  gain.connect(out)
  gain.gain.value = 0
  osc.start(start)
  osc.stop(stop)
  return { osc, gain }
}

// ============================================================
// Individual sound designs
// ============================================================

/**
 * horn_battle — A war horn call.
 * Multiple detuned brass voices, formant lowpass, slow attack,
 * a held tone with subtle vibrato, then a fall. Inspired by the
 * GoT main theme's opening horn statement.
 */
function hornBattle(ctx: AudioContext, out: AudioNode, volume: number) {
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = volume
  master.connect(out)

  // Formant filter chain — gives the breathy brass character
  const formant = ctx.createBiquadFilter()
  formant.type = 'lowpass'
  formant.frequency.setValueAtTime(900, now)
  formant.frequency.linearRampToValueAtTime(1600, now + 0.35)
  formant.frequency.linearRampToValueAtTime(700, now + 1.2)
  formant.Q.value = 4
  formant.connect(master)

  // Soft saturation for brass body
  const saturator = ctx.createWaveShaper()
  saturator.curve = makeSaturationCurve(2.5)
  saturator.connect(formant)

  // Layered brass voices: root, +5th, +octave (detuned)
  const root = 146.83 // D3 — a classic war-horn call note
  const stack = [
    { f: root, type: 'sawtooth' as OscillatorType, gain: 0.42, detune: -4 },
    { f: root, type: 'sawtooth' as OscillatorType, gain: 0.42, detune: +4 },
    { f: root * 1.5, type: 'sawtooth' as OscillatorType, gain: 0.25, detune: 0 }, // perfect 5th
    { f: root * 2, type: 'square' as OscillatorType, gain: 0.12, detune: 0 }, // body
  ]

  const dur = 1.45
  for (const v of stack) {
    const o = ctx.createOscillator()
    o.type = v.type
    o.frequency.setValueAtTime(v.f, now)
    o.detune.value = v.detune
    // Pitch fall at the end
    o.frequency.setValueAtTime(v.f, now + 0.95)
    o.frequency.exponentialRampToValueAtTime(v.f * 0.85, now + dur)

    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(v.gain, now + 0.12)
    g.gain.setValueAtTime(v.gain, now + 0.9)
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur)

    // Slow vibrato via LFO into detune
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 5.5
    lfoGain.gain.value = 8
    lfo.connect(lfoGain).connect(o.detune)
    lfo.start(now)
    lfo.stop(now + dur)

    o.connect(g).connect(saturator)
    o.start(now)
    o.stop(now + dur + 0.05)
  }
}

/**
 * sword_clash — A bright steel-on-steel clash.
 * Sharp transient + bandpassed noise burst + ringing high tone
 * that decays over 600ms (the metallic sustain).
 */
function swordClash(ctx: AudioContext, out: AudioNode, volume: number) {
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = volume
  master.connect(out)

  // 1) Transient — quick noise burst through high bandpass
  const noise = ctx.createBufferSource()
  noise.buffer = makeNoiseBuffer(ctx, 0.25)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.setValueAtTime(3200, now)
  bp.frequency.exponentialRampToValueAtTime(1800, now + 0.2)
  bp.Q.value = 2.5
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(0.7, now)
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
  noise.connect(bp).connect(ng).connect(master)
  noise.start(now)

  // 2) Ringing metallic partials — three sine tones inharmonically
  //    related (steel has anharmonic modes)
  const partials = [2400, 3300, 4700]
  for (const f of partials) {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    // Slight downward pitch drift = realistic steel ring
    o.frequency.exponentialRampToValueAtTime(f * 0.97, now + 0.5)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.18, now + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
    o.connect(g).connect(master)
    o.start(now)
    o.stop(now + 0.6)
  }
}

/**
 * dragon_roar — A guttural roar.
 * Two detuned sawtooths an octave apart, slow downward pitch
 * sweep, formant filter sweep, heavy waveshaper saturation. Tail
 * fades over ~1.6s.
 */
function dragonRoar(ctx: AudioContext, out: AudioNode, volume: number) {
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = volume
  master.connect(out)

  // Heavy saturation → growl
  const shaper = ctx.createWaveShaper()
  shaper.curve = makeSaturationCurve(15)
  shaper.connect(master)

  // Moving formant filter
  const formant = ctx.createBiquadFilter()
  formant.type = 'lowpass'
  formant.frequency.setValueAtTime(1400, now)
  formant.frequency.exponentialRampToValueAtTime(450, now + 1.4)
  formant.Q.value = 6
  formant.connect(shaper)

  // Two low sawtooths, octave apart, detuned
  const root = 72 // ~D2
  const voices = [
    { f: root, detune: -6 },
    { f: root, detune: +6 },
    { f: root * 2, detune: -3 },
  ]
  const dur = 1.6
  for (const v of voices) {
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(v.f, now)
    o.frequency.exponentialRampToValueAtTime(v.f * 0.72, now + dur * 0.95)
    o.detune.value = v.detune
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.4, now + 0.08)
    g.gain.setValueAtTime(0.4, now + 0.9)
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
    o.connect(g).connect(formant)
    o.start(now)
    o.stop(now + dur + 0.05)
  }

  // Sub-rumble layer (filtered noise) for body
  const noise = ctx.createBufferSource()
  noise.buffer = makeNoiseBuffer(ctx, dur)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 180
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(0.0001, now)
  ng.gain.exponentialRampToValueAtTime(0.55, now + 0.15)
  ng.gain.exponentialRampToValueAtTime(0.0001, now + dur)
  noise.connect(lp).connect(ng).connect(master)
  noise.start(now)
}

/**
 * coin_drop — Bell-like FM ping with metallic shimmer.
 * Two-operator FM (carrier + modulator), sharp attack, long
 * exponential decay. Inharmonic ratio gives metallic timbre.
 */
function coinDrop(ctx: AudioContext, out: AudioNode, volume: number) {
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = volume
  master.connect(out)

  // FM operator pair
  const carrier = ctx.createOscillator()
  const mod = ctx.createOscillator()
  const modGain = ctx.createGain()
  carrier.type = 'sine'
  mod.type = 'sine'
  carrier.frequency.value = 880 // A5 — coin ping
  mod.frequency.value = 880 * 2.76 // inharmonic ratio → bell
  modGain.gain.setValueAtTime(900, now)
  modGain.gain.exponentialRampToValueAtTime(20, now + 0.6)
  mod.connect(modGain).connect(carrier.frequency)

  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(0.6, now + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.85)
  carrier.connect(g).connect(master)

  carrier.start(now)
  mod.start(now)
  carrier.stop(now + 0.9)
  mod.stop(now + 0.9)

  // Shimmer — high partial
  const shimmer = ctx.createOscillator()
  shimmer.type = 'sine'
  shimmer.frequency.value = 2640
  const sg = ctx.createGain()
  sg.gain.setValueAtTime(0.0001, now)
  sg.gain.exponentialRampToValueAtTime(0.15, now + 0.005)
  sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
  shimmer.connect(sg).connect(master)
  shimmer.start(now)
  shimmer.stop(now + 0.45)
}

/**
 * chains — Multiple metallic ping bursts, irregular timing.
 * Each ping is a short high-passed noise blip + thin sine.
 */
function chains(ctx: AudioContext, out: AudioNode, volume: number) {
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = volume
  master.connect(out)

  // Six metallic pings within ~0.7s
  const times = [0, 0.08, 0.19, 0.27, 0.42, 0.55, 0.62]
  for (const offset of times) {
    const t = now + offset
    // Noise blip
    const noise = ctx.createBufferSource()
    noise.buffer = makeNoiseBuffer(ctx, 0.08)
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 2000 + Math.random() * 1500
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.35, t)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
    noise.connect(hp).connect(ng).connect(master)
    noise.start(t)

    // Inharmonic sine ring
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = 1800 + Math.random() * 1200
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.003)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
    o.connect(g).connect(master)
    o.start(t)
    o.stop(t + 0.2)
  }
}

/**
 * ravens_wings — Wing-flap whoosh with deep flutter.
 * Filtered noise modulated by a 7-Hz LFO (wing-beat rate),
 * with a low rumble for body.
 */
function ravensWings(ctx: AudioContext, out: AudioNode, volume: number) {
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = volume
  master.connect(out)

  const dur = 0.85

  // Noise body — band-passed, modulated
  const noise = ctx.createBufferSource()
  noise.buffer = makeNoiseBuffer(ctx, dur)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 700
  bp.Q.value = 1.5
  const flap = ctx.createGain()
  flap.gain.value = 0
  noise.connect(bp).connect(flap).connect(master)

  // Wing-beat LFO — sharp triangle wave creates flap-flap-flap
  const lfo = ctx.createOscillator()
  lfo.type = 'triangle'
  lfo.frequency.value = 7
  const lfoDepth = ctx.createGain()
  lfoDepth.gain.value = 0.32
  lfo.connect(lfoDepth).connect(flap.gain)
  // Bias so the LFO swings between ~0 and 0.5
  const bias = ctx.createConstantSource()
  bias.offset.value = 0.3
  bias.connect(flap.gain)
  bias.start(now)
  bias.stop(now + dur)
  // Envelope over the whole sound
  const envG = ctx.createGain()
  envG.gain.setValueAtTime(0.0001, now)
  envG.gain.exponentialRampToValueAtTime(0.7, now + 0.08)
  envG.gain.setValueAtTime(0.7, now + dur - 0.25)
  envG.gain.exponentialRampToValueAtTime(0.0001, now + dur)
  flap.connect(envG).connect(master)

  lfo.start(now)
  lfo.stop(now + dur)
  noise.start(now)

  // Low rumble — sub presence
  const rumble = ctx.createBufferSource()
  rumble.buffer = makeNoiseBuffer(ctx, dur)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 140
  const rg = ctx.createGain()
  rg.gain.setValueAtTime(0.0001, now)
  rg.gain.exponentialRampToValueAtTime(0.25, now + 0.1)
  rg.gain.exponentialRampToValueAtTime(0.0001, now + dur)
  rumble.connect(lp).connect(rg).connect(master)
  rumble.start(now)
}

/**
 * triumph_fanfare — A C-minor → Eb-major ceremonial flourish.
 * Three brass-stacked voices, modal progression matching the
 * GoT minor↔major flip Djawadi described in interviews.
 */
function triumphFanfare(ctx: AudioContext, out: AudioNode, volume: number) {
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = volume
  master.connect(out)

  // Brass body
  const formant = ctx.createBiquadFilter()
  formant.type = 'lowpass'
  formant.frequency.value = 2200
  formant.Q.value = 1.5
  const sat = ctx.createWaveShaper()
  sat.curve = makeSaturationCurve(3)
  sat.connect(formant)
  formant.connect(master)

  // Stepwise notes: C → Eb → G → C (C minor triad → tonic high)
  // Frequencies: C4 261.63, Eb4 311.13, G4 392.00, C5 523.25
  // Then a held Eb-major chord (Eb-G-Bb): 311.13, 392, 466.16
  const sequence = [
    { freqs: [130.81], time: 0.0, dur: 0.18, gain: 0.32 }, // C2 bass kick
    { freqs: [261.63], time: 0.0, dur: 0.18, gain: 0.34 },
    { freqs: [311.13], time: 0.18, dur: 0.18, gain: 0.34 },
    { freqs: [392.0], time: 0.36, dur: 0.18, gain: 0.34 },
    { freqs: [523.25], time: 0.54, dur: 0.22, gain: 0.36 },
    // Sustained Eb-major chord with low octave
    { freqs: [155.56, 311.13, 392.0, 466.16], time: 0.78, dur: 0.95, gain: 0.28 },
  ]
  for (const step of sequence) {
    for (const f of step.freqs) {
      // Stacked detuned saw + triangle per note (brass-like)
      const layers: { type: OscillatorType; detune: number; mul: number }[] = [
        { type: 'sawtooth', detune: -5, mul: 1 },
        { type: 'sawtooth', detune: +5, mul: 1 },
        { type: 'triangle', detune: 0, mul: 0.6 },
      ]
      for (const layer of layers) {
        const o = ctx.createOscillator()
        o.type = layer.type
        o.frequency.value = f
        o.detune.value = layer.detune
        const g = ctx.createGain()
        const t0 = now + step.time
        g.gain.setValueAtTime(0.0001, t0)
        g.gain.exponentialRampToValueAtTime(step.gain * layer.mul, t0 + 0.04)
        g.gain.setValueAtTime(step.gain * layer.mul, t0 + step.dur - 0.05)
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + step.dur)
        o.connect(g).connect(sat)
        o.start(t0)
        o.stop(t0 + step.dur + 0.05)
      }
    }
  }
}

/**
 * fire_crackle — Sparse high-frequency pops over a low rumble bed.
 */
function fireCrackle(ctx: AudioContext, out: AudioNode, volume: number) {
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = volume
  master.connect(out)

  // Bed: low filtered noise
  const dur = 0.9
  const bed = ctx.createBufferSource()
  bed.buffer = makeNoiseBuffer(ctx, dur)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 280
  const bg = ctx.createGain()
  bg.gain.setValueAtTime(0.0001, now)
  bg.gain.exponentialRampToValueAtTime(0.18, now + 0.1)
  bg.gain.exponentialRampToValueAtTime(0.0001, now + dur)
  bed.connect(lp).connect(bg).connect(master)
  bed.start(now)

  // Pops — random tiny high-freq blips
  const popCount = 14
  for (let i = 0; i < popCount; i++) {
    const t = now + Math.random() * dur
    const pop = ctx.createBufferSource()
    pop.buffer = makeNoiseBuffer(ctx, 0.03)
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 3500 + Math.random() * 2000
    const pg = ctx.createGain()
    pg.gain.setValueAtTime(0.15 + Math.random() * 0.2, t)
    pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)
    pop.connect(hp).connect(pg).connect(master)
    pop.start(t)
  }
}

/**
 * throne_settle — A heavy, dignified low thud + stone-on-stone
 * scrape tail. For confirming a selection / closing a panel.
 */
function throneSettle(ctx: AudioContext, out: AudioNode, volume: number) {
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = volume
  master.connect(out)

  // Sub-thud — low sine with very fast pitch drop
  const thud = ctx.createOscillator()
  thud.type = 'sine'
  thud.frequency.setValueAtTime(110, now)
  thud.frequency.exponentialRampToValueAtTime(45, now + 0.18)
  const tg = ctx.createGain()
  tg.gain.setValueAtTime(0.0001, now)
  tg.gain.exponentialRampToValueAtTime(0.55, now + 0.01)
  tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
  thud.connect(tg).connect(master)
  thud.start(now)
  thud.stop(now + 0.45)

  // Scrape tail — band-passed noise sweep
  const scrape = ctx.createBufferSource()
  scrape.buffer = makeNoiseBuffer(ctx, 0.45)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.setValueAtTime(450, now)
  bp.frequency.linearRampToValueAtTime(280, now + 0.4)
  bp.Q.value = 3
  const sg = ctx.createGain()
  sg.gain.setValueAtTime(0.0001, now + 0.05)
  sg.gain.exponentialRampToValueAtTime(0.22, now + 0.12)
  sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
  scrape.connect(bp).connect(sg).connect(master)
  scrape.start(now)
}

/**
 * scroll_open — Parchment crinkle.
 * Narrow-band noise modulated by a fast envelope train, giving
 * the crackling, dry-paper sound.
 */
function scrollOpen(ctx: AudioContext, out: AudioNode, volume: number) {
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = volume
  master.connect(out)

  const dur = 0.5
  const noise = ctx.createBufferSource()
  noise.buffer = makeNoiseBuffer(ctx, dur)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 4500
  bp.Q.value = 1.2
  const g = ctx.createGain()
  // Multiple small bursts within 0.5s — a "rustle"
  const bursts = [0.0, 0.07, 0.14, 0.22, 0.31, 0.39]
  g.gain.setValueAtTime(0.0001, now)
  for (const b of bursts) {
    g.gain.setValueAtTime(0.0001, now + b)
    g.gain.exponentialRampToValueAtTime(0.32, now + b + 0.008)
    g.gain.exponentialRampToValueAtTime(0.04, now + b + 0.06)
  }
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
  noise.connect(bp).connect(g).connect(master)
  noise.start(now)
}

// ============================================================
// Public entry point
// ============================================================

const ROUTERS: Record<
  SoundEvent,
  (ctx: AudioContext, out: AudioNode, vol: number) => void
> = {
  horn_battle: hornBattle,
  sword_clash: swordClash,
  dragon_roar: dragonRoar,
  coin_drop: coinDrop,
  chains: chains,
  ravens_wings: ravensWings,
  triumph_fanfare: triumphFanfare,
  fire_crackle: fireCrackle,
  throne_settle: throneSettle,
  scroll_open: scrollOpen,
}

/** Play the GoT-flavored synthesized version of a sound event. */
export function playSynthSound(
  ctx: AudioContext,
  destination: AudioNode,
  event: SoundEvent,
  volume = 0.6,
) {
  const router = ROUTERS[event]
  if (!router) return
  try {
    router(ctx, destination, Math.max(0, Math.min(1, volume)))
  } catch {
    // Web Audio sometimes rejects scheduling on closed/suspended ctx — fail soft.
  }
}

// Re-export envelope helper for tests / advanced callers.
export { envelope }
