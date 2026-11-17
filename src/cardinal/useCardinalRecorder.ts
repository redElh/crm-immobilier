import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeAudio } from './api';

export type RecorderState = 'idle' | 'listening' | 'sending' | 'error';

// Continuous streaming: the mic opens ONCE per session and never closes
// until the session ends. No silence-stop, no restart, no gaps — the orb
// stays red and every word is heard. Every TICK_MS the recent audio window
// goes to tiny STT; acting cuts the consumed audio so words never fire
// twice. Works in Brave, Chrome, Edge and Safari.
const TARGET_SR = 16000;
// How often a window is sampled.
const TICK_MS = 1500;
// Decision window: recent seconds carry the order; short audio stays cheap.
const WINDOW_S = 6;
// Hard cap on buffered audio (oldest dropped).
const BUFFER_CAP_S = 12;
// Skip silence: fixed floor (room hum lives below, close voices above).
// No adaptive learning — nothing to drift, nothing to miscalibrate.
const NEAR_MIN_PEAK = 0.012;
// Minimum buffered audio before a window is worth sending (~0.5s).
const WINDOW_MIN_SAMPLES = 8000;

const WORKLET_CODE = `
class CardinalCapture extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs && inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor('cardinal-capture', CardinalCapture);
`;

function downsampleTo16k(chunks: Float32Array[], fromRate: number): Float32Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const flat = new Float32Array(total);
  let off = 0;
  chunks.forEach((c) => {
    flat.set(c, off);
    off += c.length;
  });
  if (fromRate === TARGET_SR) return flat;
  const ratio = fromRate / TARGET_SR;
  const outLen = Math.floor(total / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(total, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += flat[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

function encodeWav(samples16k: Float32Array): Blob {
  const buf = new ArrayBuffer(44 + samples16k.length * 2);
  const v = new DataView(buf);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i += 1) v.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  v.setUint32(4, 36 + samples16k.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, TARGET_SR, true);
  v.setUint32(28, TARGET_SR * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  writeStr(36, 'data');
  v.setUint32(40, samples16k.length * 2, true);
  for (let i = 0; i < samples16k.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples16k[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}

export function useCardinalRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [phrase, setPhrase] = useState('');
  const [phraseSeq, setPhraseSeq] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ms, setMs] = useState<number | null>(null);
  const [error, setError] = useState('');

  const ctxRef = useRef<AudioContext | null>(null);
  const workletRegisteredRef = useRef(false);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const accRef = useRef<Float32Array[]>([]);
  const accLenRef = useRef(0);
  // Peak since last cut: gates sends on near voice only.
  const peakRef = useRef(0);
  const inFlightRef = useRef(false);
  const pausedRef = useRef(false);
  const tickTimerRef = useRef<number | null>(null);
  const epochRef = useRef(0);

  const teardownMic = useCallback(() => {
    if (tickTimerRef.current !== null) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (workletRef.current) {
      try {
        workletRef.current.port.onmessage = null;
        workletRef.current.disconnect();
      } catch {
        // Already torn down.
      }
      workletRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // End of session: release the microphone.
  const release = useCallback(() => {
    epochRef.current += 1;
    teardownMic();
    try {
      sourceRef.current?.disconnect();
    } catch {
      // Already torn down.
    }
    sourceRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (ctxRef.current) {
      void ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    workletRegisteredRef.current = false;
    accRef.current = [];
    accLenRef.current = 0;
    peakRef.current = 0;
    inFlightRef.current = false;
    pausedRef.current = false;
  }, [teardownMic]);

  // Drop consumed audio so acted words never fire twice. Keeps the floor
  // (room knowledge) — only the buffer and peak reset.
  const cut = useCallback(() => {
    accRef.current = [];
    accLenRef.current = 0;
    peakRef.current = 0;
  }, []);

  const setPaused = useCallback((p: boolean) => {
    pausedRef.current = p;
    // Never transcribe our own voice: resume on a clean buffer.
    if (!p) {
      accRef.current = [];
      accLenRef.current = 0;
      peakRef.current = 0;
    }
  }, []);

  const sendWindow = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || inFlightRef.current || pausedRef.current) return;
    if (accLenRef.current < WINDOW_MIN_SAMPLES || peakRef.current < NEAR_MIN_PEAK) return;
    // Recent window only; cap the buffer so memory never grows.
    const cap = BUFFER_CAP_S * ctx.sampleRate;
    while (accLenRef.current > cap && accRef.current.length > 1) {
      const dropped = accRef.current.shift();
      if (dropped) accLenRef.current -= dropped.length;
    }
    const keep = WINDOW_S * ctx.sampleRate;
    let collected = 0;
    const tail: Float32Array[] = [];
    for (let i = accRef.current.length - 1; i >= 0 && collected < keep; i -= 1) {
      tail.unshift(accRef.current[i]);
      collected += accRef.current[i].length;
    }
    inFlightRef.current = true;
    setBusy(true);
    const t0 = performance.now();
    const wav = encodeWav(downsampleTo16k(tail, ctx.sampleRate));
    peakRef.current = 0;
    transcribeAudio(wav, 'stream.wav', { language: 'fr', model: 'tiny' })
      .then((payload) => {
        const t = (payload.text || '').trim();
        // eslint-disable-next-line no-console
        console.debug(
          `[Cardinal] stream: ${Math.round(performance.now() - t0)}ms total (stt ${payload.ms ?? '?'}ms): ${JSON.stringify(t)}`
        );
        setMs(typeof payload.ms === 'number' ? payload.ms : null);
        if (t) {
          setPhrase(t);
          setPhraseSeq((n) => n + 1);
        }
      })
      .catch(() => {
        // Best-effort: the next window retries.
      })
      .finally(() => {
        inFlightRef.current = false;
        setBusy(false);
      });
  }, []);

  const flush = useCallback(() => {
    sendWindow();
  }, [sendWindow]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone non supporté par ce navigateur.');
      setState('error');
      return;
    }
    const epoch = ++epochRef.current;
    setError('');
    setPhrase('');
    accRef.current = [];
    accLenRef.current = 0;
    peakRef.current = 0;
    pausedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (epoch !== epochRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      ctxRef.current = ctx;
      sourceRef.current = source;
      streamRef.current = stream;
      if (!ctx.audioWorklet) throw new Error('Capture audio non supportée par ce navigateur.');
      if (!workletRegisteredRef.current) {
        const moduleUrl = URL.createObjectURL(new Blob([WORKLET_CODE], { type: 'application/javascript' }));
        try {
          await ctx.audioWorklet.addModule(moduleUrl);
        } finally {
          URL.revokeObjectURL(moduleUrl);
        }
        workletRegisteredRef.current = true;
      }
      if (ctx.state === 'suspended') await ctx.resume();
      const worklet = new AudioWorkletNode(ctx, 'cardinal-capture');
      worklet.port.onmessage = (ev: MessageEvent<Float32Array>) => {
        const chunk = ev.data;
        if (chunk && chunk.length > 0) {
          accRef.current.push(chunk);
          accLenRef.current += chunk.length;
          // Track near-voice peak for the send gate (cheap max scan).
          let m = 0;
          for (let i = 0; i < chunk.length; i += 8) {
            const a = Math.abs(chunk[i]);
            if (a > m) m = a;
          }
          if (m > peakRef.current) peakRef.current = m;
        }
      };
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      source.connect(worklet);
      workletRef.current = worklet;
      analyserRef.current = analyser;
      setState('listening');
      tickTimerRef.current = window.setInterval(() => sendWindow(), TICK_MS);
    } catch {
      if (epoch !== epochRef.current) return;
      setError('Microphone bloqué. Autorise le micro pour ce site puis réessaie.');
      setState('error');
      teardownMic();
    }
  }, [sendWindow, teardownMic]);

  useEffect(() => () => release(), [release]);

  return { state, phrase, phraseSeq, busy, ms, error, start, flush, cut, setPaused, release };
}
