import io
import os
import threading
import time

from av.error import InvalidDataError
from flask import Flask, jsonify, request
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio as fw_decode_audio
import numpy as np

DEFAULT_MODEL = os.environ.get("WHISPER_MODEL", "small")
ALLOWED_MODELS = {"tiny", "base", "small", "medium"}
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")
BEAM_SIZE = int(os.environ.get("WHISPER_BEAM_SIZE", "1"))
CPU_THREADS = int(os.environ.get("WHISPER_CPU_THREADS", "8"))
# VAD tuning: how much silence must separate speech before it's split, and how
# much context to pad around detected speech. Trims noise-only stretches so
# background hum/chatter never reaches the decoder.
VAD_MIN_SILENCE_MS = int(os.environ.get("WHISPER_VAD_MIN_SILENCE_MS", "350"))
VAD_SPEECH_PAD_MS = int(os.environ.get("WHISPER_VAD_SPEECH_PAD_MS", "200"))
# Spectral noise suppression (fan, hum, room tone) before transcription.
# Voice isolation: near-field speech survives gating, background doesn't.
# Pure numpy — instant import, no heavy ML dependency.
DENOISE = os.environ.get("WHISPER_DENOISE", "1") == "1"
DEFAULT_LANGUAGE = os.environ.get("WHISPER_LANGUAGE", "fr")
HOST = os.environ.get("WHISPER_HOST", "127.0.0.1")
PORT = int(os.environ.get("WHISPER_PORT", "8001"))

app = Flask(__name__)

_models = {}
_model_lock = threading.Lock()
# Only one transcription runs at a time: concurrent Whisper jobs thrash the
# CPU and every request gets slow (5-27s pileups). Interim (tiny) calls that
# arrive while busy are dropped instantly (200 + dropped:true) — the next
# slice retries. Finals (small) wait their turn.
_transcribe_lock = threading.Lock()
_started_at = time.time()


def get_model(size=DEFAULT_MODEL):
    if size not in ALLOWED_MODELS:
        size = DEFAULT_MODEL
    with _model_lock:
        if size not in _models:
            _models[size] = WhisperModel(size, device=DEVICE, compute_type=COMPUTE_TYPE, cpu_threads=CPU_THREADS)
            app.logger.info(
                "Loaded Whisper model '%s' (device=%s, compute_type=%s)",
                size, DEVICE, COMPUTE_TYPE,
            )
    return _models[size]


def spectral_gate(pcm, sr=16000, frame=512, hop=128, floor=0.25):
    """Light stationary-noise suppression. Noise spectrum = median of the
    first ~0.4s (room tone before speech starts); soft mask pushes
    noise-like bins toward the floor while voice bins pass through."""
    pcm = np.asarray(pcm, dtype=np.float32)
    if pcm.size < frame:
        return pcm
    window = np.hanning(frame).astype(np.float32)
    frames = []
    for start in range(0, max(1, pcm.size - frame + 1), hop):
        frames.append(pcm[start:start + frame] * window)
    spec = np.stack([np.fft.rfft(f) for f in frames])
    mag = np.abs(spec)
    n_noise = max(1, min(len(frames), int(0.4 * sr / hop)))
    noise = np.median(mag[:n_noise], axis=0) + 1e-8
    mask = np.clip((mag - 1.5 * noise) / (mag + 1e-8), floor, 1.0).astype(np.float32)
    gated = np.stack([np.fft.irfft(spec[i] * mask[i], n=frame) for i in range(len(frames))])
    out = np.zeros(pcm.size, dtype=np.float32)
    norm = np.zeros(pcm.size, dtype=np.float32)
    for i, start in enumerate(range(0, max(1, pcm.size - frame + 1), hop)):
        out[start:start + frame] += gated[i] * window
        norm[start:start + frame] += window * window
    norm[norm < 1e-8] = 1.0
    out = out / norm
    peak = np.max(np.abs(out))
    if peak > 1e-8:
        out = out * (np.max(np.abs(pcm)) / peak)
    return out


