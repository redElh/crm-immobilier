import fs from 'fs/promises';

// Base URL of the Python faster-whisper microservice (see whisper-service/).
const WHISPER_URL = process.env.WHISPER_URL || 'http://127.0.0.1:8001';
const WHISPER_TIMEOUT_MS = Number(process.env.WHISPER_TIMEOUT_MS || 120000);

// Sends an audio buffer straight to Whisper — no temp file, no disk I/O.
// `model`: 'small' (accurate, final) or 'tiny' (fast, interim guesses).
export async function transcribeBuffer(buffer, { language = 'fr', filename = 'audio.webm', mime = 'audio/webm', model = 'small' } = {}) {
  const form = new FormData();
  form.append('audio', new Blob([buffer], { type: mime }), filename);
  form.append('language', language);
  if (model && model !== 'small') form.append('model', model);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WHISPER_TIMEOUT_MS);
  try {
    const res = await fetch(`${WHISPER_URL}/transcribe`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.error || `Whisper service error (${res.status})`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Sends an audio file to the Whisper service and returns the transcription.
// Usage: transcribeAudio('/abs/path/voice.webm', { language: 'fr' })
// `model`: 'small' (accurate, final) or 'tiny' (fast, interim guesses).
export async function transcribeAudio(filePath, { language = 'fr', filename, mime = 'audio/webm', model = 'small' } = {}) {
  const buffer = await fs.readFile(filePath);
  return transcribeBuffer(buffer, { language, filename: filename || 'audio.webm', mime, model });
}
