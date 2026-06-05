"""
Pull-based worker for HivePal.

Polls the HivePal server for pending transcription and analysis jobs,
processes them locally using faster-whisper and Ollama, and posts the
results back. Reuses the pipeline functions from app.py.

Run with:
    HIVEPAL_URL=http://localhost:3000 \\
    WORKER_TOKEN=hpw_xxxxx \\
    python worker.py
"""
import logging
import os
import sys
import tempfile
import time

import requests

from app import (
    map_ai_to_form_draft,
    recommend_from_transcript,
    transcribe_file,
    truncate_transcript,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("hivepal-worker")

HIVEPAL_URL = os.environ.get("HIVEPAL_URL", "").rstrip("/")
WORKER_TOKEN = os.environ.get("WORKER_TOKEN", "").strip()
POLL_INTERVAL_SECONDS = float(os.environ.get("POLL_INTERVAL_SECONDS", "5"))
DOWNLOAD_TIMEOUT = int(os.environ.get("DOWNLOAD_TIMEOUT_SECONDS", "300"))
REQUEST_TIMEOUT = int(os.environ.get("REQUEST_TIMEOUT_SECONDS", "60"))

if not HIVEPAL_URL:
    log.error("HIVEPAL_URL is required")
    sys.exit(1)
if not WORKER_TOKEN:
    log.error("WORKER_TOKEN is required")
    sys.exit(1)


def auth_headers():
    return {"Authorization": f"Bearer {WORKER_TOKEN}"}


def server_post(path: str, json_body=None, timeout: int = REQUEST_TIMEOUT):
    url = f"{HIVEPAL_URL}{path}"
    return requests.post(
        url,
        json=json_body,
        headers=auth_headers(),
        timeout=timeout,
    )


def extension_for_mime(mime: str) -> str:
    return {
        "audio/webm": ".webm",
        "audio/mp3": ".mp3",
        "audio/mpeg": ".mp3",
        "audio/ogg": ".ogg",
        "audio/wav": ".wav",
    }.get(mime, ".audio")


def download_audio(download_url: str, mime_type: str) -> str:
    """Download to a temp file and return its path. Caller must unlink."""
    suffix = extension_for_mime(mime_type)
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        path = tmp.name
        with requests.get(download_url, stream=True, timeout=DOWNLOAD_TIMEOUT) as r:
            r.raise_for_status()
            for chunk in r.iter_content(chunk_size=64 * 1024):
                if chunk:
                    tmp.write(chunk)
    return path


def process_transcription_job() -> bool:
    """Returns True if a job was processed (success or failure)."""
    try:
        resp = server_post("/api/worker/jobs/transcription/claim")
    except requests.RequestException as exc:
        log.warning("Failed to poll transcription claim: %s", exc)
        return False

    if resp.status_code == 401:
        log.error("Worker token rejected (401). Exiting.")
        sys.exit(2)
    if not resp.ok:
        log.warning("Transcription claim returned %s: %s", resp.status_code, resp.text)
        return False

    job = (resp.json() or {}).get("job")
    if not job:
        return False

    audio_id = job["audioId"]
    log.info("Claimed transcription job audioId=%s", audio_id)

    audio_path = None
    try:
        audio_path = download_audio(job["downloadUrl"], job.get("mimeType", ""))
        log.info("Downloaded audio to %s; transcribing...", audio_path)

        result = transcribe_file(audio_path)
        text = result.get("text", "")
        duration = result.get("duration")
        body = {"text": text}
        # Backend schema requires positive duration if provided; skip otherwise.
        if isinstance(duration, (int, float)) and duration and duration > 0:
            body["duration"] = float(duration)

        complete = server_post(
            f"/api/worker/jobs/transcription/{audio_id}/complete",
            json_body=body,
        )
        if not complete.ok:
            log.error(
                "Transcription complete POST failed (%s): %s",
                complete.status_code,
                complete.text,
            )
        else:
            log.info(
                "Transcription complete audioId=%s chars=%d",
                audio_id,
                len(text),
            )

    except Exception as exc:
        log.exception("Transcription job failed audioId=%s", audio_id)
        try:
            server_post(
                f"/api/worker/jobs/transcription/{audio_id}/fail",
                json_body={"error": str(exc)[:2000]},
            )
        except requests.RequestException as report_exc:
            log.warning("Could not report transcription failure: %s", report_exc)

    finally:
        if audio_path:
            try:
                os.unlink(audio_path)
            except OSError:
                pass

    return True


def process_analysis_job() -> bool:
    try:
        resp = server_post("/api/worker/jobs/analysis/claim")
    except requests.RequestException as exc:
        log.warning("Failed to poll analysis claim: %s", exc)
        return False

    if resp.status_code == 401:
        log.error("Worker token rejected (401). Exiting.")
        sys.exit(2)
    if not resp.ok:
        log.warning("Analysis claim returned %s: %s", resp.status_code, resp.text)
        return False

    job = (resp.json() or {}).get("job")
    if not job:
        return False

    audio_id = job["audioId"]
    log.info("Claimed analysis job audioId=%s", audio_id)

    try:
        transcript = truncate_transcript(job.get("transcription") or "")
        if not transcript:
            raise ValueError("Empty transcript in analysis job")

        log.info("Running AI analysis for audioId=%s", audio_id)
        ai_result = recommend_from_transcript(transcript)
        draft = map_ai_to_form_draft(ai_result)

        complete = server_post(
            f"/api/worker/jobs/analysis/{audio_id}/complete",
            json_body={"inspectionDraft": draft},
        )
        if not complete.ok:
            log.error(
                "Analysis complete POST failed (%s): %s",
                complete.status_code,
                complete.text,
            )
        else:
            log.info("Analysis complete audioId=%s", audio_id)

    except Exception as exc:
        log.exception("Analysis job failed audioId=%s", audio_id)
        try:
            server_post(
                f"/api/worker/jobs/analysis/{audio_id}/fail",
                json_body={"error": str(exc)[:2000]},
            )
        except requests.RequestException as report_exc:
            log.warning("Could not report analysis failure: %s", report_exc)

    return True


def heartbeat():
    try:
        server_post("/api/worker/heartbeat")
    except requests.RequestException as exc:
        log.debug("Heartbeat failed: %s", exc)


def run_forever():
    log.info(
        "Worker started. server=%s poll_interval=%ss",
        HIVEPAL_URL,
        POLL_INTERVAL_SECONDS,
    )
    while True:
        try:
            did_work = process_transcription_job() or process_analysis_job()
            if not did_work:
                heartbeat()
                time.sleep(POLL_INTERVAL_SECONDS)
        except KeyboardInterrupt:
            log.info("Shutting down (KeyboardInterrupt)")
            return
        except Exception:
            log.exception("Unexpected error in worker loop; backing off")
            time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    run_forever()
