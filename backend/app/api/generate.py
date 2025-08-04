from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
from pydantic import BaseModel
import logging

from app.nlp.answer_generator import AnswerGenerator

# Initialize router and logger
router = APIRouter()
logger = logging.getLogger("generate_api")
logging.basicConfig(level=logging.INFO)

# Initialize generator with context support
generator = AnswerGenerator(include_context=True)

# Pydantic request/response models
class GenerateRequest(BaseModel):
    question: str
    category: str
    profile: Optional[Dict[str, Any]] = None

class GenerateResponse(BaseModel):
    answer: str

@router.post("/", response_model=GenerateResponse)
async def generate_answer(req: GenerateRequest):
    """
    Accepts a JSON payload with `question`, `category`, and optional `profile`,
    returns an AI-generated answer.
    """
    # Validate input
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="`question` field cannot be empty.")
    if not req.category or not req.category.strip():
        raise HTTPException(status_code=400, detail="`category` field cannot be empty.")

    try:
        # Generate the answer
        answer = generator.generate_answer(
            question=req.question,
            question_type=req.category,
            profile=req.profile or {}
        )
        logger.info(f"Generated answer for question '{req.question[:30]}...' ")
        return GenerateResponse(answer=answer)
    except Exception as e:
        logger.exception(f"Error generating answer: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal error during answer generation."
        )