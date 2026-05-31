// lib/typewriterSound.ts
// Web Audio API typewriter sounds — client-safe and external-resource-free.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    // Avoid console errors by initializing on demand within user actions
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function playTypewriterClick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Resume context if suspended (browser security policies)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Dynamic mechanical click: random slightly varying frequency around 600Hz
    const pitch = 500 + Math.random() * 250;
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    
    // High-pass filter to sound like metal clicking
    filter.type = "highpass";
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    // Tight click envelope
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch (error) {
    // Graceful error handling if web audio is blocked
    console.debug("Web Audio blocked or uninitialized", error);
  }
}

export function playCarriageReturn() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // A beautiful nostalgic typewriter bell ring at completion!
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Pure metallic bell sound around 2200Hz
    osc.frequency.setValueAtTime(2100, ctx.currentTime);
    osc.type = "sine";

    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (error) {
    console.debug("Web Audio blocked or uninitialized", error);
  }
}
