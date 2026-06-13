#!/usr/bin/env bash
#
# Download DeepBee's source weights and convert them to ONNX, entirely inside an
# ephemeral Python 3.6 container (Dockerfile.convert). Requires only Docker +
# curl on the host — no local Python (handy on NixOS).
#
# Python 3.6 is required because DeepBee's segmentation model embeds a Keras
# Lambda layer as marshaled 3.6 bytecode that newer Python cannot unmarshal.
#
# Result: model/segmentation.onnx + model/classification.onnx
#
# Usage:
#   ./convert.sh
#
set -euo pipefail
cd "$(dirname "$0")"

mkdir -p model

SEG_H5="model/segmentation.h5"
CLF_GDRIVE_ID="15P1tQ5658Hc6Q80PiygZOH-w45FG0nEj"
SEG_URL="https://github.com/AvsThiago/DeepBee-source/raw/release-0.1/src/DeepBee/software/model/segmentation.h5"

# Segmentation weights are a plain HTTP download — curl, no Python needed.
if [ ! -f "$SEG_H5" ]; then
  echo "==> Downloading segmentation.h5"
  curl -L -o "$SEG_H5" "$SEG_URL"
else
  echo "==> segmentation.h5 already present, skipping"
fi

echo "==> Building conversion image (Python 3.6 + TF 2.6 + tf2onnx)"
docker build -f Dockerfile.convert -t hivepal-frame-ai-convert .

# Classification weights (Google Drive) + the conversion both run in the
# container so the host stays Python-free.
echo "==> Running gdown + tf2onnx conversion"
docker run --rm -v "$PWD:/work" -w /work hivepal-frame-ai-convert bash -c '
  set -e
  if [ ! -f model/classification.h5 ]; then
    echo "Downloading classification.h5 from Google Drive"
    gdown '"$CLF_GDRIVE_ID"' -O model/classification.h5
  else
    echo "classification.h5 already present, skipping"
  fi
  python convert_models.py
'

echo "==> Done. ONNX models:"
ls -lh model/*.onnx
