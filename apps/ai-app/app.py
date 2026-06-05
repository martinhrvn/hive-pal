import json
import os
import pathlib
import time
import tempfile
from flask import Flask, abort, jsonify, request, Response, stream_with_context
from faster_whisper import WhisperModel
import requests

app = Flask(__name__)
AI_API_KEY = (os.environ.get("AI_API_KEY") or "").strip()

AI_PROVIDER = os.environ.get("AI_PROVIDER", "ollama").lower()  # ollama | openai | anthropic

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://ollama:11434/api/chat")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3:8b")

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "small")
WHISPER_COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")

AUDIO_INPUT_DIR = pathlib.Path(os.environ.get("AUDIO_INPUT_DIR", "/data/incoming"))
TRANSCRIPTS_DIR = pathlib.Path(os.environ.get("TRANSCRIPTS_DIR", "/data/transcripts"))
OUTPUT_DIR = pathlib.Path(os.environ.get("OUTPUT_DIR", "/data/processed"))

MAX_TRANSCRIPT_CHARS = int(os.environ.get("MAX_TRANSCRIPT_CHARS", "12000"))

SUPPORTED_EXTENSIONS = {
    ".wav", ".mp3", ".m4a", ".flac", ".ogg", ".mp4", ".mpeg", ".mpga", ".webm"
}

for folder in [AUDIO_INPUT_DIR, TRANSCRIPTS_DIR, OUTPUT_DIR]:
    folder.mkdir(parents=True, exist_ok=True)

whisper = WhisperModel(
    WHISPER_MODEL,
    device="cpu",
    compute_type=WHISPER_COMPUTE_TYPE,
)

SCHEMA = {
    "type": "object",
    "properties": {
        "hiveId": {
            "type": ["string", "null"]
        },
        "date": {
            "type": ["string", "null"],
            "description": "ISO 8601 datetime string if the transcript clearly states the inspection date/time; otherwise null"
        },
        "temperature": {
            "type": ["number", "null"]
        },
        "weatherConditions": {
            "type": ["string", "null"]
        },
        "notes": {
            "type": ["string", "null"]
        },
        "observations": {
            "type": "object",
            "properties": {
                "strength": {"type": ["integer", "null"], "minimum": 0},
                "uncappedBrood": {"type": ["integer", "null"], "minimum": 0, "maximum": 10},
                "cappedBrood": {"type": ["integer", "null"], "minimum": 0, "maximum": 10},
                "honeyStores": {"type": ["integer", "null"], "minimum": 0, "maximum": 10},
                "pollenStores": {"type": ["integer", "null"], "minimum": 0, "maximum": 10},
                "totalFrames": {"type": ["integer", "null"], "minimum": 0},
                "eggsFrames": {"type": ["integer", "null"], "minimum": 0},
                "uncappedBroodFrames": {"type": ["integer", "null"], "minimum": 0},
                "cappedBroodFrames": {"type": ["integer", "null"], "minimum": 0},
                "droneBroodFrames": {"type": ["integer", "null"], "minimum": 0},
                "pollenFrames": {"type": ["integer", "null"], "minimum": 0},
                "nectarFrames": {"type": ["integer", "null"], "minimum": 0},
                "honeyFrames": {"type": ["integer", "null"], "minimum": 0},
                "emptyFrames": {"type": ["integer", "null"], "minimum": 0},
                "queenCells": {"type": ["integer", "null"], "minimum": 0},
                "swarmCells": {"type": ["boolean", "null"]},
                "supersedureCells": {"type": ["boolean", "null"]},
                "queenSeen": {"type": ["boolean", "null"]},
                "broodPattern": {
                    "type": ["string", "null"],
                    "enum": ["solid", "spotty", "scattered", "patchy", "excellent", "poor", None]
                },
                "additionalObservations": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": [
                            "calm",
                            "defensive",
                            "aggressive",
                            "nervous",
                            "varroa_present",
                            "small_hive_beetle",
                            "wax_moths",
                            "ants_present",
                            "healthy",
                            "active",
                            "sluggish",
                            "thriving"
                        ]
                    }
                },
                "reminderObservations": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": [
                            "honey_bound",
                            "overcrowded",
                            "needs_super",
                            "queen_issues",
                            "requires_treatment",
                            "low_stores",
                            "prepare_for_winter"
                        ]
                    }
                }
            },
            "required": [
                "strength",
                "uncappedBrood",
                "cappedBrood",
                "honeyStores",
                "pollenStores",
                "totalFrames",
                "eggsFrames",
                "uncappedBroodFrames",
                "cappedBroodFrames",
                "droneBroodFrames",
                "pollenFrames",
                "nectarFrames",
                "honeyFrames",
                "emptyFrames",
                "queenCells",
                "swarmCells",
                "supersedureCells",
                "queenSeen",
                "broodPattern",
                "additionalObservations",
                "reminderObservations"
            ]
        },
        "actions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": [
                            "FEEDING",
                            "TREATMENT",
                            "FRAME",
                            "MAINTENANCE",
                            "NOTE",
                            "OTHER"
                        ]
                    },
                    "notes": {
                        "type": ["string", "null"]
                    },
                    "details": {
                        "type": "object",
                        "properties": {
                            "type": {
                                "type": "string",
                                "enum": [
                                    "FEEDING",
                                    "TREATMENT",
                                    "FRAME",
                                    "MAINTENANCE",
                                    "NOTE",
                                    "OTHER"
                                ]
                            },
                            "feedType": {"type": ["string", "null"]},
                            "amount": {"type": ["number", "null"]},
                            "unit": {"type": ["string", "null"]},
                            "concentration": {"type": ["string", "null"]},
                            "product": {"type": ["string", "null"]},
                            "quantity": {"type": ["number", "null"]},
                            "duration": {"type": ["string", "null"]},
                            "component": {
                                "type": ["string", "null"],
                                "enum": ["BOX", "BOTTOM_BOARD", "COVER", None]
                            },
                            "status": {
                                "type": ["string", "null"],
                                "enum": ["CLEANED", "REPLACED", None]
                            },
                            "content": {"type": ["string", "null"]}
                        },
                        "required": ["type"]
                    }
                },
                "required": ["type", "details"]
            }
        }
    },
    "required": [
        "hiveId",
        "date",
        "temperature",
        "weatherConditions",
        "notes",
        "observations",
        "actions"
    ]
}

