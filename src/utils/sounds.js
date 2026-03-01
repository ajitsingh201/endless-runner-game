let _ctx = null

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return _ctx
}

// Call once on first user gesture so AudioContext is allowed to play
export function resumeAudio() {
  try {
    const c = getCtx()
    if (c.state === 'suspended') c.resume()
  } catch (_) {}
}

// Bright rising chirp — classic coin pickup
export function playCoinSound() {
  try {
    const c = getCtx()
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime

    // Main rising tone
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.11)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.22, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
    osc.start(now)
    osc.stop(now + 0.2)

    // Sparkle overtone
    const osc2 = c.createOscillator()
    const gain2 = c.createGain()
    osc2.connect(gain2)
    gain2.connect(c.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1200, now)
    osc2.frequency.exponentialRampToValueAtTime(2800, now + 0.11)
    gain2.gain.setValueAtTime(0, now)
    gain2.gain.linearRampToValueAtTime(0.09, now + 0.01)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
    osc2.start(now)
    osc2.stop(now + 0.16)
  } catch (_) {}
}

// Low boom + noise burst + crackle — obstacle crash
export function playImpactSound() {
  try {
    const c = getCtx()
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    const dur = 0.45

    // === Noise burst ===
    const bufLen = Math.floor(c.sampleRate * dur)
    const buf = c.createBuffer(1, bufLen, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

    const noise = c.createBufferSource()
    noise.buffer = buf
    const noiseFilter = c.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 900
    noiseFilter.Q.value = 0.7
    const noiseGain = c.createGain()
    noiseGain.gain.setValueAtTime(0.35, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur)
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(c.destination)
    noise.start(now)

    // === Low pitch drop (boom) ===
    const boom = c.createOscillator()
    const boomGain = c.createGain()
    boom.connect(boomGain)
    boomGain.connect(c.destination)
    boom.type = 'sine'
    boom.frequency.setValueAtTime(160, now)
    boom.frequency.exponentialRampToValueAtTime(22, now + 0.38)
    boomGain.gain.setValueAtTime(0.5, now)
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38)
    boom.start(now)
    boom.stop(now + 0.4)

    // === High crackle (square wave) ===
    const crack = c.createOscillator()
    const crackGain = c.createGain()
    crack.connect(crackGain)
    crackGain.connect(c.destination)
    crack.type = 'square'
    crack.frequency.setValueAtTime(200, now)
    crack.frequency.exponentialRampToValueAtTime(50, now + 0.14)
    crackGain.gain.setValueAtTime(0.12, now)
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
    crack.start(now)
    crack.stop(now + 0.16)
  } catch (_) {}
}
