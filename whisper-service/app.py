import io
import os
import threading

from flask import Flask, jsonify, request
from faster_whisper import WhisperModel

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "small")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")
DEFAULT_LANGUAGE = os.environ.get("WHISPER_LANGUAGE", "fr")
HOST = os.environ.get("WHISPER_HOST", "127.0.0.1")
PORT = int(os.environ.get("WHISPER_PORT", "8001"))

app = Flask(__name__)

_model = None
_model_lock = threading.Lock()


def get_model():
    global _model
    with _model_lock:
        if _model is None:
            _model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
            app.logger.info(
                "Loaded Whisper model '%s' (device=%s, compute_type=%s)",
                MODEL_SIZE, DEVICE, COMPUTE_TYPE,
            )
    return _model


@app.get("/health")
def health():
    return jsonify({"status": "ok", "model": MODEL_SIZE, "device": DEVICE, "loaded": _model is not None})


@app.post("/transcribe")
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "Champ 'audio' manquant"}), 400

    upload = request.files["audio"]
    if not upload.filename:
        return jsonify({"error": "Fichier audio vide"}), 400

    language = request.form.get("language") or DEFAULT_LANGUAGE
    data = upload.read()
    if not data:
        return jsonify({"error": "Fichier audio vide"}), 400

    try:
        model = get_model()
        segments, info = model.transcribe(
            io.BytesIO(data),
            language=language,
            vad_filter=True,
            beam_size=5,
        )
        text = "".join(segment.text for segment in segments).strip()
    except Exception as exc:  # noqa: BLE001
        app.logger.exception("Transcription failed")
        return jsonify({"error": str(exc)}), 500

    return jsonify({
        "text": text,
        "language": info.language,
        "language_probability": info.language_probability,
        "duration": info.duration,
    })


if __name__ == "__main__":
    get_model()
    app.run(host=HOST, port=PORT)
