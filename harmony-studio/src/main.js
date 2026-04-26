import { pitchShiftBuffer } from './harmony.js';
import { exportMix }        from './exporter.js';

// ── State ────────────────────────────────────────────────────────────────
let audioCtx       = null;
let originalBuffer = null;
const cache        = new Map(); // semitones → AudioBuffer
const activeVoices = new Set();
let isPlaying      = false;
let currentSources = [];
let leadGainNode   = null;
let harmonyGainNode = null;
let analyserNode   = null;
let animFrameId    = null;

// ── DOM refs ─────────────────────────────────────────────────────────────
const dropZone       = document.getElementById('drop-zone');
const fileInput      = document.getElementById('file-input');
const waveformCanvas = document.getElementById('waveform');
const controls       = document.getElementById('controls');
const statusBar      = document.getElementById('status-bar');
const playBtn        = document.getElementById('play-btn');
const playIcon       = document.getElementById('play-icon');
const playLabel      = document.getElementById('play-label');
const downloadBtn    = document.getElementById('download-btn');
const leadSlider     = document.getElementById('lead-gain');
const harmonySlider  = document.getElementById('harmony-gain');
const leadVal        = document.getElementById('lead-gain-val');
const harmonyVal     = document.getElementById('harmony-gain-val');
const voiceBtns      = document.querySelectorAll('.voice-btn');

const ctx2d = waveformCanvas.getContext('2d');

// ── File handling ─────────────────────────────────────────────────────────
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) loadFile(fileInput.files[0]);
});

async function loadFile(file) {
  ensureAudioContext();
  setStatus(`Loading ${file.name}…`);

  try {
    const arrayBuf = await file.arrayBuffer();
    originalBuffer = await audioCtx.decodeAudioData(arrayBuf);
  } catch (err) {
    setStatus(`Error decoding file: ${err.message}`);
    return;
  }

  cache.clear();
  if (isPlaying) stopPlayback();

  const dur  = originalBuffer.duration.toFixed(1);
  const ch   = originalBuffer.numberOfChannels === 1 ? 'Mono' : 'Stereo';
  const rate = (originalBuffer.sampleRate / 1000).toFixed(1);
  setStatus(`${file.name}  ·  ${dur}s  ·  ${ch}  ·  ${rate} kHz`);

  dropZone.classList.add('hidden');
  waveformCanvas.classList.remove('hidden');
  controls.classList.remove('hidden');
  playBtn.disabled    = false;
  downloadBtn.disabled = false;

  resizeCanvas();
  drawStaticWaveform();
}

// ── Voice toggles ─────────────────────────────────────────────────────────
voiceBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const semitones = parseInt(btn.dataset.semitones, 10);
    btn.classList.toggle('active');
    if (btn.classList.contains('active')) {
      activeVoices.add(semitones);
    } else {
      activeVoices.delete(semitones);
    }
    if (isPlaying) {
      stopPlayback();
      startPlayback();
    }
  });
});

// ── Gain sliders ──────────────────────────────────────────────────────────
leadSlider.addEventListener('input', () => {
  leadVal.textContent = pct(leadSlider.value);
  if (leadGainNode) leadGainNode.gain.value = +leadSlider.value;
});
harmonySlider.addEventListener('input', () => {
  harmonyVal.textContent = pct(harmonySlider.value);
  if (harmonyGainNode) harmonyGainNode.gain.value = +harmonySlider.value;
});

// ── Playback ──────────────────────────────────────────────────────────────
playBtn.addEventListener('click', () => {
  if (isPlaying) stopPlayback();
  else startPlayback();
});

async function startPlayback() {
  if (!originalBuffer) return;

  const voices = [...activeVoices];

  // Process any uncached voices
  const uncached = voices.filter((s) => !cache.has(s));
  if (uncached.length) {
    setBusy(true, `Processing ${uncached.length} voice${uncached.length > 1 ? 's' : ''}…`);
    for (const s of uncached) {
      cache.set(s, await pitchShiftBuffer(originalBuffer, s, audioCtx));
    }
    setBusy(false);
  }

  if (audioCtx.state === 'suspended') await audioCtx.resume();

  // Build audio graph
  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 2048;
  analyserNode.connect(audioCtx.destination);

  leadGainNode = audioCtx.createGain();
  leadGainNode.gain.value = +leadSlider.value;
  leadGainNode.connect(analyserNode);

  harmonyGainNode = audioCtx.createGain();
  harmonyGainNode.gain.value = +harmonySlider.value;
  harmonyGainNode.connect(analyserNode);

  currentSources = [];

  // Lead vocal
  const leadSrc = audioCtx.createBufferSource();
  leadSrc.buffer = originalBuffer;
  leadSrc.connect(leadGainNode);
  leadSrc.start(0);
  currentSources.push(leadSrc);

  leadSrc.onended = () => { if (isPlaying) stopPlayback(); };

  // Harmony voices
  for (const s of voices) {
    const buf = cache.get(s);
    if (!buf) continue;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(harmonyGainNode);
    src.start(0);
    currentSources.push(src);
  }

  isPlaying = true;
  playIcon.textContent  = '■';
  playLabel.textContent = 'Stop';
  setStatus('Playing…');
  startWaveformAnimation();
}

