import os
import uuid
import json
import shutil
import subprocess
import traceback
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

# Optional transcription libraries
try:
    import openai
except Exception:
    openai = None

try:
    import whisper
except Exception:
    whisper = None

logger = logging.getLogger("uvicorn.error")

# --- configuration ---
APP_DIR = Path(__file__).parent.resolve()
UPLOAD_DIR = APP_DIR / "uploads"
VIDEO_DIR = UPLOAD_DIR / "video"
AUDIO_DIR = UPLOAD_DIR / "audio"
DB_FILE = APP_DIR / "db.json"

for d in (UPLOAD_DIR, VIDEO_DIR, AUDIO_DIR):
    d.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Interview Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- simple JSON DB helpers ---

def load_db():
    if not DB_FILE.exists():
        return {"candidates": {}, "answers": {}, "rubrics": {}}
    try:
        return json.loads(DB_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {"candidates": {}, "answers": {}, "rubrics": {}}


def save_db(db: dict):
    DB_FILE.write_text(json.dumps(db, indent=2, ensure_ascii=False), encoding="utf-8")


# --- ffmpeg conversion (webm -> mono 16k wav) ---
def convert_webm_to_wav(src: Path, dst: Path):
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(src),
        "-ar",
        "16000",
        "-ac",
        "1",
        str(dst),
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.decode(errors="ignore")[:1000])


# --- verbose transcription helper ---
def transcribe_audio_verbose(path: Path):
    """
    Try OpenAI first (if api key set and package installed). If that fails, try local whisper.
    Returns: (transcript, transcription_error_or_None)
    """
    # 1) OpenAI path
    try:
        key = os.environ.get("OPENAI_API_KEY")
        if key and openai is not None:
            try:
                openai.api_key = key
                with open(path, "rb") as fh:
                    # prefer modern API: Audio.transcribe
                    resp = openai.Audio.transcribe("whisper-1", fh)
                    if isinstance(resp, dict):
                        text = resp.get("text", "")
                    else:
                        text = getattr(resp, "text", "") or ""
                    return text.strip(), None
            except Exception as e:
                logger.error("OpenAI transcription exception: %s", e)
                logger.error(traceback.format_exc())
                err = f"OpenAI transcription failed: {type(e).__name__}: {e}"
                # fall through to local whisper attempt
    except Exception as e:
        logger.error("Error checking OPENAI availability: %s", e)
        logger.error(traceback.format_exc())

    # 2) Local whisper
    if whisper is not None:
        try:
            model = whisper.load_model("small")
            result = model.transcribe(str(path))
            return (result.get("text") or "").strip(), None
        except Exception as e:
            logger.error("Local whisper exception: %s", e)
            logger.error(traceback.format_exc())
            return "", f"Local whisper failed: {type(e).__name__}: {e}"

    # 3) nothing available
    return "", "No transcription backend available. Set OPENAI_API_KEY and install 'openai' or install 'whisper'."


# --- endpoints ---
@app.get("/api/candidates")
@app.get("/candidates")
def get_candidates():
    db = load_db()
    return db.get("candidates", {})


@app.post("/api/candidates")
@app.post("/candidates")
async def create_candidate(
    name: str = Form(...),
    role: str = Form(...),
    limit: int = Form(5),
    resume: Optional[UploadFile] = None,
):
    db = load_db()
    token = uuid.uuid4().hex
    candidate = {"name": name, "role": role, "limit": int(limit)}
    if resume:
        fn = f"{token}_resume_{resume.filename}"
        dst = VIDEO_DIR / fn
        with dst.open("wb") as out:
            shutil.copyfileobj(resume.file, out)
        candidate["resume_filename"] = fn
    db.setdefault("candidates", {})[token] = candidate
    save_db(db)
    return {"token": token, **candidate}


@app.get("/api/questions")
@app.get("/questions")
def get_questions(role: Optional[str] = None, limit: int = 5, token: Optional[str] = None):
    r = (role or "candidate").strip()
    base = [
        f"Tell us about your experience as a {r}.",
        f"Which tools and technologies do you use as a {r}?",
        f"Describe a challenging problem you solved in a {r} role.",
        f"How do you keep up with best practices for {r} work?",
        f"Why do you want to work as a {r} at our company?",
    ]
    return {"questions": base[: max(1, int(limit))]}


@app.post("/answer")
@app.post("/api/answer")
async def receive_answer(file: UploadFile = File(...), token: str = Form(...), question: str = Form(...)):
    db = load_db()
    if token not in db.get("candidates", {}):
        raise HTTPException(status_code=404, detail="Candidate token not found")

    # save raw video
    vid_name = f"{token}_{uuid.uuid4().hex}.webm"
    vid_path = VIDEO_DIR / vid_name
    with vid_path.open("wb") as out:
        out.write(await file.read())

    # convert to wav for transcription
    wav_name = vid_name.replace(".webm", ".wav")
    wav_path = AUDIO_DIR / wav_name
    try:
        convert_webm_to_wav(vid_path, wav_path)
    except Exception as e:
        logger.error("Conversion failed: %s", e)
        logger.error(traceback.format_exc())
        # still store video but return error
        raise HTTPException(status_code=500, detail=f"Audio conversion failed: {e}")

    # transcribe (best-effort)
    transcript, transcription_error = transcribe_audio_verbose(wav_path)

    # store answer
    answers = db.setdefault("answers", {}).setdefault(token, [])
    rec = {
        "q_text": question,
        "transcript": transcript,
        "media_filename": vid_name,
        "media_url": f"/media/video/{vid_name}",
        "transcription_error": transcription_error,
    }
    answers.append(rec)
    save_db(db)

    return JSONResponse({"transcript": transcript, "media_url": rec["media_url"], "transcription_error": transcription_error})


@app.get("/media/video/{fn}")
def serve_video(fn: str):
    path = VIDEO_DIR / fn
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="video/webm", filename=fn)


@app.get("/api/results")
@app.get("/results")
def results():
    db = load_db()
    out = []
    for token, cand in db.get("candidates", {}).items():
        answers = db.get("answers", {}).get(token, [])
        total_score = None
        out.append(
            {
                "token": token,
                "name": cand.get("name"),
                "role": cand.get("role"),
                "email": cand.get("email", ""),
                "answers": answers,
                "total_score": total_score,
                "interview_link": f"http://localhost:5173/candidate/{token}",
            }
        )
    return {"candidates": out}


# --- rubric endpoints used by frontend ---
@app.get("/rubric/{token}")
async def get_rubric(token: str):
    db = load_db()
    return {"criteria": db.get("rubrics", {}).get(token, [])}


@app.post("/rubric")
async def save_rubric(payload: Request):
    body = await payload.json()
    token = body.get("token")
    criteria = body.get("criteria", [])
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")
    db = load_db()
    db.setdefault("rubrics", {})[token] = criteria
    save_db(db)
    return {"ok": True}


# --- debug endpoint to inspect openai/whisper availability ---
@app.get("/debug/openai")
def debug_openai():
    return {
        "openai_installed": openai is not None,
        "openai_version": getattr(openai, "__version__", None) if openai is not None else None,
        "OPENAI_API_KEY_set": bool(os.environ.get("OPENAI_API_KEY")),
        "whisper_installed": whisper is not None,
    }


# --- simple health endpoint ---
@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    print("Run with: uvicorn main:app --reload")
