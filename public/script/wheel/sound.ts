import { cymbalCrashAudio, drumrollAudio, volumeSlider } from "../shared/dom.js";

let drumrollStarted = false;
let tickBuffer: AudioBuffer | null = null;

export let masterGain: GainNode | null = null;

function getMasterGain(): GainNode {
  const ctx = getAudioContext();
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = getCurrentVolume();
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

export async function preloadTickBuffer(url: string): Promise<void> {
  tickBuffer = await loadBuffer(url);
}

export function playTickSound(): void {
  if (!tickBuffer) return;
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = tickBuffer;
  source.connect(getMasterGain());
  source.start(ctx.currentTime);
}

// --- Asset Sound via Web Audio API (saubere Fades, kein Clip-Knacken) ---
const FADE_DURATION = 0.04; // 40ms fade-in und fade-out

const bufferCache = new Map<string, AudioBuffer>();
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentGain: GainNode | null = null;
let currentResolve: (() => void) | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function resetActivePlayback(): (() => void) | null {
  const resolve = currentResolve;
  currentSource = null;
  currentGain = null;
  currentResolve = null;
  return resolve;
}

function stopSourceSafely(source: AudioBufferSourceNode): void {
  try {
    source.stop();
  } catch {
    /* bereits gestoppt */
  }
}

function fadeOutAndStop(source: AudioBufferSourceNode, gain: GainNode): void {
  const ctx = getAudioContext();
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_DURATION);
  setTimeout(() => stopSourceSafely(source), FADE_DURATION * 1000);
}

export function stopAssetSound(): void {
  if (!currentSource || !currentGain) return;
  fadeOutAndStop(currentSource, currentGain);
  resetActivePlayback()?.();
}

async function loadBuffer(assetUrl: string): Promise<AudioBuffer> {
  const cached = bufferCache.get(assetUrl);
  if (cached) return cached;
  const response = await fetch(assetUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await getAudioContext().decodeAudioData(arrayBuffer);
  bufferCache.set(assetUrl, buffer);
  return buffer;
}

function applyFadeEnvelope(gain: GainNode, duration: number): void {
  const ctx = getAudioContext();
  const fade = Math.min(FADE_DURATION, duration / 3);
  const start = ctx.currentTime;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(1, start + fade);
  gain.gain.setValueAtTime(1, start + duration - fade);
  gain.gain.linearRampToValueAtTime(0, start + duration);
}

function startAndAwait(source: AudioBufferSourceNode): Promise<void> {
  return new Promise((resolve) => {
    currentResolve = resolve;
    source.onended = () => {
      if (currentSource === source) resetActivePlayback();
      resolve();
    };
    source.start();
  });
}

export async function playAssetSound(assetUrl: string): Promise<void> {
  stopAssetSound();
  const ctx = getAudioContext();
  if (ctx.state === "suspended") await ctx.resume();

  const buffer = await loadBuffer(assetUrl);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();

  source.buffer = buffer;
  applyFadeEnvelope(gain, buffer.duration);
  source.connect(gain);
  gain.connect(getMasterGain());

  currentSource = source;
  currentGain = gain;
  return startAndAwait(source);
}

function getCurrentVolume(): number {
  return volumeSlider ? parseInt(volumeSlider.value) / 100 : 1;
}

// --- Drumroll mit Fade-Out beim Stoppen ---
export function playDrumRoll(): void {
  if (!drumrollAudio || drumrollStarted) return;
  drumrollStarted = true;
  drumrollAudio.volume = getCurrentVolume();
  drumrollAudio.currentTime = 0;
  drumrollAudio.play();
}

export function stopDrumRoll(): void {
  if (!drumrollAudio || !drumrollStarted) return;
  drumrollStarted = false;
  const audio = drumrollAudio;
  const startVolume = audio.volume;
  const STEPS = 10;
  const INTERVAL = 20;
  let step = 0;
  const fade = setInterval(() => {
    step++;
    audio.volume = Math.max(0, startVolume * (1 - step / STEPS));
    if (step < STEPS) return;
    clearInterval(fade);
    audio.pause();
    audio.currentTime = 0;
    audio.volume = getCurrentVolume();
  }, INTERVAL);
}

export function playCymbalCrash(): void {
  if (!cymbalCrashAudio) return;
  cymbalCrashAudio.volume = getCurrentVolume();
  cymbalCrashAudio.currentTime = 0;
  cymbalCrashAudio.play();
}