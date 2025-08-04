# test_transcribe.py

import time
import sys
import signal
from src.audio.recorder import AudioRecorder
from src.audio.speech_to_text import SpeechToText


def main():
    # Graceful shutdown handler
    def shutdown(signum, frame):
        print("\nShutting down...")
        recorder.stop_recording()
        stt.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Initialize recorder
    recorder = AudioRecorder(sample_rate=16000, chunk_size=1024, channels=1)
    recorder.start_recording()

    # Initialize Speech-to-Text with callback to print transcripts
    stt = SpeechToText(
        audio_queue=recorder.audio_queue,
        model_name="base",
        segment_length=3.0,
        sample_rate=16000,
        callback=lambda txt: print(f"Transcribed: {txt}"),
        timeout=1.0,
        language="en"
    )
    stt.start()

    print("Recording and transcribing... Press Ctrl+C to stop.")

    # Keep main thread alive
    while True:
        time.sleep(1)


if __name__ == "__main__":
    main()
