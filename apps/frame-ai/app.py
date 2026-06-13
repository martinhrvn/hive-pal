#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HivePal Frame-AI service.

A thin Flask wrapper around the DeepBee comb-cell detection + classification
pipeline (see deepbee_infer.py). Mirrors the auth / error conventions of the
sibling `ai-app` service.

Endpoints:
  POST /classify-frame   multipart `file` (a comb frame image) -> stats JSON
  GET  /health           liveness + model-loaded status
"""
import os
import tempfile

import cv2
from flask import Flask, abort, jsonify, request

import deepbee_infer

app = Flask(__name__)

FRAME_AI_API_KEY = (os.environ.get("FRAME_AI_API_KEY") or "").strip()
PORT = int(os.environ.get("PORT", "8009"))
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp"}


def require_api_key(req):
    if not FRAME_AI_API_KEY:
        return
    auth = req.headers.get("Authorization", "")
    if auth != f"Bearer {FRAME_AI_API_KEY}":
        abort(401, description="Unauthorized")


@app.post("/classify-frame")
def classify_frame():
    require_api_key(request)

    if "file" not in request.files:
        return jsonify({"error": "file is required"}), 400

    uploaded = request.files["file"]
    if not uploaded.filename:
        return jsonify({"error": "empty filename"}), 400

    suffix = os.path.splitext(uploaded.filename)[1].lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        return jsonify({"error": f"unsupported file type: {suffix}"}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        uploaded.save(tmp.name)
        temp_path = tmp.name

    # Opt-in annotated overlay (base64 PNG) — handy for eyeballing results.
    with_overlay = (request.form.get("overlay", "") or "").lower() in (
        "1", "true", "yes", "on",
    )

    try:
        image = cv2.imread(temp_path)
        if image is None:
            return jsonify({"error": "could not decode image"}), 400
        result = deepbee_infer.classify(image, with_overlay=with_overlay)
        result["status"] = "completed"
        result.setdefault("overlayPng", None)
        return jsonify(result)
    except Exception as exc:  # noqa: BLE001 - surface failures to the caller
        app.logger.exception("classify-frame failed")
        return jsonify({"error": str(exc)}), 500
    finally:
        try:
            os.unlink(temp_path)
        except OSError:
            pass


@app.get("/health")
def health():
    models_loaded = (
        deepbee_infer._sessions["segmentation"] is not None
        and deepbee_infer._sessions["classification"] is not None
    )
    return jsonify(
        {
            "status": "ok",
            "modelsLoaded": models_loaded,
            "modelVersion": deepbee_infer.MODEL_VERSION,
        }
    )


if __name__ == "__main__":
    # Warm the models at startup so the first request is not penalized and
    # a missing model file fails fast.
    try:
        deepbee_infer.load_models()
        app.logger.info("DeepBee models loaded")
    except Exception:  # noqa: BLE001
        app.logger.exception("Failed to preload models; will retry on first request")
    app.run(host="0.0.0.0", port=PORT)
