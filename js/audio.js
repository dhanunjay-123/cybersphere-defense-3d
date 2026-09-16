/* =========================================================
   audio.js
   CYBERSPHERE DEFENSE 3D — Procedural Web Audio Cyber SFX Engine
   Generates all sci-fi sound effects procedurally in-memory
   using the native HTML5 AudioContext. Zero external audio files.
   ========================================================= */

const AudioEngine = (() => {

  let ctx = null;
  let muted = false;
  let masterGain = null;

  function init() {
    if (ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
        masterGain.connect(ctx.destination);
      }
    } catch (e) {
      console.warn('[AudioEngine] Web Audio API not supported:', e);
    }
  }

  function ensureContext() {
    if (!ctx) init();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  // Soft high-tech digital chirp (data packet conduit flow)
  function playPacketChirp() {
    if (muted || !ctx) return;
    try {
      ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {}
  }

  // Ominous rising warble alarm (ransomware attack launched)
  function playAttackAlert() {
    if (muted || !ctx) return;
    try {
      ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const t0 = ctx.currentTime;
      osc.frequency.setValueAtTime(220, t0);
      osc.frequency.linearRampToValueAtTime(540, t0 + 0.25);
      osc.frequency.linearRampToValueAtTime(320, t0 + 0.5);
      osc.frequency.linearRampToValueAtTime(680, t0 + 0.75);

      gain.gain.setValueAtTime(0.15, t0);
      gain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.9);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(t0 + 0.9);
    } catch (e) {}
  }

  // Crackling malicious laser zap / encryption sound
  function playLaserZap() {
    if (muted || !ctx) return;
    try {
      ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const t0 = ctx.currentTime;
      osc.frequency.setValueAtTime(800, t0);
      osc.frequency.exponentialRampToValueAtTime(110, t0 + 0.12);

      gain.gain.setValueAtTime(0.12, t0);
      gain.gain.exponentialRampToValueAtTime(0.005, t0 + 0.12);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(t0 + 0.13);
    } catch (e) {}
  }

  // Deep resonant EMP explosion bass drop (Decoy tripwire triggered!)
  function playEmpBlast() {
    if (muted || !ctx) return;
    try {
      ensureContext();
      const t0 = ctx.currentTime;

      // 1. Deep Sub-Bass Thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t0);
      osc.frequency.exponentialRampToValueAtTime(35, t0 + 0.8);

      gain.gain.setValueAtTime(0.35, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.85);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(t0 + 0.9);

      // 2. High-energy electric distortion noise
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t0);
      filter.frequency.exponentialRampToValueAtTime(200, t0 + 0.4);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, t0);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start();
      noise.stop(t0 + 0.42);
    } catch (e) {}
  }

  // Harmonic chord chime (quarantine containment successful)
  function playContainmentSuccess() {
    if (muted || !ctx) return;
    try {
      ensureContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.5);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.55);
      });
    } catch (e) {}
  }

  // Futuristic neural downlink warp chime (Decoy file materialization)
  function playDecoyDeploySound() {
    if (muted || !ctx) return;
    try {
      ensureContext();
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, t0);
      osc.frequency.exponentialRampToValueAtTime(1040, t0 + 0.35);

      gain.gain.setValueAtTime(0.12, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t0);
      osc.stop(t0 + 0.42);

      // Sub harmonic sparkle
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, t0 + 0.1);
      osc2.frequency.linearRampToValueAtTime(1760, t0 + 0.3);
      gain2.gain.setValueAtTime(0.06, t0 + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(t0 + 0.1);
      osc2.stop(t0 + 0.38);
    } catch (e) {}
  }

  // Crystalline resonance chime (EMP protective shield bubble wave)
  function playShieldBubbleSound() {
    if (muted || !ctx) return;
    try {
      ensureContext();
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1174.66, t0); // D6
      osc.frequency.exponentialRampToValueAtTime(1760, t0 + 0.25);

      gain.gain.setValueAtTime(0.09, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t0);
      osc.stop(t0 + 0.38);
    } catch (e) {}
  }

  // Low-frequency tactical threat ping (Lateral sector boundary alarm)
  function playSectorAlarmSound() {
    if (muted || !ctx) return;
    try {
      ensureContext();
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t0);
      osc.frequency.linearRampToValueAtTime(160, t0 + 0.22);

      gain.gain.setValueAtTime(0.08, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t0);
      osc.stop(t0 + 0.26);
    } catch (e) {}
  }

  // Pleasant dual-tone smartphone push notification chime (simulates mobile alert)
  function playPhoneChime() {
    if (muted || !ctx) return;
    try {
      ensureContext();
      const t0 = ctx.currentTime;

      // Note 1: High crisp tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, t0); // C6
      gain1.gain.setValueAtTime(0.12, t0);
      gain1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(t0);
      osc1.stop(t0 + 0.18);

      // Note 2: Harmonic resolution chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, t0 + 0.12); // E6
      gain2.gain.setValueAtTime(0.14, t0 + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.38);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(t0 + 0.12);
      osc2.stop(t0 + 0.38);
    } catch (e) {}
  }

  function toggleMute() {
    muted = !muted;
    return muted;
  }

  function isMuted() {
    return muted;
  }

  return {
    init,
    ensureContext,
    playPacketChirp,
    playAttackAlert,
    playLaserZap,
    playEmpBlast,
    playContainmentSuccess,
    playDecoyDeploySound,
    playShieldBubbleSound,
    playSectorAlarmSound,
    playPhoneChime,
    toggleMute,
    isMuted
  };
})();

window.AudioEngine = AudioEngine;
// Unlock Web Audio context on first user click anywhere
window.addEventListener('click', () => AudioEngine.ensureContext(), { once: true });
