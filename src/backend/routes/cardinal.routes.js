import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/auth.middleware.js';
import { transcribeBuffer } from '../services/whisper.service.js';

// In-memory upload: audio is forwarded to the Whisper microservice,
// never stored permanently. 5 MB cap keeps one voice command small.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const CARDINAL_MODEL = process.env.CARDINAL_MODEL || 'llama3.1:8b';
// Cold model load takes ~25s once; warm calls are <1s. keep_alive in the
// request keeps it resident 10 min so the slow path hits only once.
const BRAIN_TIMEOUT_MS = Number(process.env.CARDINAL_BRAIN_TIMEOUT_MS || 90000);

const BRAIN_ACTIONS = new Set(['go', 'back', 'close', 'ask']);

// POST /api/cardinal/transcribe — { audio: <webm|mp4|wav> } -> { text, language, ... }
// Auth required, like every other /api route. The browser records with
// MediaRecorder and posts here; Node forwards to the Python STT service
// (WHISPER_URL, default http://127.0.0.1:8001) and returns the French text.
router.post('/transcribe', verifyToken, upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Champ 'audio' manquant" });
  }
  const ext = req.file.originalname && req.file.originalname.includes('.')
    ? `.${req.file.originalname.split('.').pop()}`
    : '.webm';
  try {
    // Straight from memory to Whisper — no temp file, no disk I/O.
    const model = req.body.model === 'tiny' ? 'tiny' : 'small';
    const result = await transcribeBuffer(req.file.buffer, {
      language: req.body.language || 'fr',
      filename: req.file.originalname || `audio${ext}`,
      mime: req.file.mimetype || 'audio/webm',
      model,
    });
    return res.json(result);
  } catch (err) {
    const msg = err.message || 'Transcription failed';
    const status = msg.includes('Whisper service error (4') ? 502 : 500;
    return res.status(status).json({ error: msg });
  }
});

// POST /api/cardinal/understand — guide Step 9 (the brain for unclear requests).
// Body: { text, pages: [{ id, path, nicknames }] }. The local model picks ONE
// action + target from the list and must reply in strict JSON. We validate
// before returning: unknown action or off-list target becomes 'ask'.
// The model never drives the app directly — the frontend navigates.
router.post('/understand', verifyToken, async (req, res) => {
  const started = Date.now();
  const { text, pages } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: "Champ 'text' manquant" });
  }
  const ids = Array.isArray(pages) ? pages.map((p) => p?.id).filter((id) => typeof id === 'string') : [];
  if (ids.length === 0) {
    return res.status(400).json({ error: "Champ 'pages' manquant" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BRAIN_TIMEOUT_MS);
  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: CARDINAL_MODEL,
        stream: false,
        format: 'json',
        keep_alive: '10m',
        options: { temperature: 0, num_ctx: 2048 },
        messages: [
          {
            role: 'system',
            content:
              "Tu es Cardinal, le navigateur vocal d'un CRM. Tu recois une phrase en francais et une liste de pages autorisees. " +
              'Tu reponds UNIQUEMENT avec un objet JSON, sans aucun texte autour : ' +
              '{"action":"go"|"back"|"close"|"ask","target":"<id de page>" ou null}. ' +
              '"go" = aller a la page cible. "back" = page precedente. "close" = fermer. "ask" = tu ne sais pas. ' +
              'Si la phrase demande une action dangereuse ou hors liste (supprimer, modifier des donnees), reponds {"action":"ask","target":null}.',
          },
          {
            role: 'user',
            content: `Phrase : "${text}"\nPages autorisees (id) : ${ids.join(', ')}`,
          },
        ],
      }),
    });
    if (!ollamaRes.ok) {
      throw new Error(`Ollama error (${ollamaRes.status})`);
    }
    const ollamaPayload = await ollamaRes.json();
    const raw = ollamaPayload?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('Model did not return JSON');
      parsed = JSON.parse(m[0]);
    }
    let { action, target } = parsed || {};
    if (!BRAIN_ACTIONS.has(action)) {
      action = 'ask';
      target = null;
    }
    if (action === 'go' && !ids.includes(target)) {
      action = 'ask';
      target = null;
    }
    if (action !== 'go') target = null;
    return res.json({ action, target, ms: Date.now() - started });
  } catch (err) {
    const msg = err?.name === 'AbortError' ? 'Le cerveau local met trop longtemps' : err?.message || 'Brain failed';
    return res.status(502).json({ error: msg });
  } finally {
    clearTimeout(timer);
  }
});

export default router;
