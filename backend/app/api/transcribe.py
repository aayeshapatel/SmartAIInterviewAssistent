# backend/app/api/transcribe.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import tempfile
import logging
import whisper

router = APIRouter()
logger = logging.getLogger("transcribe_api")
logging.basicConfig(level=logging.INFO)

# Load Whisper tiny model once at startup for speed
model = whisper.load_model("tiny.en")


class TranscribeResponse(BaseModel):
    text: str


@router.post("/", response_model=TranscribeResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Accepts an audio file upload (WAV, MP3, etc.) and returns the
    transcribed text.
    """
    # Basic content-type check
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not an audio type.")

    try:
        # Read the entire upload into memory
        content = await file.read()
        # Write to a temporary file for Whisper to consume
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(content)
            tmp.flush()
            # Run Whisper transcription
            result = model.transcribe(tmp.name)
        text = result.get("text", "").strip()
        logger.info(f"Transcribed audio to: '{text[:50]}...'")
        return TranscribeResponse(text=text)

    except Exception as e:
        logger.exception("Transcription error")
        raise HTTPException(
            status_code=500,
            detail="Internal error during transcription."
        )

