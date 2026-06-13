#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
In-memory DeepBee comb-cell detection + classification (ONNX runtime).

This module is a thin, file-I/O-free adaptation of DeepBee's original
`detection_and_classification.py` pipeline so it can be served behind an HTTP
endpoint. The numeric pipeline (segmentation U-Net -> Circle Hough Transform ->
MobileNet classification with imagenet "caffe" preprocessing) is preserved
verbatim from the original so predictions match the published model.

The two CNNs run via **onnxruntime** rather than TensorFlow: the original
Keras 2.3 `.h5` weights are converted once, offline, to `.onnx` (see
`convert_models.py`). This keeps the runtime container small and framework-free
while producing identical predictions.

DeepBee is MIT-licensed:
    Copyright (c) 2019, Thiago S. Alves, M. Alice Pinto, Paulo Ventura,
    Catia J. Neves, David G. Biron, Arnaldo C. Junior, Pedro L. De Paula Filho,
    Pedro J. Rodrigues.
    https://github.com/AvsThiago/DeepBee-source  (see LICENSE.deepbee)

Adaptations vs. the original:
  * operates on in-memory numpy images instead of reading/writing files;
  * returns aggregate counts instead of CSVs / labeled images;
  * `cv2.findContours` is unpacked compatibly with OpenCV 3.x and 4.x;
  * inference runs on ONNX models (onnxruntime) loaded once and cached;
  * the Keras `preprocess_input` (caffe mode) is reimplemented in numpy.
