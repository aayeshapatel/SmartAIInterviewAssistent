# # # It should:
# # # Read from the audio queue
# # # Convert the audio to text using Whisper
# # # Return clean transcript
# # # src/audio/speech_to_text.py
# #
# # import threading
# # import queue
# # import logging
# # from typing import Callable, Optional
# #
# # import numpy as np
# # import torch
# # import whisper
# #
# #
# # class SpeechToText:
# #     """
# #     Real-time speech-to-text processor using OpenAI Whisper.
# #     Reads audio frames from a queue, segments them into fixed-length chunks,
# #     transcribes each chunk, and outputs text via callback or transcript queue.
# #     """
# #
# #     def __init__(
# #         self,
# #         audio_queue: "queue.Queue[np.ndarray]",
# #         model_name: str = "base",
# #         segment_length: float = 3.0,
# #         sample_rate: int = 16000,
# #         callback: Optional[Callable[[str], None]] = None,
# #         timeout: float = 1.0,
# #         language: str = "en",
# #     ) -> None:
# #         self.audio_queue = audio_queue
# #         self.segment_length = segment_length
# #         self.sample_rate = sample_rate
# #         self.timeout = timeout
# #         self.callback = callback
# #         self.language = language
# #
# #         # If no callback provided, use an internal queue
# #         self.transcript_queue: Optional[queue.Queue[str]] = (
# #             queue.Queue() if callback is None else None
# #         )
# #
# #         # Logging setup
# #         self.logger = logging.getLogger(self.__class__.__name__)
# #         logging.basicConfig(level=logging.INFO)
# #
# #         # Determine device for Whisper
# #         self.device = "cuda" if torch.cuda.is_available() else "cpu"
# #         self.logger.info(f"Loading Whisper model '{model_name}' on {self.device}.")
# #
# #         # Load Whisper model
# #         self.model = whisper.load_model(model_name, device=self.device)
# #
# #         # Thread control
# #         self._stop_event = threading.Event()
# #         self._thread: Optional[threading.Thread] = None
# #
# #     def start(self) -> None:
# #         """
# #         Start the background thread for processing audio and transcribing.
# #         """
# #         if self._thread and self._thread.is_alive():
# #             self.logger.warning("SpeechToText processing already running.")
# #             return
# #
# #         self._stop_event.clear()
# #         self._thread = threading.Thread(target=self._process_loop, daemon=True)
# #         self._thread.start()
# #         self.logger.info("Speech-to-text processing started.")
# #
# #     def stop(self) -> None:
# #         """
# #         Signal the background thread to stop and wait for it.
# #         """
# #         if not self._thread:
# #             return
# #         self._stop_event.set()
# #         self._thread.join()
# #         self.logger.info("Speech-to-text processing stopped.")
# #
# #     def _process_loop(self) -> None:
# #         """
# #         Continuous loop: reads raw audio frames, buffers them into segments,
# #         then transcribes each segment with Whisper.
# #         """
# #         segment_samples = int(self.segment_length * self.sample_rate)
# #         buffer: list[np.ndarray] = []
# #
# #         while not self._stop_event.is_set():
# #             try:
# #                 # Wait for next audio chunk
# #                 chunk = self.audio_queue.get(timeout=self.timeout)
# #                 buffer.append(chunk)
# #
# #                 # Calculate total samples buffered
# #                 total_samples = sum(buf.shape[0] for buf in buffer)
# #                 if total_samples < segment_samples:
# #                     continue
# #
# #                 # Concatenate buffer into one segment
# #                 audio_segment = np.concatenate(buffer, axis=0)
# #                 buffer.clear()
# #
# #                 # Normalize to float32 in [-1.0, 1.0]
# #                 audio_float = audio_segment.astype(np.float32) / 32768.0
# #
# #                 # Transcribe with Whisper
# #                 result = self.model.transcribe(
# #                     audio_float,
# #                     language=self.language,
# #                 )
# #                 text = result.get("text", "").strip()
# #
# #                 if text:
# #                     self.logger.debug(f"Transcription result: {text}")
# #                     if self.callback:
# #                         self.callback(text)
# #                     elif self.transcript_queue:
# #                         self.transcript_queue.put(text)
# #
# #             except queue.Empty:
# #                 continue  # No audio chunk available yet
# #             except Exception as e:
# #                 self.logger.exception(f"Error in transcription loop: {e}")
# #                 break  # Optionally exit on fatal error
#
# # src/audio/speech_to_text.py
#
# import threading
# import queue
# import logging
# from typing import Callable, Optional
#
# import numpy as np
# import torch
# import whisper
#
#
# class SpeechToText:
#     """
#     Real-time speech-to-text processor using OpenAI Whisper with simple noise filtering.
#
#     Reads raw audio frames from a queue, assembles fixed-length segments,
#     filters out low-energy (silent/noise) segments, and transcribes each
#     valid speech segment. Outputs text via callback or transcript queue.
#     """
#
#     def __init__(
#         self,
#         audio_queue: "queue.Queue[np.ndarray]",
#         model_name: str = "base",
#         segment_length: float = 3.0,
#         sample_rate: int = 16000,
#         callback: Optional[Callable[[str], None]] = None,
#         timeout: float = 1.0,
#         language: str = "en",
#         noise_threshold: float = 0.01,
#     ) -> None:
#         self.audio_queue = audio_queue
#         self.segment_length = segment_length
#         self.sample_rate = sample_rate
#         self.timeout = timeout
#         self.callback = callback
#         self.language = language
#         self.noise_threshold = noise_threshold
#
#         # Internal transcript queue if no callback
#         self.transcript_queue: Optional[queue.Queue[str]] = (
#             queue.Queue() if callback is None else None
#         )
#
#         # Logging
#         logging.basicConfig(level=logging.INFO)
#         self.logger = logging.getLogger(self.__class__.__name__)
#
#         # Choose device
#         self.device = "cuda" if torch.cuda.is_available() else "cpu"
#         self.logger.info(f"Loading Whisper model '{model_name}' on {self.device}.")
#
#         # Load model
#         self.model = whisper.load_model(model_name, device=self.device)
#
#         # Thread control
#         self._stop_event = threading.Event()
#         self._thread: Optional[threading.Thread] = None
#
#     def start(self) -> None:
#         """Start background thread for audio processing."""
#         if self._thread and self._thread.is_alive():
#             self.logger.warning("SpeechToText already running.")
#             return
#         self._stop_event.clear()
#         self._thread = threading.Thread(target=self._process_loop, daemon=True)
#         self._thread.start()
#         self.logger.info("Speech-to-text processing started.")
#
#     def stop(self) -> None:
#         """Stop background processing thread."""
#         self._stop_event.set()
#         if self._thread:
#             self._thread.join()
#         self.logger.info("Speech-to-text processing stopped.")
#
#     def _process_loop(self) -> None:
#         """
#         Loop: gather audio frames into segments, filter silence/noise,
#         then transcribe valid segments.
#         """
#         segment_samples = int(self.segment_length * self.sample_rate)
#         buffer: list[np.ndarray] = []
#
#         while not self._stop_event.is_set():
#             try:
#                 # Get next chunk
#                 chunk = self.audio_queue.get(timeout=self.timeout)
#                 buffer.append(chunk)
#
#                 # If not enough data yet, continue
#                 total = sum(b.shape[0] for b in buffer)
#                 if total < segment_samples:
#                     continue
#
#                 # Concatenate buffers
#                 audio_segment = np.concatenate(buffer, axis=0)
#                 buffer.clear()
#
#                 # Normalize samples to float32
#                 audio_float = audio_segment.astype(np.float32) / 32768.0
#
#                 # Compute RMS energy
#                 rms = np.sqrt(np.mean(audio_float**2))
#                 if rms < self.noise_threshold:
#                     self.logger.debug(f"Segment dropped by noise filter (RMS={rms:.4f}).")
#                     continue
#
#                 # Transcribe
#                 result = self.model.transcribe(
#                     audio_float,
#                     language=self.language,
#                 )
#                 text = result.get("text", "").strip()
#                 if not text:
#                     continue
#
#                 # Output
#                 self.logger.debug(f"Transcribed text: {text}")
#                 if self.callback:
#                     self.callback(text)
#                 elif self.transcript_queue:
#                     self.transcript_queue.put(text)
#
#             except queue.Empty:
#                 continue
#             except Exception as e:
#                 self.logger.exception(f"Transcription error: {e}")
#                 break






