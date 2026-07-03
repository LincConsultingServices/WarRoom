/**
 * proceduralAmbient — generative GoT-flavored ambient music engine.
 *
 * Built so the war room can always have rich atmosphere even when
 * no MP3 files are on disk. Inspired directly by the Djawadi palette:
 *   - cello-led minor melodies (no flutes, no solo vocals)
 *   - organ + boys'-choir-style pad swells (a la "Light of the Seven")
 *   - piano notes with long decays
 *   - C minor tonal center; sparing modal flips to Eb major (the
 *     famous "backstabbing" minor↔major shift)
 *
 * Each AmbientLayer is a self-contained Web Audio sub-graph.
 * Activating a scene = setting the per-layer target gains and a
 * tempo. Layers are NEVER torn down — they crossfade. The engine
 * runs a scheduler loop (lookahead) that places sparse notes on a
 * 12-second cycle.
 *
 * The engine is owned by AmbientAudioStore (single instance) and
 * is connected to that store's master gain — so the existing
 * mute/volume controls "just work" for the procedural layer too.
 */

// ============================================================
// Scene → mix
// ============================================================

export type ProceduralScene =
  | 'chessboard-lobby'
  | 'chessboard-active'
  | 'chessboard-deliberation'
  | 'verdict-ceremony'

interface SceneMix {
  /** Linear gain 0..1 per layer. */
  drone: number
  cello: number
  organ: number
  piano: number
  pulse: number
  /** Beats per minute for the slow pulse. */
  bpm: number
}

const SCENE_MIX: Record<ProceduralScene, SceneMix> = {
  'chessboard-lobby': {
    drone: 0.55,
    cello: 0.35,
    organ: 0.0,
    piano: 0.25,
    pulse: 0.0,
    bpm: 38,
  },
  'chessboard-active': {
    drone: 0.70,
    cello: 0.55,
    organ: 0.35,
    piano: 0.35,
    pulse: 0.30,
    bpm: 50,
  },
  'chessboard-deliberation': {
    drone: 0.65,
    cello: 0.65,
    organ: 0.55,
    piano: 0.45,
    pulse: 0.45,
    bpm: 56,
  },
  'verdict-ceremony': {
    drone: 0.55,
    cello: 0.45,
    organ: 0.75,
    piano: 0.50,
    pulse: 0.20,
    bpm: 42,
  },
}

// ============================================================
// Musical material — C natural minor
// ============================================================

