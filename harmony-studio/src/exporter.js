/**
 * Renders the full mix offline and triggers a WAV download.
 * @param {AudioBuffer} leadBuffer
 * @param {AudioBuffer[]} harmonyBuffers  active pitch-shifted buffers
 * @param {number} leadGain   0–1
 * @param {number} harmonyGain 0–1
 */
export async function exportMix(leadBuffer, harmonyBuffers, leadGain, harmonyGain) {
  const { numberOfChannels, sampleRate, length } = leadBuffer;

  const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate);

  function addSource(buffer, gainValue) {
    const src = offlineCtx.createBufferSource();
    src.buffer = buffer;

    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = gainValue;

    src.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
    src.start(0);
  }

  addSource(leadBuffer, leadGain);

  for (const buf of harmonyBuffers) {
    // Harmony buffers are stereo; if lead is mono, mix down to match
    const compatible = matchChannels(buf, numberOfChannels, offlineCtx);
    addSource(compatible, harmonyGain);
  }

  const rendered = await offlineCtx.startRendering();
  const wav = encodeWAV(rendered);
  downloadBlob(new Blob([wav], { type: 'audio/wav' }), 'harmony-mix.wav');
}

// ── Helpers ───────────────────────────────────────────────────────────────

function matchChannels(buffer, targetChannels, offlineCtx) {
  if (buffer.numberOfChannels === targetChannels) return buffer;

  // Down-mix stereo → mono for the offline context
  const out = offlineCtx.createBuffer(targetChannels, buffer.length, buffer.sampleRate);
  const l = buffer.getChannelData(0);
  const r = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : l;

  for (let c = 0; c < targetChannels; c++) {
    const dest = out.getChannelData(c);
    for (let i = 0; i < buffer.length; i++) {
      dest[i] = (l[i] + r[i]) * 0.5;
    }
  }
  return out;
}

function encodeWAV(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate  = audioBuffer.sampleRate;
  const numSamples  = audioBuffer.length;
  const bitsPerSample = 16;
  const dataSize = numSamples * numChannels * 2;

  const buf  = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);

  writeStr(view, 0,  'RIFF');
  view.setUint32(4,  36 + dataSize, true);
  writeStr(view, 8,  'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1,  true);                                       // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, (sampleRate * numChannels * bitsPerSample) / 8, true);
  view.setUint16(32, (numChannels * bitsPerSample) / 8, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, audioBuffer.getChannelData(c)[i]));
      view.setInt16(offset, Math.round(s * 32767), true);
      offset += 2;
    }
  }

  return buf;
}

function writeStr(view, offset, str) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
