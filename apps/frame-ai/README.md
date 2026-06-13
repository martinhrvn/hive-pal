# HivePal Frame-AI

A standalone inference service that runs the **DeepBee** comb-cell detection +
classification pipeline. Given a photo of a honeycomb frame it detects cells and
classifies each into one of seven classes, returning aggregate counts.

It is a sibling to `apps/ai-app` (audio transcription) and is kept separate
because it bundles its own CV/ML stack.

Inference runs on **onnxruntime** — no TensorFlow in the runtime image.
DeepBee's original Keras `.h5` weights are converted once, offline, to `.onnx`
(see *Models* below); TensorFlow is only needed for that one-time conversion.

Based on [DeepBee](https://github.com/AvsThiago/DeepBee-source) (MIT, 2019,
Alves et al.) — see `LICENSE.deepbee`. Paper:
*Automatic detection and classification of honey bee comb cells using deep learning*.

## Classes

`egg`, `larvae`, `cappedBrood`, `honey`, `pollen`, `nectar`, `other`.

## Models

The two ONNX models (`model/segmentation.onnx`, `model/classification.onnx`) are
**committed to the repo** — nothing to download or convert; just run the service.
They are derived from DeepBee's MIT-licensed weights (see `LICENSE.deepbee`).

The loader matches files by the substrings `segmentation` and `classification`.
To regenerate them (e.g. from a newer DeepBee release), see
[Regenerating the models](#regenerating-the-models) below.

## Run

```bash
# from apps/frame-ai/
FRAME_AI_API_KEY=dev-secret docker compose -f docker-compose.frame-ai.yml up --build
```

The service listens on `http://localhost:8009`.

## Test

```bash
curl -s http://localhost:8009/health

curl -s -X POST http://localhost:8009/classify-frame \
  -H "Authorization: Bearer dev-secret" \
  -F "file=@/path/to/frame.jpg" | jq
```

Example response:

```json
{
  "status": "completed",
  "totalCells": 1180,
  "counts":      { "egg": 40, "larvae": 95, "cappedBrood": 410, "honey": 250, "pollen": 120, "nectar": 180, "other": 85 },
  "percentages": { "egg": 3.39, "larvae": 8.05, "cappedBrood": 34.75, "honey": 21.19, "pollen": 10.17, "nectar": 15.25, "other": 7.2 },
  "modelVersion": "deepbee-1.0",
  "overlayPng": null
}
```

## Environment

| var               | default       | meaning |
| ----------------- | ------------- | ------- |
| `FRAME_AI_API_KEY`| _(empty)_     | if set, requests must send `Authorization: Bearer <key>` |
| `MODEL_DIR`       | `model`       | directory holding the two `.onnx` files |
| `MODEL_VERSION`   | `deepbee-1.0` | echoed back in responses, stored with each analysis |
| `PORT`            | `8009`        | HTTP port |

## Notes / caveats

- DeepBee was trained on fairly standard, well-lit, roughly frame-filling comb
  photos. Phone snapshots with heavy glare, angle, or partial frames will degrade
  accuracy. This is a spike — treat the numbers as approximate.
- The segmentation step resizes input to 6000×4000 internally; inference is a few
  seconds per image on CPU.
- ONNX preserves the original learned weights exactly, so predictions match the
  published Keras model to floating-point tolerance — the conversion changes the
  runtime, not the results. The same `.onnx` files can later run on GPU
  (`onnxruntime-gpu`) or in-browser (`onnxruntime-web`) without re-converting.
- If a future DeepBee model uses custom layers that don't convert cleanly, fall
  back to loading the `.h5` with `tf.keras` (git history has that variant).

## Regenerating the models

You only need this to rebuild the committed `.onnx` (e.g. from a newer DeepBee
release). The conversion tooling (`convert.sh`, `Dockerfile.convert`,
`convert_models.py`, `requirements-convert.txt`) is kept for this purpose.

```bash
cd apps/frame-ai
./convert.sh        # downloads .h5 weights + converts -> model/*.onnx
```

`convert.sh` does everything inside an ephemeral **Python 3.6** container, so the
host needs only Docker + curl (handy on NixOS). It skips any `.h5`/`.onnx`
already present, so it's safe to re-run.

Two gotchas the tooling already handles, worth knowing if you adapt it:

- **Python 3.6 is mandatory for conversion.** DeepBee's segmentation model has a
  Keras `Lambda` layer stored as marshaled **3.6** bytecode; newer Python can't
  unmarshal it (`EOFError: EOF read where object expected`). tf2onnx then traces
  the model into concrete ONNX ops, so the *output* runs on any modern
  onnxruntime — the 3.6 constraint is build-time only.
- **The classifier is a `multi_gpu_model`.** `convert_models.py` restores the
  removed `keras.backend.slice` so it loads, then extracts the shared base model
  (dropping the GPU-slicing scaffold) before export.