// MIDI note → frequency
function mtof(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

// C natural minor scale degrees (one octave): C, D, Eb, F, G, Ab, Bb, C
// MIDI for C3..C4
const C_MINOR_SCALE_MIDI = [48, 50, 51, 53, 55, 56, 58, 60]

// A simple cello melody in C minor (relative degrees → MIDI)
// 8-bar phrase, lyrical, descending — the "lament" shape
const CELLO_PHRASE_MIDI: { note: number; beats: number }[] = [
  { note: 60, beats: 2 }, // C4
  { note: 58, beats: 1 }, // Bb3
  { note: 56, beats: 1 }, // Ab3
  { note: 55, beats: 3 }, // G3
  { note: 53, beats: 1 }, // F3
  { note: 51, beats: 2 }, // Eb3
  { note: 50, beats: 1 }, // D3
  { note: 48, beats: 3 }, // C3 — resolve
]

// Piano motif: two-note bell pattern, sparse (Light-of-the-Seven feel)
const PIANO_MOTIF_MIDI = [60, 63, 67, 72, 70, 67, 63, 60]

// Drone interval stack — C minor power chord with the m7 colour
const DRONE_MIDI_OFFSETS = [0, 7, 12, 19] // root, 5th, 8va, 5th above

// ============================================================
// Engine
// ============================================================

interface LayerHandles {
  drone: GainNode
  cello: GainNode
  organ: GainNode
  piano: GainNode
  pulse: GainNode
}

const FADE_TIME = 1.4 // seconds for crossfades between scenes

export class ProceduralAmbientEngine {
  private ctx: AudioContext
  private destination: AudioNode
  private master: GainNode
  private layers: LayerHandles
  private currentScene: ProceduralScene | null = null
  private cellosrc: OscillatorNode[] = []
  private droneOscs: OscillatorNode[] = []
  private droneLfos: OscillatorNode[] = []
  private organOscs: OscillatorNode[] = []
  private organLfo: OscillatorNode | null = null
  private pulseSrc: OscillatorNode | null = null
  private scheduler: number | null = null
  private nextEventTime = 0
  private phraseIndex = 0
  private pianoIndex = 0
  private running = false

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx
    this.destination = destination

    this.master = ctx.createGain()
    this.master.gain.value = 1
    this.master.connect(destination)

    // Build the long-lived layer gains. All sub-graphs feed into these.
    this.layers = {
      drone: ctx.createGain(),
      cello: ctx.createGain(),
      organ: ctx.createGain(),
      piano: ctx.createGain(),
      pulse: ctx.createGain(),
    }
    for (const g of Object.values(this.layers)) {
      g.gain.value = 0
      g.connect(this.master)
    }
  }

  // ──────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────

  setScene(scene: ProceduralScene | null): void {
    if (scene === this.currentScene) return
    this.currentScene = scene
    if (!scene) {
      this.fadeAllLayers(0)
      this.stopScheduler()
      return
    }
    this.ensureLayersStarted()
    const mix = SCENE_MIX[scene]
    const now = this.ctx.currentTime
    this.layers.drone.gain.cancelScheduledValues(now)
    this.layers.cello.gain.cancelScheduledValues(now)
    this.layers.organ.gain.cancelScheduledValues(now)
    this.layers.piano.gain.cancelScheduledValues(now)
    this.layers.pulse.gain.cancelScheduledValues(now)
    this.layers.drone.gain.setTargetAtTime(mix.drone * 0.5, now, FADE_TIME / 4)
    this.layers.cello.gain.setTargetAtTime(mix.cello * 0.4, now, FADE_TIME / 4)
    this.layers.organ.gain.setTargetAtTime(mix.organ * 0.32, now, FADE_TIME / 4)
    this.layers.piano.gain.setTargetAtTime(mix.piano * 0.35, now, FADE_TIME / 4)
    this.layers.pulse.gain.setTargetAtTime(mix.pulse * 0.28, now, FADE_TIME / 4)
    this.startScheduler(mix.bpm)
  }

  setMasterGain(value: number): void {
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, value)), now, 0.15)
  }

  destroy(): void {
    this.stopScheduler()
    this.fadeAllLayers(0)
    // Oscillators stop on their own (long live; they're scheduled forever).
    // For SPA lifecycle this engine lives for the page lifetime; no need
    // to teardown unless explicitly destroyed.
  }

  // ──────────────────────────────────────────────────────────
  // Internal — layer construction
  // ──────────────────────────────────────────────────────────

  private ensureLayersStarted(): void {
    if (this.running) return
    this.running = true
    this.buildDrone()
    this.buildOrganPad()
    this.buildPulse()
  }

  /** Cello-like drone: detuned sawtooths through lowpass with bow vibrato. */
  private buildDrone(): void {
    const now = this.ctx.currentTime
    const rootMidi = 36 // C2 — deep
    for (const off of DRONE_MIDI_OFFSETS) {
      const freq = mtof(rootMidi + off)

      // Two slightly detuned saws for ensemble width
      for (const detune of [-7, +7]) {
        const o = this.ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = freq
        o.detune.value = detune

        // Slow LFO into detune for bow-like wobble
        const lfo = this.ctx.createOscillator()
        const lfoG = this.ctx.createGain()
        lfo.type = 'sine'
        lfo.frequency.value = 0.18 + Math.random() * 0.15
        lfoG.gain.value = 3 + Math.random() * 2
        lfo.connect(lfoG).connect(o.detune)
        lfo.start(now)

        // Per-voice gain — quieter for upper octaves
        const vGain = this.ctx.createGain()
        vGain.gain.value = off === 0 ? 0.45 : off === 19 ? 0.12 : 0.22

        // Lowpass — keeps it cello-soft, not buzzy
        const lp = this.ctx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 850
        lp.Q.value = 1.2

        o.connect(lp).connect(vGain).connect(this.layers.drone)
        o.start(now)

        this.droneOscs.push(o)
        this.droneLfos.push(lfo)
      }
    }
  }

  /** Organ pad: stacked sines (additive) with a slow tremolo. */
  private buildOrganPad(): void {
    const now = this.ctx.currentTime
    const root = mtof(48) // C3
    // Pipe-organ-ish harmonic stack
    const partials = [
      { ratio: 1, gain: 0.35 },
      { ratio: 2, gain: 0.22 },
      { ratio: 3, gain: 0.12 },
      { ratio: 4, gain: 0.08 },
      // 5th overtone for color
      { ratio: 1.5, gain: 0.18 },
    ]
    const mix = this.ctx.createGain()
    mix.gain.value = 0.6
    mix.connect(this.layers.organ)

    for (const p of partials) {
      const o = this.ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = root * p.ratio
      const g = this.ctx.createGain()
      g.gain.value = p.gain
      o.connect(g).connect(mix)
      o.start(now)
      this.organOscs.push(o)
    }

    // Slow tremolo (LFO into master organ gain)
    const lfo = this.ctx.createOscillator()
    const lfoG = this.ctx.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = 0.14
    lfoG.gain.value = 0.18
    lfo.connect(lfoG).connect(mix.gain)
    lfo.start(now)
    this.organLfo = lfo
  }

  /** Sub pulse: very low triangle sub-bass with slow rhythm gating. */
  private buildPulse(): void {
    const now = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = mtof(24) // C1
    const g = this.ctx.createGain()
    g.gain.value = 0.18
    o.connect(g).connect(this.layers.pulse)
    o.start(now)
    this.pulseSrc = o
  }

  // ──────────────────────────────────────────────────────────
  // Internal — scheduler (places piano + cello notes ahead)
  // ──────────────────────────────────────────────────────────

  private startScheduler(bpm: number): void {
    this.stopScheduler()
    const beatSec = 60 / bpm
    this.nextEventTime = this.ctx.currentTime + 0.1

    const tick = () => {
      const lookahead = 0.5 // 500ms
      while (this.nextEventTime < this.ctx.currentTime + lookahead) {
        this.scheduleNextNote(beatSec)
      }
      this.scheduler = window.setTimeout(tick, 120)
    }
    tick()
  }

  private stopScheduler(): void {
    if (this.scheduler !== null) {
      window.clearTimeout(this.scheduler)
      this.scheduler = null
    }
  }

  private scheduleNextNote(beatSec: number): void {
    const t = this.nextEventTime
    // Schedule both a cello note and (sparsely) a piano note.
    const cellStep = CELLO_PHRASE_MIDI[this.phraseIndex % CELLO_PHRASE_MIDI.length]
    this.scheduleCelloNote(mtof(cellStep.note), t, cellStep.beats * beatSec * 0.95)
    // Piano every other cello note, slight offset (off the beat)
    if (this.phraseIndex % 2 === 1) {
      const noteMidi = PIANO_MOTIF_MIDI[this.pianoIndex % PIANO_MOTIF_MIDI.length]
      this.schedulePianoNote(mtof(noteMidi), t + beatSec * 0.5)
      this.pianoIndex++
    }
    this.nextEventTime += cellStep.beats * beatSec
    this.phraseIndex++
  }

  private scheduleCelloNote(freq: number, time: number, duration: number): void {
    const out = this.layers.cello

    // 3 detuned sawtooth layers through bandpass — gives the bow rasp
    const sum = this.ctx.createGain()
    sum.gain.value = 0
    sum.connect(out)

    for (const detune of [-6, 0, +6]) {
      const o = this.ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = freq
      o.detune.value = detune
      const bp = this.ctx.createBiquadFilter()
      bp.type = 'lowpass'
      bp.frequency.value = 1400
      bp.Q.value = 1.5
      o.connect(bp).connect(sum)
      o.start(time)
      o.stop(time + duration + 0.2)
    }

    // Slow attack (bow press), gentle release
    const attack = Math.min(0.55, duration * 0.45)
    const release = Math.min(0.6, duration * 0.5)
    sum.gain.setValueAtTime(0.0001, time)
    sum.gain.exponentialRampToValueAtTime(0.45, time + attack)
    sum.gain.setValueAtTime(0.45, time + duration - release)
    sum.gain.exponentialRampToValueAtTime(0.0001, time + duration)
  }

  private schedulePianoNote(freq: number, time: number): void {
    const out = this.layers.piano

    // Piano = sine fundamental + 2nd partial + slight 3rd, fast attack,
    // long exponential decay. Inharmonic detune on partials.
    const partials = [
      { ratio: 1.0, gain: 0.5, decay: 2.2 },
      { ratio: 2.0, gain: 0.18, decay: 1.4 },
      { ratio: 3.0, gain: 0.08, decay: 0.9 },
    ]
    for (const p of partials) {
      const o = this.ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = freq * p.ratio
      const g = this.ctx.createGain()
      g.gain.setValueAtTime(0.0001, time)
      g.gain.exponentialRampToValueAtTime(p.gain, time + 0.005)
      g.gain.exponentialRampToValueAtTime(0.0001, time + p.decay)
      o.connect(g).connect(out)
      o.start(time)
      o.stop(time + p.decay + 0.1)
    }
  }

  // ──────────────────────────────────────────────────────────
  // Fades
  // ──────────────────────────────────────────────────────────

  private fadeAllLayers(target: number): void {
    const now = this.ctx.currentTime
    for (const g of Object.values(this.layers)) {
      g.gain.cancelScheduledValues(now)
      g.gain.setTargetAtTime(target, now, FADE_TIME / 4)
    }
  }
}
