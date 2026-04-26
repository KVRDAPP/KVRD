import { SoundTouch, SimpleFilter, WebAudioBufferSource } from 'soundtouchjs';

const CHUNK_SIZE = 8192;

/**
 * Returns a new AudioBuffer pitch-shifted by `semitones`.
 * SoundTouch always outputs interleaved stereo, so the result is always 2 ch.
 */
export async function pitchShiftBuffer(audioBuffer, semitones, audioContext) {
  const stereoBuffer = toStereo(audioBuffer, audioContext);

  const soundTouch = new SoundTouch();
  soundTouch.pitchSemitones = semitones;

  const source = new WebAudioBufferSource(stereoBuffer);
  const filter = new SimpleFilter(source, soundTouch);

  const sampleRate = stereoBuffer.sampleRate;
  const numChannels = 2;
  const targetFrames = stereoBuffer.length;

  // Allocate with headroom for algorithm latency
  const outputData = new Float32Array((targetFrames + CHUNK_SIZE) * numChannels);
  const chunk = new Float32Array(CHUNK_SIZE * numChannels);
  let totalFrames = 0;

  while (totalFrames < targetFrames) {
    const extracted = filter.extract(chunk, CHUNK_SIZE);
    if (extracted === 0) break;
    outputData.set(chunk.subarray(0, extracted * numChannels), totalFrames * numChannels);
    totalFrames += extracted;
  }

  const resultLength = Math.max(1, totalFrames);
  const result = audioContext.createBuffer(numChannels, resultLength, sampleRate);
  const left = result.getChannelData(0);
  const right = result.getChannelData(1);

  for (let i = 0; i < resultLength; i++) {
    left[i]  = outputData[i * 2];
    right[i] = outputData[i * 2 + 1];
  }

  return result;
}

function toStereo(audioBuffer, audioContext) {
  if (audioBuffer.numberOfChannels >= 2) return audioBuffer;

  const stereo = audioContext.createBuffer(2, audioBuffer.length, audioBuffer.sampleRate);
  const mono = audioBuffer.getChannelData(0);
  stereo.getChannelData(0).set(mono);
  stereo.getChannelData(1).set(mono);
  return stereo;
}
