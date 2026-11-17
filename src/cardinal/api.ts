import { API_BASE } from '../utils/config';
import { getAuthToken } from '../utils/auth';
import type { CardinalPage } from './siteMap';

// Guide Step 9: the brain. Only called when the fast path is unsure.
// The local model (Ollama) picks one action + target from the pages this
// user may see; the backend validates before we act on it.
export interface TranscribeResult {
  text: string;
  language?: string;
  duration?: number;
  ms?: number;
}

// Shared uploader: Blob -> POST /api/cardinal/transcribe.
// `model`: 'small' for finals, 'tiny' for fast interim guesses.
export async function transcribeAudio(
  blob: Blob,
  filename: string,
  opts: { language?: string; model?: 'small' | 'tiny'; signal?: AbortSignal } = {}
): Promise<TranscribeResult> {
  const form = new FormData();
  form.append('audio', blob, filename);
  form.append('language', opts.language || 'fr');
  if (opts.model && opts.model !== 'small') form.append('model', opts.model);
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/cardinal/transcribe`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
    signal: opts.signal,
  });
  const payload = (await res.json().catch(() => ({}))) as TranscribeResult & { error?: string };
  if (!res.ok) throw new Error(payload.error || `Transcription impossible (${res.status})`);
  return payload;
}

export interface BrainDecision {
  action: 'go' | 'back' | 'close' | 'ask';
  target: string | null;
  ms?: number;
}

export async function askBrain(text: string, pages: CardinalPage[], signal?: AbortSignal): Promise<BrainDecision> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/cardinal/understand`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      text,
      pages: pages.map((p) => ({ id: p.id, path: p.path, nicknames: p.nicknames })),
    }),
    signal,
  });
  const payload = (await res.json().catch(() => ({}))) as BrainDecision & { error?: string };
  if (!res.ok) throw new Error(payload.error || `Cardinal réfléchit mal (${res.status})`);
  return payload;
}
