import os

class Settings:
    WHISPER_MODEL = "base"
    LLM_MODEL = "llama3:8b"
    OLLAMA_URL = "http://localhost:11434"
    DB_PATH = "data/user_profiles.db"

settings = Settings()
