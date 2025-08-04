# # frontend/src/api_client.py
#
# import logging
# from typing import Optional, Dict, Any
# import requests
#
#
# class SAIIAClient:
#     """
#     Thin HTTP client for the SAIIA backend API.
#
#     Methods:
#         transcribe(audio_bytes, content_type) -> str
#         classify(text) -> str
#         generate(question, category, profile) -> str
#     """
#
#     def __init__(self, base_url: str = "http://localhost:8000") -> None:
#         self.base_url = base_url.rstrip('/')
#         logging.basicConfig(level=logging.INFO)
#         self.logger = logging.getLogger(self.__class__.__name__)
#
#     def transcribe(
#         self,
#         audio_bytes: bytes,
#         content_type: str = "audio/wav"
#     ) -> str:
#         """
#         Send audio bytes to the /transcribe/ endpoint and return the transcript.
#
#         :param audio_bytes: Raw bytes of the audio file (WAV, MP3).
#         :param content_type: MIME type, e.g. 'audio/wav'.
#         :returns: Transcribed text from the audio.
#         """
#         files = {"file": ("audio.wav", audio_bytes, content_type)}
#         url = f"{self.base_url}/transcribe/"
#         self.logger.info(f"Transcribing audio via {url}")
#         resp = requests.post(url, files=files)
#         resp.raise_for_status()
#         data = resp.json()
#         return data.get("text", "")
#
#     def classify(self, text: str) -> str:
#         """
#         Send text to the /classify/ endpoint and return the category.
#
#         :param text: The question text to classify.
#         :returns: One of 'hr', 'technical', 'behavioral', 'general'.
#         """
#         url = f"{self.base_url}/classify/"
#         self.logger.info(f"Classifying text via {url}")
#         resp = requests.post(url, json={"text": text})
#         resp.raise_for_status()
#         data = resp.json()
#         return data.get("category", "")
#
#     def generate(
#         self,
#         question: str,
#         category: str,
#         profile: Optional[Dict[str, Any]] = None
#     ) -> str:
#         """
#         Send question and category (plus optional profile) to /generate/ and return the AI answer.
#
#         :param question: The full interview question.
#         :param category: Question category ('hr', 'technical', 'behavioral', 'general').
#         :param profile: Optional dict containing context keys: job_role, company, experience, skills.
#         :returns: Generated answer text.
#         """
#         url = f"{self.base_url}/generate/"
#         payload: Dict[str, Any] = {
#             "question": question,
#             "category": category
#         }
#         if profile:
#             payload["profile"] = profile
#         self.logger.info(f"Generating answer via {url}")
#         resp = requests.post(url, json=payload)
#         resp.raise_for_status()
#         data = resp.json()
#         return data.get("answer", "")


import io
import wave
import logging
from typing import Optional, Dict, Any

import requests

logger = logging.getLogger("SAIIAClient")
logging.basicConfig(level=logging.INFO)


class SAIIAClient:
    def __init__(self, base_url: str):
        # Ensure no trailing slash
        self.base_url = base_url.rstrip("/")

    def transcribe(self, pcm_bytes: bytes, sample_rate: int = 16000) -> str:
        """
        Wrap raw PCM (int16) into a WAV container and send to /transcribe/.
        Returns the transcribed text.
        """
        # Build an in-memory WAV file
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)           # mono
            wf.setsampwidth(2)           # 16-bit = 2 bytes
            wf.setframerate(sample_rate)
            wf.writeframes(pcm_bytes)
        buf.seek(0)

        files = {
            "file": ("audio.wav", buf.read(), "audio/wav")
        }
        url = f"{self.base_url}/transcribe/"
        logger.info(f"Transcribing audio via {url}")
        resp = requests.post(url, files=files, timeout=30.0)
        resp.raise_for_status()
        return resp.json()["text"]

    def classify(self, text: str) -> str:
        """
        Send a piece of text to /classify/ and return the predicted category.
        """
        url = f"{self.base_url}/classify/"
        payload = {"text": text}
        logger.info(f"Classifying text via {url}: {text!r}")
        resp = requests.post(url, json=payload, timeout=10.0)
        resp.raise_for_status()
        return resp.json()["category"]

    def generate(
        self,
        question: str,
        category: str,
        profile: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Send question+category (and optional profile) to /generate/ and return the LLM's answer.
        """
        url = f"{self.base_url}/generate/"
        payload: Dict[str, Any] = {
            "question": question,
            "category": category
        }
        if profile:
            payload["profile"] = profile

        logger.info(f"Generating answer via {url}: {question!r} ({category})")
        resp = requests.post(url, json=payload, timeout=120.0)
        resp.raise_for_status()
        return resp.json()["answer"]