def empty_form_draft():
    return {
        "temperature": None,
        "weatherConditions": None,
        "notes": None,
        "observations": {
            "strength": None,
            "uncappedBrood": None,
            "cappedBrood": None,
            "honeyStores": None,
            "pollenStores": None,
            "totalFrames": None,
            "eggsFrames": None,
            "uncappedBroodFrames": None,
            "cappedBroodFrames": None,
            "droneBroodFrames": None,
            "pollenFrames": None,
            "nectarFrames": None,
            "honeyFrames": None,
            "emptyFrames": None,
            "queenCells": None,
            "swarmCells": None,
            "supersedureCells": None,
            "queenSeen": None,
            "broodPattern": None,
            "additionalObservations": [],
            "reminderObservations": [],
        },
        "actions": [],
    }

def truncate_transcript(text: str, max_chars: int = MAX_TRANSCRIPT_CHARS) -> str:
    text = (text or "").strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars]


def require_api_key(req):
    if not AI_API_KEY:
        return
    auth = req.headers.get("Authorization", "")
    expected = f"Bearer {AI_API_KEY}"
    if auth != expected:
        from flask import abort
        abort(401, description="Unauthorized")


def transcribe_file(audio_path: str):
    segments, info = whisper.transcribe(
        audio_path,
        vad_filter=True,
        beam_size=5,
    )

    segment_list = []
    full_text_parts = []

    for seg in segments:
        text = seg.text.strip()
        segment_list.append({
            "start": seg.start,
            "end": seg.end,
            "text": text
        })
        if text:
            full_text_parts.append(text)

    return {
        "language": getattr(info, "language", None),
        "language_probability": getattr(info, "language_probability", None),
        "duration": getattr(info, "duration", None),
        "text": " ".join(full_text_parts).strip(),
        "segments": segment_list,
    }