@app.get("/health")
def health():
    import datetime
    return jsonify({
        "status": "ok",
        "model": DEFAULT_MODEL,
        "device": DEVICE,
        "threads": CPU_THREADS,
        "beam": BEAM_SIZE,
        "denoise": DENOISE,
        "loaded": sorted(_models.keys()),
        "pid": os.getpid(),
        "started": datetime.datetime.fromtimestamp(_started_at).isoformat(timespec="seconds"),
    })


@app.post("/transcribe")
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "Champ 'audio' manquant"}), 400

    upload = request.files["audio"]
    if not upload.filename:
        return jsonify({"error": "Fichier audio vide"}), 400

    language = request.form.get("language") or DEFAULT_LANGUAGE
    model_size = request.form.get("model") or DEFAULT_MODEL
    if model_size not in ALLOWED_MODELS:
        return jsonify({"error": f"Modèle inconnu '{model_size}'"}), 400
    data = upload.read()
    if not data:
        return jsonify({"error": "Fichier audio vide"}), 400

    is_interim = model_size == "tiny"
    t_entry = time.time()
    if is_interim and not _transcribe_lock.acquire(blocking=False):
        return jsonify({"text": "", "language": language, "language_probability": 0, "duration": 0, "ms": 0, "dropped": True})
    if not is_interim:
        _transcribe_lock.acquire()
    t_locked = time.time()
    try:
        model = get_model(model_size)
        t0 = time.time()
        t_decode = t_gate = 0
        # Denoise finals only: interims (tiny) skip the gate to save CPU —
        # VAD already rejects pure noise, and keywords survive it.
        if DENOISE and model_size != "tiny":
            pcm = fw_decode_audio(io.BytesIO(data), sampling_rate=16000)
            t_decode = int((time.time() - t0) * 1000)
            audio_in = spectral_gate(pcm)
            t_gate = int((time.time() - t0) * 1000) - t_decode
        else:
            audio_in = io.BytesIO(data)
        t_stt = time.time()
        segments, info = model.transcribe(
            audio_in,
            language=language,
            vad_filter=True,
            vad_parameters=dict(
                min_silence_duration_ms=VAD_MIN_SILENCE_MS,
                speech_pad_ms=VAD_SPEECH_PAD_MS,
            ),
            # Each utterance is independent: never let a previous sentence
            # bleed in, which is what produces phantom text from noise.
            condition_on_previous_text=False,
            # Single pass, never retry: temperature fallback would multiply
            # a slow call into several. Deterministic ceiling beats retries.
            temperature=0.0,
            beam_size=BEAM_SIZE,
        )
        t_stt = int((time.time() - t_stt) * 1000)
        text = "".join(segment.text for segment in segments).strip()
        ms = int((time.time() - t0) * 1000)
    except InvalidDataError:
        # Truncated/partial audio (e.g. a live interim chunk): nothing to
        # transcribe yet. 200 with empty text, not a failure.
        return jsonify({"text": "", "language": language, "language_probability": 0, "duration": 0, "ms": 0})
    except Exception as exc:  # noqa: BLE001
        app.logger.exception("Transcription failed")
        return jsonify({"error": str(exc)}), 500
    finally:
        _transcribe_lock.release()

    return jsonify({
        "text": text,
        "language": info.language,
        "language_probability": info.language_probability,
        "duration": info.duration,
        "ms": ms,
        "timings": {
            "queue_ms": int((t_locked - t_entry) * 1000),
            "decode_ms": t_decode,
            "gate_ms": t_gate,
            "stt_ms": t_stt,
        },
    })


if __name__ == "__main__":
    # Preload both models so the first interim AND first final never pay
    # download + load latency mid-session.
    get_model(DEFAULT_MODEL)
    get_model("tiny")
    app.run(host=HOST, port=PORT)
