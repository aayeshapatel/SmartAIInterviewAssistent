# from fastapi import FastAPI
# from app.api import transcribe, classify, generate
#
# app = FastAPI(title="SAIIA Backend")
#
# app.include_router(transcribe.router, prefix="/transcribe", tags=["Transcribe"])
# app.include_router(classify.router, prefix="/classify", tags=["Classify"])
# app.include_router(generate.router, prefix="/generate", tags=["Generate"])



# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import transcribe, classify, generate

app = FastAPI(title="SAIIA Backend")

# ─── CORS CONFIG ───────────────────────────────────────────────────────────────
origins = [
    "http://localhost:5173",  # your Vite dev server
    # add other origins here (e.g. production URLs) as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ────────────────────────────────────────────────────────────────────────────────

# Mount the three API routers
app.include_router(transcribe.router, prefix="/transcribe", tags=["Transcribe"])
app.include_router(classify.router,   prefix="/classify",   tags=["Classify"])
app.include_router(generate.router,   prefix="/generate",   tags=["Generate"])
