FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# OpenCV runtime deps (libGL + glib) and curl for healthchecks.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system appgroup && useradd --system --gid appgroup --create-home appuser

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY app.py /app/app.py
COPY deepbee_infer.py /app/deepbee_infer.py
COPY LICENSE.deepbee /app/LICENSE.deepbee

# Model .onnx files are NOT baked into the image — mount them at /app/model
# (see README.md). Create the dir so an empty mount still works.
RUN mkdir -p /app/model && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8009

CMD ["python", "app.py"]
