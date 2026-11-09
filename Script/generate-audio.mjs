import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'Resources/audio/serenade.wav');
const sampleRate = 22050;
const duration = 20;
const totalSamples = sampleRate * duration;
const samples = new Int16Array(totalSamples);
const chordProgression = [
  [261.63, 329.63, 392.0, 523.25],
  [220.0, 261.63, 329.63, 440.0],
  [174.61, 220.0, 261.63, 349.23],
  [196.0, 246.94, 293.66, 392.0]
];
const chordDuration = duration / chordProgression.length;

for (let index = 0; index < totalSamples; index += 1) {
  const time = index / sampleRate;
  const chordIndex = Math.min(chordProgression.length - 1, Math.floor(time / chordDuration));
  const chordTime = time - chordIndex * chordDuration;
  const edgeFade = Math.min(1, time / 1.5, (duration - time) / 1.5);
  let value = 0;

  chordProgression[chordIndex].forEach((frequency, noteIndex) => {
    const attack = Math.min(1, chordTime / 1.8);
    const release = Math.min(1, (chordDuration - chordTime) / 1.2);
    const envelope = Math.max(0, Math.min(attack, release));
    const phase = 2 * Math.PI * frequency * time;
    value += envelope * (
      Math.sin(phase) * 0.045 +
      Math.sin(phase * 2) * 0.008 +
      Math.sin(phase * 3) * 0.002
    ) * (1 - noteIndex * 0.12);
  });

  const shimmer = Math.sin(2 * Math.PI * 783.99 * time) * 0.003;
  samples[index] = Math.max(-1, Math.min(1, (value + shimmer) * edgeFade)) * 32767;
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + samples.byteLength, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(samples.byteLength, 40);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, Buffer.concat([header, Buffer.from(samples.buffer)]));
console.log(`Created ${output} (${Math.round((header.byteLength + samples.byteLength) / 1024)} KB)`);