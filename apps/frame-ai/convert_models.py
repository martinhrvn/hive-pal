#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
One-time, OFFLINE conversion of DeepBee's Keras `.h5` weights to `.onnx`.

This is the only place TensorFlow is needed. The runtime service
(app.py / deepbee_infer.py) uses onnxruntime only.

Usage:
    pip install -r requirements-convert.txt
    python convert_models.py            # reads MODEL_DIR/*.h5 -> writes *.onnx

Place the two source models in MODEL_DIR (default: ./model) first:
  * segmentation*.h5   (ships in the DeepBee repo)
  * classification*.h5 (Google Drive — see README)
"""
import os
import sys

import tensorflow as tf
import tf2onnx

MODEL_DIR = os.environ.get("MODEL_DIR", "model")
OPSET = int(os.environ.get("ONNX_OPSET", "13"))


def _patch_backend_slice():
    """DeepBee's classification .h5 was saved from a keras multi_gpu_model whose
    batch-slicing Lambdas call keras.backend.slice — removed in modern keras.
    Restore it so the wrapped model can load."""
    for backend in (
        getattr(tf.keras, "backend", None),
        _try_import("keras.backend"),
    ):
        if backend is not None and not hasattr(backend, "slice"):
            backend.slice = tf.slice


def _try_import(name):
    try:
        return __import__(name, fromlist=["_"])
    except Exception:
        return None


def _unwrap_multi_gpu(model):
    """A multi_gpu_model wraps the real classifier as a nested Model and only
    adds input-slicing / output-concat for the GPU towers. For inference we want
    that shared base model (full image in -> 7-class softmax out)."""
    nested = [l for l in model.layers if isinstance(l, tf.keras.Model)]
    if nested:
        base = max(nested, key=lambda m: m.count_params())
        print(f"  detected multi-GPU wrapper; extracting base model '{base.name}'")
        return base
    return model


def find_h5(keyword):
    for f in os.listdir(MODEL_DIR):
        if keyword in f.lower() and f.lower().endswith(".h5"):
            return os.path.join(MODEL_DIR, f)
    raise FileNotFoundError(
        f"No '{keyword}' .h5 model found in '{MODEL_DIR}'. See README for downloads."
    )


def convert(keyword):
    h5_path = find_h5(keyword)
    onnx_path = os.path.join(MODEL_DIR, f"{keyword}.onnx")

    print(f"Loading {h5_path} ...")
    model = tf.keras.models.load_model(h5_path, compile=False)
    model = _unwrap_multi_gpu(model)

    # Preserve a dynamic batch dimension (None) so the service can feed
    # variable-sized batches, matching the original Keras behaviour.
    input_signature = tuple(
        tf.TensorSpec(inp.shape, inp.dtype, name=inp.name.split(":")[0])
        for inp in model.inputs
    )

    print(f"Converting -> {onnx_path} (opset {OPSET}) ...")
    tf2onnx.convert.from_keras(
        model,
        input_signature=input_signature,
        opset=OPSET,
        output_path=onnx_path,
    )
    print(f"  wrote {onnx_path}")


def main():
    _patch_backend_slice()
    for keyword in ("segmentation", "classification"):
        convert(keyword)
    print("Done. The runtime container only needs the .onnx files.")


if __name__ == "__main__":
    try:
        main()
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
