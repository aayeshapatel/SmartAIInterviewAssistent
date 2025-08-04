# import time
# import sys
# import signal
#
# from src.audio.recorder import AudioRecorder
# from src.audio.speech_to_text import SpeechToText
# from src.nlp.classifier import QuestionClassifier
#
#
# def main():
#     # Graceful shutdown
#     def shutdown(signum, frame):
#         print("\nShutting down pipeline...")
#         recorder.stop_recording()
#         stt.stop()
#         sys.exit(0)
#
#     signal.signal(signal.SIGINT, shutdown)
#     signal.signal(signal.SIGTERM, shutdown)
#
#     # Instantiate components
#     recorder = AudioRecorder(sample_rate=16000, chunk_size=1024, channels=1)
#     recorder.start_recording()
#
#     classifier = QuestionClassifier()
#     print("Question classifier ready. Listening...")
#
#     # Callback: transcribe -> classify -> print
#     def handle_transcript(text: str) -> None:
#         # Filter out very short or incomplete transcripts
#         words = text.strip().split()
#         if len(words) < 3:
#             return
#
#         # Classify only if text appears like a question
#         if not text.strip().endswith('?'):
#             # Optionally, classify only if cue word present
#             if not any(qw in text.lower() for qw in ['what', 'why', 'how', 'tell', 'describe', 'give']):
#                 return
#
#         category = classifier.classify_question(text)
#         print(f"Transcribed: {text}")
#         print(f"Classified as: {category}\n")
#
#     stt = SpeechToText(
#         audio_queue=recorder.audio_queue,
#         model_name="base",
#         segment_length=3.0,
#         sample_rate=16000,
#         callback=handle_transcript,
#         timeout=1.0,
#         language="en"
#     )
#     stt.start()
#
#     # Keep running
#     while True:
#         time.sleep(1)
#
#
# if __name__ == "__main__":
#     main()



# test_pipeline.py
#
# import time
# import sys
# import signal
#
# from src.audio.recorder import AudioRecorder
# from src.audio.speech_to_text import SpeechToText
# from src.nlp.classifier import QuestionClassifier
#
#
# def main():
#     # Graceful shutdown
#     def shutdown(signum, frame):
#         print("\nShutting down pipeline...")
#         recorder.stop_recording()
#         stt.stop()
#         sys.exit(0)
#
#     signal.signal(signal.SIGINT, shutdown)
#     signal.signal(signal.SIGTERM, shutdown)
#
#     # Instantiate components
#     recorder = AudioRecorder(sample_rate=16000, chunk_size=1024, channels=1)
#     recorder.start_recording()
#
#     classifier = QuestionClassifier()
#     print("Question classifier ready. Listening for complete questions...")
#
#     # Accumulate partial transcripts until a full question is detected
#     pending_question = []  # list of text segments
#     max_buffer_length = 100  # reduce buffer length for quicker flush
#
#     def handle_transcript(text: str) -> None:
#         nonlocal pending_question
#         cleaned = text.strip()
#         if not cleaned:
#             return
#
#         # Append segment
#         pending_question.append(cleaned)
#         combined = " ".join(pending_question).strip()
#
#         # Check for question end (question mark) or buffer length
#         is_question_end = cleaned.endswith('?') or '?' in cleaned
#         if not is_question_end and len(combined) < max_buffer_length:
#             # Wait for more segments
#             return
#
#         # We have a full (or forced) question
#         question_text = combined.rstrip('.!? ')  # remove trailing punctuation
#         pending_question = []  # reset buffer
#
#         # Classify and print result
#         category = classifier.classify_question(question_text)
#         print(f"\nTranscribed Question: {question_text}?\nClassified as: {category}\n")
#
#     stt = SpeechToText(
#         audio_queue=recorder.audio_queue,
#         model_name="base",
#         segment_length=2.0,  # shorter segments for faster transcription
#         sample_rate=16000,
#         callback=handle_transcript,
#         timeout=0.5,           # faster polling
#         language="en"
#     )
#     stt.start()
#
#     # Keep running
#     try:
#         while True:
#             time.sleep(0.2)
#     except KeyboardInterrupt:
#         shutdown(None, None)
#
#
# if __name__ == "__main__":
#     main()


# test_pipeline.py

import time
import sys
import signal

from src.audio.recorder import AudioRecorder
from src.audio.speech_to_text import SpeechToText
from src.nlp.classifier import QuestionClassifier


def main():
    """
    End-to-end test with utterance grouping based on silence detection.
    Buffers transcript segments and flushes when no new segments arrive
    within a short interval, reducing fragment splitting.
    """
    def shutdown(signum, frame):
        print("\nShutting down pipeline...")
        recorder.stop_recording()
        stt.stop()
        sys.exit(0)

    # Handle interrupt signals
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Initialize audio recorder
    recorder = AudioRecorder(sample_rate=16000, chunk_size=1024, channels=1)
    recorder.start_recording()

    # Initialize classifier
    classifier = QuestionClassifier()
    print("Pipeline ready. Listening and grouping utterances...")

    # Buffers for incoming transcripts
    pending_segments: list[str] = []
    last_ts: float = 0.0
    flush_interval = 0.8  # seconds of silence before flushing buffer

    # Callback: collect each transcription segment
    def handle_transcript(text: str) -> None:
        nonlocal pending_segments, last_ts
        cleaned = text.strip()
        if not cleaned:
            return
        pending_segments.append(cleaned)
        last_ts = time.time()

    # Start STT with Whisper Tiny for speed
    stt = SpeechToText(
        audio_queue=recorder.audio_queue,
        model_name="tiny.en",
        segment_length=5,
        sample_rate=16000,
        callback=handle_transcript,
        timeout=0.8,
        language="en",
        noise_threshold=0.005,
    )
    stt.start()

    # Main loop: flush on silence
    try:
        while True:
            time.sleep(0.1)
            if pending_segments and (time.time() - last_ts) > flush_interval:
                combined = " ".join(pending_segments)
                print(f"\nTranscribed: {combined}")
                category = classifier.classify_question(combined)
                print(f"Classified as: {category}\n")
                pending_segments.clear()
    except KeyboardInterrupt:
        shutdown(None, None)


if __name__ == "__main__":
    main()