def build_prompt(transcript: str):
    return f"""
You extract structured hive inspection data from a beekeeper's spoken transcript.

Return JSON that matches the provided schema exactly.

Hard rules:
- Be conservative.
- Do not invent facts.
- Only include information explicitly stated or clearly implied.
- Use the exact field names and enum values from the schema.
- Do not return extra keys.
- If a value is unknown, use null.
- If a list field is unknown, return [].
- If notes are unknown, return null.
- If no actions are mentioned, return [].
- If no observations are mentioned, keep the observations object but set its unknown values to null and arrays to [].

Field mapping rules:
- hiveId:
  - only fill this if the transcript explicitly contains a real HivePal hive UUID
  - otherwise null
- date:
  - only fill if a clear inspection date/time is spoken
  - return ISO-8601 string if known, otherwise null
- temperature:
  - numeric only
  - do not wrap inside a weather object
- weatherConditions:
  - short free-text weather description from transcript if stated, otherwise null
- notes:
  - concise free-text summary of notable inspection notes from transcript
  - keep it short and factual

Observations object:
This app supports two inspection styles. Fill whichever the transcript supports;
fill both if both are mentioned. Leave anything unstated as null.

Subjective 0-10 ratings (only if the beekeeper gives a rating/impression, not a frame count):
- strength: hive/population strength. If given as a 0-10 rating use that. If given as a
  number of occupied/covered frames, put that frame count here (no upper bound).
- uncappedBrood: 0-10 rating if stated/implied, else null
- cappedBrood: 0-10 rating if stated/implied, else null
- honeyStores: 0-10 rating if stated/implied, else null
- pollenStores: 0-10 rating if stated/implied, else null

Frame counts (only if the beekeeper states an actual number of frames):
These are independent, non-negative integer counts and may overlap (one frame can
hold both eggs and pollen), so they need not sum to totalFrames.
- totalFrames: total number of frames in the hive/box, else null
- eggsFrames: frames containing eggs, else null
- uncappedBroodFrames: frames of uncapped/open brood, else null
- cappedBroodFrames: frames of capped/sealed brood, else null
- droneBroodFrames: frames of drone brood, else null
- pollenFrames: frames of pollen, else null
- nectarFrames: frames of nectar, else null
- honeyFrames: frames of capped honey, else null
- emptyFrames: empty/undrawn frames, else null

Other observations:
- queenCells: integer count if stated; if explicitly none, use 0; if unknown, null
- swarmCells: true/false/null
- supersedureCells: true/false/null
- queenSeen: true/false/null
- broodPattern: must be exactly one of:
  solid, spotty, scattered, patchy, excellent, poor
- additionalObservations: only choose from:
  calm, defensive, aggressive, nervous, varroa_present, small_hive_beetle,
  wax_moths, ants_present, healthy, active, sluggish, thriving
- reminderObservations: only choose from:
  honey_bound, overcrowded, needs_super, queen_issues,
  requires_treatment, low_stores, prepare_for_winter

Actions:
Return only actions actually mentioned.
Each action must use this structure:
{{
  "type": "FEEDING" | "TREATMENT" | "FRAME" | "MAINTENANCE" | "NOTE" | "OTHER",
  "notes": "optional short note or null",
  "details": {{ ... }}
}}

Action details rules:
- FEEDING details:
  {{
    "type": "FEEDING",
    "feedType": string or null,
    "amount": number or null,
    "unit": string or null,
    "concentration": string or null
  }}
- TREATMENT details:
  {{
    "type": "TREATMENT",
    "product": string or null,
    "quantity": number or null,
    "unit": string or null,
    "duration": string or null
  }}
- FRAME details:
  {{
    "type": "FRAME",
    "quantity": integer or null
  }}
- MAINTENANCE details:
  {{
    "type": "MAINTENANCE",
    "component": "BOX" | "BOTTOM_BOARD" | "COVER" | null,
    "status": "CLEANED" | "REPLACED" | null
  }}
- NOTE details:
  {{
    "type": "NOTE",
    "content": string or null
  }}
- OTHER details:
  {{
    "type": "OTHER"
  }}

Normalization examples:
- "patch" -> "patchy"
- "varroa mites present" -> "varroa_present"
- "small hive beetle" -> "small_hive_beetle"
- "ants present" -> "ants_present"
- "needs a super" -> "needs_super"
- "queen issues" -> "queen_issues"
- "requires treatment" -> "requires_treatment"
- "low stores" -> "low_stores"
- "prepare for winter" -> "prepare_for_winter"

Transcript:
{transcript}
""".strip()


