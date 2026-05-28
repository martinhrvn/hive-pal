# Prototype AI-Setup for Hivepal

This prototype setup can be used to automatically analyze audiorecordings, create a transcript of the recording and analyze the transcript to create a .json-File which can be used to create and inspection.

This prototype uses

- python with faster-whister for Speech-to-Text and transcribing
- Ollama for analyzing the transscript and creating the .json

Note: If you change app.py you have to restart the container.

Currently the folder-setup below is expected:

```js
/mnt/path/Hivepal/AI/
                    incoming/
                    processed/
                    transcripts/
                    prompts/
                    ollama/
```

Below is the docker file I use for the AI Container. I just added it to the docker stack for hivepal so everything runs together. I recently switched the model from qwen3:8b to qwen2.5:3b as I currently only use CPU-computing. The code in general is model-agnostic - you can set your desired model using the OLLAMA_MODEL enviroment variable. The image runs as user appuser (ID:999). This user needs r+w permissions to the path  mounted for data.

Whisper is currently set to auto-detect the language.

```js
services:
  ollama:
    image: ollama/ollama:latest
    container_name: hivepal-ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - /mnt/path/Apps/HivePal/AI/ollama:/root/.ollama

  hivepal-ai:
    image: python:3.11-slim
    container_name: hivepal-ai
    restart: unless-stopped
    working_dir: /app
    command: >
      bash -lc "
      apt-get update &&
      apt-get install -y ffmpeg &&
      pip install --no-cache-dir flask requests faster-whisper watchdog &&
      python app.py
      "
    ports:
      - "8008:8008"
    environment:
  - OLLAMA_URL=http://ollama:11434/api/chat
  - OLLAMA_MODEL=qwen2.5:3b
  - WHISPER_MODEL=small
  - WHISPER_COMPUTE_TYPE=int8
  - AUDIO_INPUT_DIR=/data/incoming
  - TRANSCRIPTS_DIR=/data/transcripts
  - OUTPUT_DIR=/data/processed
  - AI_API_KEY=change-me-long-random-string
    volumes:
      - /mnt/path/Apps/HivePal/AI:/data
      - /mnt/path/Apps/HivePal/AI/app:/app
    depends_on:
      - ollama
```

You need to add the ENV-Variables bleow to the hivepal container. Additionally you need some kind of storage. I prefer local, but S3 works as well.

```js
  AI_ENABLED: "true"
  AI_SERVICE_BASE_URL: "http://YOUR-AI-HOST:8008"
  AI_API_KEY: "change-me-long-random-string"
  AI_REQUEST_TIMEOUT_MS: "300000"
  BACKEND_PUBLIC_URL: https://mydomain.tld OR ip
  FRONTEND_URL: http://mydomain.tld OR ip
  STORAGE_TYPE: local
```

After running the container for the first time you have to download the model. The model has a size of about 6 GB so the download may take some time.

```js
curl http://serverip:11434/api/pull -d '{
  "model": "qwen2.5:3b",
  "stream": false
}'
```

Or just run the code below inside the container

```js
  ollama pull <Model-Name>
```

Use the command below to see if  everything is running correctly:

```js
curl http://serverip:8008/health
```

After that you can put audio-files into the folder "incoming". You can start analyzing with

```js
curl -X POST http://serverip:8008/process \
  -H "Content-Type: application/json" \
  -d '{
    "audio_path": "/data/incoming/test-datei1.webm"
  }'
```
You can process all audio files in the "incoming" folder with

```js
curl -X POST http://serverip:8008/process_incoming
```

## Running as a pull worker (recommended for occasionally-on machines)

Instead of exposing this service over HTTP so the HivePal backend can push
audio to it, you can run `worker.py` which polls the HivePal server for
pending jobs and pushes results back. This works well when the AI box is on
your home network and your HivePal instance is hosted elsewhere — only
outbound HTTP from the AI box is required.

### Setup

1. In the HivePal backend `.env`, set:
   ```
   AI_PROCESSING_MODE=pull     # or "auto" (pull with push fallback after AI_PULL_FALLBACK_MINUTES)
   ```
   Restart the backend.

2. Log into HivePal as an admin, go to **Admin → Worker Tokens**, click
   **New token**, give it a name (e.g. `home-desktop`), and **copy the
   plaintext token immediately** — it will not be shown again.

3. Run the worker. Either directly with Python:
   ```bash
   HIVEPAL_URL=https://your-hivepal-instance.com \
   WORKER_TOKEN=hpw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
   OLLAMA_URL=http://localhost:11434/api/chat \
   OLLAMA_MODEL=qwen2.5:3b \
   WHISPER_MODEL=small \
   WHISPER_COMPUTE_TYPE=int8 \
   python worker.py
   ```

   Or with Docker Compose (recommended — also runs Ollama for you):
   ```bash
   cp .env.worker.example .env
   # edit .env with your HIVEPAL_URL and WORKER_TOKEN
   docker compose -f docker-compose.worker.yml up -d --build
   # one-time: pull the model into the ollama container
   docker compose -f docker-compose.worker.yml exec ollama ollama pull qwen2.5:3b
   # follow worker logs
   docker compose -f docker-compose.worker.yml logs -f hivepal-worker
   ```

   On startup, `whisper` will load (no model download is needed if it was
   previously cached). The worker will print one line per poll cycle when
   idle and detailed progress when it claims a job.

4. Verify in `/admin/worker-tokens` — the row for your token should turn
   green ("Online") within ~30 seconds.

### Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `HIVEPAL_URL` | yes | — | Base URL of your HivePal backend, e.g. `https://hivepal.example.com` |
| `WORKER_TOKEN` | yes | — | The `hpw_…` token from the admin UI |
| `POLL_INTERVAL_SECONDS` | no | `5` | Sleep between polls when idle |
| `OLLAMA_URL` | no | `http://ollama:11434/api/chat` | Ollama chat endpoint |
| `OLLAMA_MODEL` | no | `qwen3:8b` | Ollama model name (must be pulled locally) |
| `WHISPER_MODEL` | no | `small` | faster-whisper model size |
| `WHISPER_COMPUTE_TYPE` | no | `int8` | faster-whisper compute type |
| `DOWNLOAD_TIMEOUT_SECONDS` | no | `300` | Max time to download an audio file |

### Notes

- **One process handles both stages.** The loop first asks for a
  transcription job; if none, it asks for an analysis job; if still none, it
  sends a heartbeat and sleeps.
- **Lease expiry.** The server gives each claim a 5-minute lease by default
  (`WORKER_JOB_LEASE_MS`). If Whisper takes longer than that on a long
  recording, the server will requeue the job and another worker (or the
  same one on retry) will pick it up. Increase `WORKER_JOB_LEASE_MS` on the
  backend if you regularly process long recordings.
- **Stopping.** `Ctrl+C` exits cleanly. Any in-flight job will simply
  lease-expire on the server within a minute or two and be retried.

