// Background music engine — procedural chiptune via Web Audio API
// 32-step (2-bar) loop with bass, lead, kick, snare, hi-hat

let _ctx = null
let _masterGain = null
let _isPlaying = false
let _timerId = null
let _nextTime = 0
let _step = 0
let _bpm = 130

const STEPS = 32
const LOOKAHEAD = 0.15   // schedule this far ahead (seconds)
const INTERVAL  = 75     // scheduler poll interval (ms)

// ── Frequencies ──────────────────────────────────────────────────────────────
const N = {
  E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00,
  C3: 130.81, E3: 164.81, G3: 196.00, A3: 220.00,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
}

// ── Patterns (null = rest) ────────────────────────────────────────────────────
// Bar 1: Am feel
// Bar 2: F → G resolve
const BASS = [
  N.A2,  null, N.A2,  null,  N.C3,  null,  null,  null,
  N.A2,  null, N.G2,  null,  null,  null,  N.E2,  null,
  N.F2,  null, N.F2,  null,  N.C3,  null,  null,  null,
  N.G2,  null, N.G2,  null,  N.E3,  null,  null,  null,
]

const LEAD = [
  N.E5,  null, null,  null,  N.G5,  null,  N.A5,  null,
  N.G5,  null, N.E5,  null,  N.C5,  N.D5,  N.E5,  null,
  N.F5,  null, N.A5,  null,  null,  null,  N.G5,  null,
  N.E5,  null, N.D5,  null,  N.E5,  null,  N.G5,  null,
]

// ── Audio context ─────────────────────────────────────────────────────────────
function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  return _ctx
}

function stepDur() { return (60 / _bpm) / 4 }  // 16th-note duration

// ── Instrument helpers ────────────────────────────────────────────────────────
function playBass(freq, when, dur) {
  const c = getCtx()
  const osc  = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain);  gain.connect(_masterGain)
  osc.type = 'sawtooth'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, when)
  gain.gain.linearRampToValueAtTime(0.20, when + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, when + dur * 0.85)
  osc.start(when);  osc.stop(when + dur)
}

function playLead(freq, when, dur) {
  const c = getCtx()
  // Two oscillators detuned slightly for a fuller chiptune sound
  for (const detune of [-6, 6]) {
    const osc  = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain);  gain.connect(_masterGain)
    osc.type = 'square'
    osc.frequency.value = freq
    osc.detune.value = detune
    gain.gain.setValueAtTime(0, when)
    gain.gain.linearRampToValueAtTime(0.038, when + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur * 0.65)
    osc.start(when);  osc.stop(when + dur)
  }
}

function playKick(when) {
  const c = getCtx()
  const osc  = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain);  gain.connect(_masterGain)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(145, when)
  osc.frequency.exponentialRampToValueAtTime(22, when + 0.13)
  gain.gain.setValueAtTime(0.5, when)
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.15)
  osc.start(when);  osc.stop(when + 0.18)
}

function playSnare(when) {
  const c = getCtx()
  // Noise body
  const len = Math.floor(c.sampleRate * 0.1)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d   = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src  = c.createBufferSource()
  src.buffer = buf
  const filt = c.createBiquadFilter()
  filt.type  = 'bandpass';  filt.frequency.value = 2200;  filt.Q.value = 0.7
  const ng   = c.createGain()
  ng.gain.setValueAtTime(0.18, when)
  ng.gain.exponentialRampToValueAtTime(0.001, when + 0.09)
  src.connect(filt);  filt.connect(ng);  ng.connect(_masterGain)
  src.start(when)
  // Tonal punch
  const osc = c.createOscillator()
  const og  = c.createGain()
  osc.connect(og);  og.connect(_masterGain)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(210, when)
  osc.frequency.exponentialRampToValueAtTime(105, when + 0.07)
  og.gain.setValueAtTime(0.12, when)
  og.gain.exponentialRampToValueAtTime(0.001, when + 0.07)
  osc.start(when);  osc.stop(when + 0.08)
}

function playHihat(when, open) {
  const c   = getCtx()
  const dur = open ? 0.055 : 0.022
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d   = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src  = c.createBufferSource()
  src.buffer = buf
  const filt = c.createBiquadFilter()
  filt.type  = 'highpass';  filt.frequency.value = 7500
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.065, when)
  gain.gain.exponentialRampToValueAtTime(0.001, when + dur)
  src.connect(filt);  filt.connect(gain);  gain.connect(_masterGain)
  src.start(when)
}

// ── Step sequencer ────────────────────────────────────────────────────────────
function scheduleStep(s, when) {
  const dur = stepDur()

  // Drums: kick=beats 1&3 (s 0,16), snare=beats 2&4 (s 8,24), hihat=8th notes
  if (s === 0 || s === 16)           playKick(when)
  if (s === 8 || s === 24)           playSnare(when)
  if (s % 2 === 0)                   playHihat(when, s % 4 === 2)

  // Bass: longer sustain so notes blur into a groove
  const bf = BASS[s]
  if (bf) playBass(bf, when, dur * 1.9)

  // Lead melody
  const lf = LEAD[s]
  if (lf) playLead(lf, when, dur * 1.5)
}

function tick() {
  if (!_isPlaying || !_ctx) return
  while (_nextTime < _ctx.currentTime + LOOKAHEAD) {
    scheduleStep(_step, _nextTime)
    _nextTime += stepDur()
    _step = (_step + 1) % STEPS
  }
  _timerId = setTimeout(tick, INTERVAL)
}

// ── Public API ────────────────────────────────────────────────────────────────
export function startMusic() {
  try {
    const c = getCtx()
    if (c.state === 'suspended') c.resume()
    if (_isPlaying) stopMusic()

    _masterGain = c.createGain()
    _masterGain.gain.setValueAtTime(0, c.currentTime)
    _masterGain.gain.linearRampToValueAtTime(0.75, c.currentTime + 0.6)
    _masterGain.connect(c.destination)

    _isPlaying  = true
    _step       = 0
    _nextTime   = c.currentTime + 0.08

    tick()
  } catch (_) {}
}

export function stopMusic() {
  try {
    _isPlaying = false
    clearTimeout(_timerId)
    _timerId   = null

    if (_masterGain && _ctx) {
      const mg  = _masterGain
      _masterGain = null                         // clear ref immediately
      const now = _ctx.currentTime
      mg.gain.setValueAtTime(mg.gain.value, now)
      mg.gain.linearRampToValueAtTime(0, now + 0.3)
      setTimeout(() => { try { mg.disconnect() } catch (_) {} }, 400)
    }
  } catch (_) {}
}

// Call this when game speed increases to keep music in sync
export function setMusicBPM(bpm) {
  _bpm = Math.max(80, Math.min(210, bpm))
}