def normalize_recommendation(data: dict) -> dict:
    if not isinstance(data, dict):
        data = {}

    observations = data.get("observations") or {}
    actions = data.get("actions") or []

    brood_pattern_map = {
        "patch": "patchy",
        "patchy": "patchy",
        "solid": "solid",
        "spotty": "spotty",
        "scattered": "scattered",
        "excellent": "excellent",
        "poor": "poor",
        "": None,
        None: None,
    }

    additional_map = {
        "varroa mites present": "varroa_present",
        "varroa_present": "varroa_present",
        "small hive beetle": "small_hive_beetle",
        "small_hive_beetle": "small_hive_beetle",
        "wax moths": "wax_moths",
        "wax_moths": "wax_moths",
        "ants present": "ants_present",
        "ants_present": "ants_present",
        "calm": "calm",
        "defensive": "defensive",
        "aggressive": "aggressive",
        "nervous": "nervous",
        "healthy": "healthy",
        "active": "active",
        "sluggish": "sluggish",
        "thriving": "thriving",
    }

    reminder_map = {
        "honey bound": "honey_bound",
        "honey_bound": "honey_bound",
        "overcrowded": "overcrowded",
        "needs super": "needs_super",
        "needs_super": "needs_super",
        "queen issues": "queen_issues",
        "queen_issues": "queen_issues",
        "requires treatment": "requires_treatment",
        "requires_treatment": "requires_treatment",
        "low stores": "low_stores",
        "low_stores": "low_stores",
        "prepare for winter": "prepare_for_winter",
        "prepare_for_winter": "prepare_for_winter",
    }

    valid_additional = {
        "calm", "defensive", "aggressive", "nervous",
        "varroa_present", "small_hive_beetle", "wax_moths", "ants_present",
        "healthy", "active", "sluggish", "thriving"
    }

    valid_reminders = {
        "honey_bound", "overcrowded", "needs_super", "queen_issues",
        "requires_treatment", "low_stores", "prepare_for_winter"
    }

    normalized = {
        "hiveId": data.get("hiveId"),
        "date": data.get("date"),
        "temperature": data.get("temperature"),
        "weatherConditions": data.get("weatherConditions"),
        "notes": data.get("notes"),
        "observations": {
            "strength": None,
            "uncappedBrood": None,
            "cappedBrood": None,
            "honeyStores": None,
            "pollenStores": None,
            "queenCells": None,
            "swarmCells": None,
            "supersedureCells": None,
            "queenSeen": None,
            "broodPattern": None,
            "additionalObservations": [],
            "reminderObservations": [],
        },
        "actions": [],
    }
    normalized["hiveId"] = data.get("hiveId")
    normalized["date"] = data.get("date")
    normalized["temperature"] = data.get("temperature")
    normalized["weatherConditions"] = data.get("weatherConditions")
    normalized["notes"] = data.get("notes")

    normalized["observations"] = {
        "strength": observations.get("strength"),
        "uncappedBrood": observations.get("uncappedBrood"),
        "cappedBrood": observations.get("cappedBrood"),
        "honeyStores": observations.get("honeyStores"),
        "pollenStores": observations.get("pollenStores"),
        "totalFrames": observations.get("totalFrames"),
        "eggsFrames": observations.get("eggsFrames"),
        "uncappedBroodFrames": observations.get("uncappedBroodFrames"),
        "cappedBroodFrames": observations.get("cappedBroodFrames"),
        "droneBroodFrames": observations.get("droneBroodFrames"),
        "pollenFrames": observations.get("pollenFrames"),
        "nectarFrames": observations.get("nectarFrames"),
        "honeyFrames": observations.get("honeyFrames"),
        "emptyFrames": observations.get("emptyFrames"),
        "queenCells": observations.get("queenCells"),
        "swarmCells": observations.get("swarmCells"),
        "supersedureCells": observations.get("supersedureCells"),
        "queenSeen": observations.get("queenSeen"),
        "broodPattern": brood_pattern_map.get(observations.get("broodPattern"), None),
        "additionalObservations": [
            additional_map[item]
            for item in observations.get("additionalObservations", [])
            if item in additional_map and additional_map[item] in valid_additional
        ],
        "reminderObservations": [
            reminder_map[item]
            for item in observations.get("reminderObservations", [])
            if item in reminder_map and reminder_map[item] in valid_reminders
        ],
    }

    normalized_actions = []

    for action in actions:
        if not isinstance(action, dict):
            continue

        action_type = action.get("type")
        details = action.get("details") or {}

        if action_type == "FEEDING":
            normalized_actions.append({
                "type": "FEEDING",
                "notes": action.get("notes"),
                "details": {
                    "type": "FEEDING",
                    "feedType": details.get("feedType"),
                    "amount": details.get("amount"),
                    "unit": details.get("unit"),
                    "concentration": details.get("concentration"),
                },
            })
        elif action_type == "TREATMENT":
            normalized_actions.append({
                "type": "TREATMENT",
                "notes": action.get("notes"),
                "details": {
                    "type": "TREATMENT",
                    "product": details.get("product"),
                    "quantity": details.get("quantity"),
                    "unit": details.get("unit"),
                    "duration": details.get("duration"),
                },
            })
        elif action_type == "FRAME":
            normalized_actions.append({
                "type": "FRAME",
                "notes": action.get("notes"),
                "details": {
                    "type": "FRAME",
                    "quantity": details.get("quantity"),
                },
            })
        elif action_type == "MAINTENANCE":
            normalized_actions.append({
                "type": "MAINTENANCE",
                "notes": action.get("notes"),
                "details": {
                    "type": "MAINTENANCE",
                    "component": details.get("component"),
                    "status": details.get("status"),
                },
            })
        elif action_type == "NOTE":
            normalized_actions.append({
                "type": "NOTE",
                "notes": action.get("notes"),
                "details": {
                    "type": "NOTE",
                    "content": details.get("content"),
                },
            })
        elif action_type == "OTHER":
            normalized_actions.append({
                "type": "OTHER",
                "notes": action.get("notes"),
                "details": {
                    "type": "OTHER",
                },
            })

    normalized["actions"] = normalized_actions
    return normalized

