import { volumeSlider } from "./volume.js";

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

let drumrollBuffer: AudioBuffer | null = null;
let cymbalBuffer: AudioBuffer | null = null;

export async function preloadStaticSounds(): Promise<void> {
  [drumrollBuffer, cymbalBuffer] = await Promise.all([
    loadBuffer("/assets/sounds/drumroll.mp3"),
    loadBuffer("/assets/sounds/cymbal-crash.mp3"),
  ]);
}

// --- Drumroll via Web Audio API (loop + sauberer Fade-Out) ---
const DRUMROLL_FADE = 0.2;
let drumrollSource: AudioBufferSourceNode | null = null;
let drumrollGain: GainNode | null = null;
let drumrollStarted = false;


export function playDrumRoll(): void {
  if (!drumrollBuffer || drumrollStarted) return;
  drumrollStarted = true;
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = drumrollBuffer;
  source.loop = true;
  gain.gain.setValueAtTime(1, ctx.currentTime);
  source.connect(gain);
  gain.connect(getMasterGain());
  source.start();
  drumrollSource = source;
  drumrollGain = gain;
}

export function stopDrumRoll(): void {
  if (!drumrollSource || !drumrollGain || !drumrollStarted) return;
  drumrollStarted = false;
  const source = drumrollSource;
  const gain = drumrollGain;
  drumrollSource = null;
  drumrollGain = null;
  const ctx = getAudioContext();
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + DRUMROLL_FADE);
  setTimeout(() => stopSourceSafely(source), DRUMROLL_FADE * 1000);
}

// --- Cymbal Crash via Web Audio API ---
export function playCymbalCrash(): void {
  if (!cymbalBuffer) return;
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = cymbalBuffer;
  source.connect(getMasterGain());
  source.start();
}