# src/audio/speech_to_text.py

import threading
import queue
import logging
from typing import Callable, Optional

import numpy as np
import torch
import whisper


class SpeechToText:
    """
    Lightweight real-time speech-to-text using Whisper Tiny with noise filtering.

    Reads raw audio frames, buffers short segments,
    filters out silence, and transcribes using Whisper tiny for speed.
    Outputs via callback or internal queue.
    """

    def __init__(
        self,
        audio_queue: "queue.Queue[np.ndarray]",
        model_name: str = "tiny.en",
        segment_length: float = 1.5,
        sample_rate: int = 16000,
        callback: Optional[Callable[[str], None]] = None,
        timeout: float = 0.2,
        language: str = "en",
        noise_threshold: float = 0.005,
    ) -> None:
        self.audio_queue = audio_queue
        self.segment_length = segment_length
        self.sample_rate = sample_rate
        self.timeout = timeout
        self.callback = callback
        self.language = language
        self.noise_threshold = noise_threshold

        # Fallback internal queue if no callback
        self.transcript_queue: Optional[queue.Queue[str]] = (
            queue.Queue() if callback is None else None
        )

        # Logging
        logging.basicConfig(level=logging.ERROR)
        self.logger = logging.getLogger(self.__class__.__name__)

        # Determine device (use CPU for tiny)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.logger.info(f"Loading Whisper model '{model_name}' on {self.device}.")

        # Load a small model for speed
        self.model = whisper.load_model(model_name, device=self.device)

        # Thread control
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def start(self) -> None:
        """Begin processing thread."""
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._process_loop, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        """Stop processing thread."""
        self._stop_event.set()
        if self._thread:
            self._thread.join()

    def _process_loop(self) -> None:
        """
        Continuously buffer small segments, drop silent ones,
        and call Whisper for fast transcription.
        """
        seg_samples = int(self.segment_length * self.sample_rate)
        buf: list[np.ndarray] = []

        while not self._stop_event.is_set():
            try:
                chunk = self.audio_queue.get(timeout=self.timeout)
                buf.append(chunk)
                total = sum(b.shape[0] for b in buf)
                if total < seg_samples:
                    continue

                # Prepare audio
                audio = np.concatenate(buf, axis=0).astype(np.float32) / 32768.0
                buf.clear()

                # Noise filter
                if np.sqrt(np.mean(audio**2)) < self.noise_threshold:
                    continue

                # Transcribe (fast tiny model)
                result = self.model.transcribe(audio, language=self.language)
                text = result.get("text", "").strip()
                if not text:
                    continue

                # Deliver output
                if self.callback:
                    self.callback(text)
                elif self.transcript_queue:
                    self.transcript_queue.put(text)

            except queue.Empty:
                continue
            except Exception:
                break