def map_ai_to_form_draft(ai: dict) -> dict:
    draft = empty_form_draft()

    observations = ai.get("observations") or {}

    draft["temperature"] = ai.get("temperature")
    draft["weatherConditions"] = ai.get("weatherConditions")
    draft["notes"] = ai.get("notes")

    draft["observations"] = {
        "strength": observations.get("strength"),
        "uncappedBrood": observations.get("uncappedBrood"),
        "cappedBrood": observations.get("cappedBrood"),
        "honeyStores": observations.get("honeyStores"),
        "pollenStores": observations.get("pollenStores"),
        "totalFrames": observations.get("totalFrames"),
        "eggsFrames": observations.get("eggsFrames"),
        "uncappedBroodFrames": observations.get("uncappedBroodFrames"),
        "cappedBroodFrames": observations.get("cappedBroodFrames"),
        "droneBroodFrames": observations.get("droneBroodFrames"),
        "pollenFrames": observations.get("pollenFrames"),
        "nectarFrames": observations.get("nectarFrames"),
        "honeyFrames": observations.get("honeyFrames"),
        "emptyFrames": observations.get("emptyFrames"),
        "queenCells": observations.get("queenCells"),
        "swarmCells": observations.get("swarmCells"),
        "supersedureCells": observations.get("supersedureCells"),
        "queenSeen": observations.get("queenSeen"),
        "broodPattern": observations.get("broodPattern"),
        "additionalObservations": observations.get("additionalObservations", []),
        "reminderObservations": observations.get("reminderObservations", []),
    }

    mapped_actions = []

    for action in ai.get("actions", []):
        if not isinstance(action, dict):
            continue

        action_type = action.get("type")
        details = action.get("details") or {}

        if action_type == "FEEDING":
            mapped_actions.append({
                "type": "FEEDING",
                "feedType": details.get("feedType") or "",
                "quantity": details.get("amount"),
                "unit": details.get("unit") or "",
                "concentration": details.get("concentration") or "",
                "notes": action.get("notes") or "",
            })

        elif action_type == "TREATMENT":
            mapped_actions.append({
                "type": "TREATMENT",
                "treatmentType": details.get("product") or "",
                "amount": details.get("quantity"),
                "unit": details.get("unit") or "",
                "notes": action.get("notes") or "",
            })

        elif action_type == "FRAME":
            mapped_actions.append({
                "type": "FRAME",
                "frames": details.get("quantity"),
                "notes": action.get("notes") or "",
            })

        elif action_type == "MAINTENANCE":
            mapped_actions.append({
                "type": "MAINTENANCE",
                "component": details.get("component") or "",
                "status": details.get("status") or "",
                "notes": action.get("notes") or "",
            })

        elif action_type == "NOTE":
            mapped_actions.append({
                "type": "NOTE",
                "notes": action.get("notes") or details.get("content") or "",
            })

        elif action_type == "OTHER":
            mapped_actions.append({
                "type": "OTHER",
                "notes": action.get("notes") or "",
            })

    draft["actions"] = mapped_actions
    return draft