function stopPlayback() {
  currentSources.forEach((src) => { try { src.stop(); } catch { /* already stopped */ } });
  currentSources = [];
  isPlaying = false;
  playIcon.textContent  = '▶';
  playLabel.textContent = 'Play';
  cancelAnimationFrame(animFrameId);
  drawStaticWaveform();

  const dur  = originalBuffer ? originalBuffer.duration.toFixed(1) : '';
  const ch   = originalBuffer?.numberOfChannels === 1 ? 'Mono' : 'Stereo';
  const rate = originalBuffer ? (originalBuffer.sampleRate / 1000).toFixed(1) : '';
  if (originalBuffer) setStatus(`Ready  ·  ${dur}s  ·  ${ch}  ·  ${rate} kHz`);
}

// ── Download ──────────────────────────────────────────────────────────────
downloadBtn.addEventListener('click', async () => {
  if (!originalBuffer) return;

  const voices = [...activeVoices];
  const uncached = voices.filter((s) => !cache.has(s));

  downloadBtn.disabled = true;
  setBusy(true, uncached.length ? `Processing ${uncached.length} voice(s) for export…` : 'Rendering mix…');

  for (const s of uncached) {
    cache.set(s, await pitchShiftBuffer(originalBuffer, s, audioCtx));
  }

  const harmonyBuffers = voices.map((s) => cache.get(s)).filter(Boolean);

  try {
    setStatus('Rendering mix…');
    await exportMix(
      originalBuffer,
      harmonyBuffers,
      +leadSlider.value,
      +harmonySlider.value,
    );
    setStatus('Mix saved — check your downloads!');
  } catch (err) {
    setStatus(`Export error: ${err.message}`);
  }

  setBusy(false);
  downloadBtn.disabled = false;
});

// ── Waveform ──────────────────────────────────────────────────────────────
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = waveformCanvas.getBoundingClientRect();
  waveformCanvas.width  = rect.width  * dpr;
  waveformCanvas.height = rect.height * dpr;
  ctx2d.scale(dpr, dpr);
}

window.addEventListener('resize', () => {
  if (!waveformCanvas.classList.contains('hidden')) {
    resizeCanvas();
    if (!isPlaying) drawStaticWaveform();
  }
});

function drawStaticWaveform() {
  if (!originalBuffer) return;

  const w  = waveformCanvas.width  / (window.devicePixelRatio || 1);
  const h  = waveformCanvas.height / (window.devicePixelRatio || 1);
  const data = originalBuffer.getChannelData(0);

  ctx2d.fillStyle = '#0d0d0f';
  ctx2d.fillRect(0, 0, w, h);

  const step = Math.ceil(data.length / w);
  const amp  = h / 2;

  ctx2d.strokeStyle = '#c8ff5788';
  ctx2d.lineWidth   = 1;
  ctx2d.beginPath();

  for (let x = 0; x < w; x++) {
    let min = 1, max = -1;
    for (let j = 0; j < step; j++) {
      const d = data[x * step + j] ?? 0;
      if (d < min) min = d;
      if (d > max) max = d;
    }
    ctx2d.moveTo(x, amp + min * amp * 0.95);
    ctx2d.lineTo(x, amp + max * amp * 0.95);
  }

  ctx2d.stroke();

  // centre line
  ctx2d.strokeStyle = '#2a2a30';
  ctx2d.lineWidth   = 1;
  ctx2d.beginPath();
  ctx2d.moveTo(0, amp);
  ctx2d.lineTo(w, amp);
  ctx2d.stroke();
}

function startWaveformAnimation() {
  const bufferLen = analyserNode.frequencyBinCount;
  const dataArr   = new Uint8Array(bufferLen);

  const w = waveformCanvas.width  / (window.devicePixelRatio || 1);
  const h = waveformCanvas.height / (window.devicePixelRatio || 1);

  function draw() {
    animFrameId = requestAnimationFrame(draw);
    analyserNode.getByteTimeDomainData(dataArr);

    ctx2d.fillStyle = '#0d0d0f';
    ctx2d.fillRect(0, 0, w, h);

    // Faint static waveform underneath
    const data = originalBuffer.getChannelData(0);
    const step = Math.ceil(data.length / w);
    const amp  = h / 2;

    ctx2d.strokeStyle = '#c8ff5730';
    ctx2d.lineWidth   = 1;
    ctx2d.beginPath();
    for (let x = 0; x < w; x++) {
      let min = 1, max = -1;
      for (let j = 0; j < step; j++) {
        const d = data[x * step + j] ?? 0;
        if (d < min) min = d;
        if (d > max) max = d;
      }
      ctx2d.moveTo(x, amp + min * amp * 0.95);
      ctx2d.lineTo(x, amp + max * amp * 0.95);
    }
    ctx2d.stroke();

    // Live waveform
    ctx2d.strokeStyle = '#c8ff57';
    ctx2d.lineWidth   = 2;
    ctx2d.shadowColor = '#c8ff5780';
    ctx2d.shadowBlur  = 6;
    ctx2d.beginPath();

    const sliceW = w / bufferLen;
    let x = 0;
    for (let i = 0; i < bufferLen; i++) {
      const v = dataArr[i] / 128;
      const y = (v * h) / 2;
      i === 0 ? ctx2d.moveTo(x, y) : ctx2d.lineTo(x, y);
      x += sliceW;
    }
    ctx2d.lineTo(w, h / 2);
    ctx2d.stroke();
    ctx2d.shadowBlur = 0;
  }

  draw();
}

// ── Utilities ─────────────────────────────────────────────────────────────
function ensureAudioContext() {
  if (!audioCtx) audioCtx = new AudioContext();
}

function setStatus(msg) {
  statusBar.textContent = msg;
}

function setBusy(busy, msg) {
  playBtn.disabled     = busy;
  downloadBtn.disabled = busy;
  if (msg) setStatus(msg);
}

function pct(v) {
  return Math.round(v * 100) + '%';
}