"""
import base64
import math
import os
from collections import Counter

import cv2
import numpy as np
import onnxruntime as ort

MODEL_DIR = os.environ.get("MODEL_DIR", "model")
MODEL_VERSION = os.environ.get("MODEL_VERSION", "deepbee-1.0")

# Classification class order produced by the DeepBee classification model.
# index -> (original label, hive-pal camelCase key). Order MUST NOT change:
# it is the argmax index order the model was trained with.
DEEPBEE_LABELS = ["Capped", "Eggs", "Honey", "Larves", "Nectar", "Other", "Pollen"]
LABEL_KEYS = [
    "cappedBrood",  # Capped
    "egg",          # Eggs
    "honey",        # Honey
    "larvae",       # Larves
    "nectar",       # Nectar
    "other",        # Other
    "pollen",       # Pollen
]

# ImageNet BGR channel means used by Keras' "caffe" preprocessing mode.
_CAFFE_MEAN_BGR = np.array([103.939, 116.779, 123.68], dtype=np.float32)

# Per-class BGR colors for the overlay, indexed by the model's argmax order
# (DEEPBEE_LABELS). Same palette as DeepBee's original visualization.
_OVERLAY_COLORS = [
    (255, 0, 0),     # Capped  - blue
    (0, 255, 255),   # Eggs    - yellow
    (0, 0, 128),     # Honey   - dark red
    (255, 0, 255),   # Larvae  - magenta
    (0, 255, 0),     # Nectar  - green
    (255, 255, 100), # Other   - cyan-ish
    (0, 0, 255),     # Pollen  - red
]
_OVERLAY_NAMES = ["Capped brood", "Eggs", "Honey", "Larvae", "Nectar", "Other", "Pollen"]
_OVERLAY_MAX_WIDTH = 1600

IMG_SIZE = 224
BATCH_SIZE = 100

_sessions = {"segmentation": None, "classification": None}


def _find_model(keyword):
    files = [f for f in os.listdir(MODEL_DIR) if f.lower().endswith(".onnx")]
    matches = [f for f in files if keyword in f.lower()]
    if not matches:
        raise FileNotFoundError(
            f"No '{keyword}' ONNX model found in '{MODEL_DIR}'. Found: {files}. "
            f"Run convert_models.py to produce them (see README)."
        )
    return os.path.join(MODEL_DIR, matches[0])


def load_models():
    """Load and cache both ONNX inference sessions. Safe to call repeatedly."""
    providers = ort.get_available_providers()
    if _sessions["segmentation"] is None:
        _sessions["segmentation"] = ort.InferenceSession(
            _find_model("segmentation"), providers=providers
        )
    if _sessions["classification"] is None:
        _sessions["classification"] = ort.InferenceSession(
            _find_model("classification"), providers=providers
        )
    return _sessions["segmentation"], _sessions["classification"]


def _run(session, batch):
    """Run an ONNX session on an NHWC float32 batch and return the first output."""
    input_name = session.get_inputs()[0].name
    return session.run(None, {input_name: batch.astype(np.float32)})[0]


def _caffe_preprocess(arr):
    """Keras imagenet_utils.preprocess_input, mode='caffe' (RGB in -> BGR, mean-subtracted)."""
    x = arr.astype(np.float32)[..., ::-1]  # RGB -> BGR
    x -= _CAFFE_MEAN_BGR
    return x


def _find_contours(mask):
    """OpenCV 3.x returns (img, contours, hierarchy); 4.x returns (contours, hierarchy)."""
    found = cv2.findContours(mask, 1, 2)
    return found[0] if len(found) == 2 else found[1]


def segmentation(img, session):
    """Returns (mask, bounding_rect) for the comb area. Verbatim DeepBee logic."""
    IMG_WIDTH_DEST = 482
    IMG_HEIGHT_DEST = 482
    IMG_WIDTH = 128
    IMG_HEIGHT = 128
    IMG_CHANNELS = 3

    original_shape = img.shape[:2]

    if original_shape != (4000, 6000):
        img = cv2.resize(img, (6000, 4000))

    reflect = cv2.copyMakeBorder(img, 184, 184, 148, 148, cv2.BORDER_REFLECT)

    pos_x = np.arange(0, 5785, 482)
    pos_y = np.arange(0, 3857, 482)
    slices = [
        np.s_[y[0] : y[1], x[0] : x[1]]
        for x in zip(pos_x, pos_x + 512)
        for y in zip(pos_y, pos_y + 512)
    ]

    X = np.zeros((len(slices), IMG_HEIGHT, IMG_WIDTH, IMG_CHANNELS), dtype=np.uint8)
    for j, sl in enumerate(slices):
        X[j] = cv2.resize(
            reflect[sl], (IMG_HEIGHT, IMG_WIDTH), interpolation=cv2.INTER_AREA
        )

    preds = _run(session, X)
    preds = (preds > 0.5).astype(np.uint8)

    RESULT_Y = np.zeros((len(preds), IMG_HEIGHT_DEST, IMG_WIDTH_DEST, 1), dtype=np.uint8)
    for j, x in enumerate(preds):
        RESULT_Y[j] = np.expand_dims(
            cv2.resize(x, (512, 512), interpolation=cv2.INTER_LINEAR)[15:497, 15:497],
            axis=-1,
        )

    reconstructed_mask = (
        np.squeeze(np.hstack([np.vstack(i) for i in np.split(RESULT_Y, 13)]))[
            169:4169, 133:6133
        ]
        * 255
    )

    if original_shape != (4000, 6000):
        reconstructed_mask = cv2.resize(
            reconstructed_mask, (original_shape[1], original_shape[0])
        )

    contours = _find_contours(reconstructed_mask)
    max_cnt = contours[np.argmax(np.array([cv2.contourArea(i) for i in contours]))]

    reconstructed_mask *= 0
    cv2.drawContours(reconstructed_mask, [max_cnt], 0, (255, 255, 255), -1)
    bounding_rect = cv2.boundingRect(max_cnt)  # x, y, w, h

    return reconstructed_mask, bounding_rect


def find_circles(img, mask, cnt):
    """Detect cell centers via Circle Hough Transform. Returns Nx3 int array [x, y, r]."""
    x, y, w, h = cnt

    roi = np.copy(img[y : y + h, x : x + w])
    roi = cv2.split(roi)[2]
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(9, 9))
    roi = clahe.apply(roi)
    roi = cv2.bilateralFilter(roi, 5, 50, 50)

    all_points = np.array([])
    for j in range(5, 50, 5):
        points = cv2.HoughCircles(
            roi, cv2.HOUGH_GRADIENT, dp=2, minDist=12,
            param1=145, param2=55, minRadius=j + 1, maxRadius=j + 5,
        )
        if points is not None:
            points = points[0][:, :3].astype(np.int32)
            all_points = np.vstack((all_points, points)) if all_points.size else points

    best_radius = 33 if all_points.size == 0 else np.bincount(all_points[:, -1]).argmax()

    minDist = best_radius * 2 - ((best_radius * 9 / 26) + 75 / 26)
    minRadius = best_radius - max(2, math.floor(best_radius * 0.1))
    maxRadius = best_radius + max(2, math.floor(best_radius * 0.1))

    points = cv2.HoughCircles(
        roi, cv2.HOUGH_GRADIENT, dp=3, minDist=minDist,
        param1=100, param2=25, minRadius=minRadius, maxRadius=maxRadius,
    )

    if points is None:
        return np.empty((0, 3), dtype=np.int32)

    points = points[0][:, :3].astype(np.int32)
    points = points[points[:, 0] < w]
    points = points[points[:, 1] < h]
    points[:, 0] += x
    points[:, 1] += y
    points = points[mask[points[:, 1], points[:, 0]] > 0]
    return points


def extract_circles(image, pts, output_size=224, mean_radius_default=32):
    """Crop and standardize each detected cell to (output_size, output_size). Verbatim DeepBee."""
    pts[:, 2] = output_size / mean_radius_default * pts[:, 2]
    size_border = pts[:, 2].max() + 1
    pts[:, [0, 1]] = pts[:, [0, 1]] + size_border

    img_w_border = cv2.copyMakeBorder(
        image, size_border, size_border, size_border, size_border, cv2.BORDER_REFLECT
    )

    return [
        cv2.resize(
            img_w_border[i[1] - i[2] : i[1] + i[2], i[0] - i[2] : i[0] + i[2]],
            (224, 224),
        )
        for i in pts
    ]


def _draw_overlay(image_bgr, points, pred_idx):
    """Draw a colored circle per detected cell (color = predicted class) plus a
    legend, and return a base64-encoded PNG. Lets a human eyeball detection +
    classification quality."""
    img = np.copy(image_bgr)
    for (x, y, r), idx in zip(points[:, :3], pred_idx):
        cv2.circle(img, (int(x), int(y)), int(r), _OVERLAY_COLORS[int(idx)], 4)

    # Legend: a swatch + "Name: count" per class, scaled to the image size.
    h, w = img.shape[:2]
    scale = max(0.8, w / 1800.0)
    line_h = int(46 * scale)
    pad = int(20 * scale)
    cv2.rectangle(img, (0, 0), (int(520 * scale), pad + line_h * 7), (0, 0, 0), -1)
    for idx, name in enumerate(_OVERLAY_NAMES):
        count = int(np.sum(pred_idx == idx))
        y = pad + line_h * (idx + 1) - int(line_h * 0.3)
        cv2.circle(img, (int(28 * scale), y - int(10 * scale)),
                   int(12 * scale), _OVERLAY_COLORS[idx], -1)
        cv2.putText(img, f"{name}: {count}", (int(52 * scale), y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9 * scale, (255, 255, 255),
                    max(1, int(2 * scale)), cv2.LINE_AA)

    if w > _OVERLAY_MAX_WIDTH:
        ratio = _OVERLAY_MAX_WIDTH / float(w)
        img = cv2.resize(img, (_OVERLAY_MAX_WIDTH, int(h * ratio)))

    ok, buf = cv2.imencode(".png", img)
    if not ok:
        return None
    return base64.b64encode(buf).decode("ascii")


def classify(image_bgr, with_overlay=False):
    """
    Run the full DeepBee pipeline on a single BGR image (as read by cv2.imread).

    Returns a dict:
      { "totalCells": int,
        "counts": {label_key: int, ...},
        "percentages": {label_key: float (0-100), ...},
        "modelVersion": str,
        "overlayPng": base64 str | None }   # only when with_overlay=True
    """
    seg_session, clf_session = load_models()

    mask, cnt = segmentation(image_bgr, seg_session)
    points = find_circles(image_bgr, mask, cnt)

    counts = {key: 0 for key in LABEL_KEYS}
    overlay = None

    if points.shape[0] > 0:
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

        pt = np.copy(points)
        pt[:, 2] = pt[:, 2] // 2

        blob_imgs = np.asarray(extract_circles(image_rgb, np.copy(pt), output_size=IMG_SIZE))
        blob_imgs = _caffe_preprocess(blob_imgs)

        scores = None
        for start in range(0, len(blob_imgs), BATCH_SIZE):
            chunk = blob_imgs[start : start + BATCH_SIZE]
            output = _run(clf_session, chunk)
            scores = output if scores is None else np.vstack((scores, output))

        labels = np.argmax(scores, axis=1)
        per_index = Counter(labels)
        for idx, key in enumerate(LABEL_KEYS):
            counts[key] = int(per_index.get(idx, 0))

        if with_overlay:
            overlay = _draw_overlay(image_bgr, points, labels)

    total = int(sum(counts.values()))
    percentages = {
        key: round(100.0 * counts[key] / total, 2) if total else 0.0
        for key in LABEL_KEYS
    }

    result = {
        "totalCells": total,
        "counts": counts,
        "percentages": percentages,
        "modelVersion": MODEL_VERSION,
    }
    if with_overlay:
        result["overlayPng"] = overlay
    return result