def _recommend_ollama(transcript: str) -> dict:
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "Return only JSON that exactly matches the provided inspection schema."
            },
            {
                "role": "user",
                "content": build_prompt(transcript)
            }
        ],
        "stream": False,
        "format": SCHEMA
    }

    last_error = None
    for attempt in range(2):
        try:
            response = requests.post(OLLAMA_URL, json=payload, timeout=600)
            if not response.ok:
                app.logger.error("Ollama error %s: %s", response.status_code, response.text)
                response.raise_for_status()
            data = response.json()
            content = data.get("message", {}).get("content", "{}")
            return json.loads(content)
        except Exception as exc:
            last_error = exc
            app.logger.error("Ollama attempt %s failed: %s", attempt + 1, exc)
            if attempt == 0:
                time.sleep(2)
    raise last_error


def _recommend_openai(transcript: str) -> dict:
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {
                "role": "system",
                "content": "Return only JSON that exactly matches the provided inspection schema."
            },
            {
                "role": "user",
                "content": build_prompt(transcript)
            }
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "hive_inspection",
                "strict": True,
                "schema": SCHEMA,
            }
        },
        timeout=600,
    )
    content = response.choices[0].message.content or "{}"
    return json.loads(content)


def _recommend_anthropic(transcript: str) -> dict:
    import anthropic as anthropic_sdk
    client = anthropic_sdk.Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=4096,
        system="Return only JSON that exactly matches the provided inspection schema. Do not include any text outside the JSON object.",
        messages=[
            {
                "role": "user",
                "content": build_prompt(transcript)
            }
        ],
        timeout=600,
    )
    content = response.content[0].text if response.content else "{}"
    # Strip any markdown code fences if present
    content = content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    return json.loads(content.strip())


def recommend_from_transcript(transcript: str) -> dict:
    app.logger.info("Running AI analysis with provider=%s", AI_PROVIDER)
    if AI_PROVIDER == "openai":
        raw = _recommend_openai(transcript)
    elif AI_PROVIDER == "anthropic":
        raw = _recommend_anthropic(transcript)
    else:
        raw = _recommend_ollama(transcript)
    return normalize_recommendation(raw)


