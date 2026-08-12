// Ambient sound generator using Web Audio API
// Produces calming noise patterns without bundling audio files

type SoundType = 'white-noise' | 'rain' | 'binaural' | 'brown-noise';

let audioContext: AudioContext | null = null;
let activeNodes: AudioNode[] = [];
let isPlaying = false;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function createWhiteNoise(ctx: AudioContext): AudioNode {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0.05;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  activeNodes.push(source, gain);
  return source;
}

function createBrownNoise(ctx: AudioContext): AudioNode {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0.15;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  activeNodes.push(source, gain);
  return source;
}

function createRainSound(ctx: AudioContext): AudioNode {
  // Brown noise + filtered white noise for rain effect
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;

  const gain = ctx.createGain();
  gain.gain.value = 0.2;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  activeNodes.push(source, filter, gain);
  return source;
}

function createBinauralBeat(ctx: AudioContext): AudioNode {
  const baseFreq = 200;
  const beatFreq = 10; // Alpha waves

  const oscL = ctx.createOscillator();
  oscL.frequency.value = baseFreq;
  oscL.type = 'sine';

  const oscR = ctx.createOscillator();
  oscR.frequency.value = baseFreq + beatFreq;
  oscR.type = 'sine';

  const merger = ctx.createChannelMerger(2);
  const gain = ctx.createGain();
  gain.gain.value = 0.08;

  oscL.connect(merger, 0, 0);
  oscR.connect(merger, 0, 1);
  merger.connect(gain);
  gain.connect(ctx.destination);

  oscL.start();
  oscR.start();

  activeNodes.push(oscL, oscR, merger, gain);
  return merger;
}

export function startAmbientSound(type: SoundType = 'brown-noise'): void {
  stopAmbientSound();
  const ctx = getContext();

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  switch (type) {
    case 'white-noise': createWhiteNoise(ctx); break;
    case 'rain': createRainSound(ctx); break;
    case 'binaural': createBinauralBeat(ctx); break;
    case 'brown-noise': createBrownNoise(ctx); break;
  }

  isPlaying = true;
}

export function stopAmbientSound(): void {
  for (const node of activeNodes) {
    try {
      if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
        node.stop();
      }
      node.disconnect();
    } catch {
      // Already stopped
    }
  }
  activeNodes = [];
  isPlaying = false;
}

export function isAmbientPlaying(): boolean {
  return isPlaying;
}

export const SOUND_OPTIONS: { value: SoundType; label: string }[] = [
  { value: 'brown-noise', label: 'Brown Noise' },
  { value: 'white-noise', label: 'White Noise' },
  { value: 'rain', label: 'Rain' },
  { value: 'binaural', label: 'Binaural Beats' },
];

export type { SoundType };