def save_outputs(base_name: str, transcription: dict, recommendation: dict):
    transcript_path = TRANSCRIPTS_DIR / f"{base_name}.txt"
    transcript_json_path = TRANSCRIPTS_DIR / f"{base_name}.transcript.json"
    result_json_path = OUTPUT_DIR / f"{base_name}.recommendation.json"

    transcript_path.write_text(transcription["text"], encoding="utf-8")
    transcript_json_path.write_text(
        json.dumps(transcription, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    result_json_path.write_text(
        json.dumps(recommendation, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    return {
        "transcript_txt": str(transcript_path),
        "transcript_json": str(transcript_json_path),
        "recommendation_json": str(result_json_path),
    }


def process_audio_file(audio_path: str):
    audio = pathlib.Path(audio_path)
    base_name = audio.stem

    transcription = transcribe_file(str(audio))

    analysis_error = None
    try:
        trimmed_transcript = truncate_transcript(transcription["text"])

        ai_result = recommend_from_transcript(trimmed_transcript)
        recommendation = map_ai_to_form_draft(ai_result)

    except Exception as exc:
        analysis_error = str(exc)
        app.logger.exception("Recommendation generation failed")
        recommendation = empty_form_draft()

    files = save_outputs(base_name, transcription, recommendation)

    return {
        "audio_file": str(audio),
        "transcription": transcription,
        "recommendation": recommendation,
        "analysis_error": analysis_error,
        "files": files,
    }

@app.post("/process-upload")
def process_upload():
    require_api_key(request)

    if "file" not in request.files:
        return jsonify({"error": "file is required"}), 400

    uploaded = request.files["file"]
    if not uploaded.filename:
        return jsonify({"error": "empty filename"}), 400

    suffix = pathlib.Path(uploaded.filename).suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        return jsonify({"error": f"unsupported file type: {suffix}"}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        uploaded.save(tmp.name)
        temp_path = tmp.name

    try:
        result = process_audio_file(temp_path)
        return jsonify({
            "status": "completed",
            "transcript": result["transcription"],
            "inspectionDraft": result["recommendation"],
            "analysisError": result["analysis_error"],
            "files": result["files"],
        })
    finally:
        try:
            os.unlink(temp_path)
        except OSError:
            pass


@app.post("/chat")
def chat():
    """Streaming chat relay for the in-app assistant.

    Accepts {"messages": [...], "model"?: str}, forwards to Ollama's /api/chat
    with streaming enabled, and pipes Ollama's NDJSON chunks straight back to
    the caller (the backend, which re-streams them to the browser as SSE).
    """
    require_api_key(request)

    data = request.get_json(force=True, silent=True) or {}
    messages = data.get("messages")
    if not isinstance(messages, list) or not messages:
        return jsonify({"error": "messages is required"}), 400

    model = data.get("model") or OLLAMA_MODEL

    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
    }

    def generate():
        with requests.post(OLLAMA_URL, json=payload, stream=True, timeout=600) as response:
            if not response.ok:
                app.logger.error(
                    "Ollama chat error %s: %s", response.status_code, response.text
                )
                response.raise_for_status()
            for line in response.iter_lines(decode_unicode=False):
                if line:
                    yield line + b"\n"

    return Response(
        stream_with_context(generate()),
        mimetype="application/x-ndjson",
    )


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "ollama_url": OLLAMA_URL,
        "ollama_model": OLLAMA_MODEL,
        "whisper_model": WHISPER_MODEL,
        "input_dir": str(AUDIO_INPUT_DIR),
    })


@app.post("/transcribe")
def transcribe_endpoint():
    data = request.get_json(force=True)
    audio_path = data["audio_path"]
    result = transcribe_file(audio_path)
    return jsonify(result)


@app.post("/recommend")
def recommend_endpoint():
    data = request.get_json(force=True)
    transcript = data["transcript"]
    trimmed_transcript = truncate_transcript(transcript)

    ai_result = recommend_from_transcript(trimmed_transcript)
    result = map_ai_to_form_draft(ai_result)

    return jsonify(result)


@app.post("/process")
def process_endpoint():
    data = request.get_json(force=True)
    audio_path = data["audio_path"]
    result = process_audio_file(audio_path)
    return jsonify(result)


@app.post("/process_incoming")
def process_incoming():
    processed = []

    for item in sorted(AUDIO_INPUT_DIR.iterdir()):
        if item.is_file() and item.suffix.lower() in SUPPORTED_EXTENSIONS:
            try:
                result = process_audio_file(str(item))
                processed.append({
                    "file": item.name,
                    "status": "ok",
                    "output": result["files"],
                    "analysisError": result["analysis_error"],
                })
            except Exception as exc:
                processed.append({
                    "file": item.name,
                    "status": "error",
                    "error": str(exc),
                })

    return jsonify({"results": processed})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8008)