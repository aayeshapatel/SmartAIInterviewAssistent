# backend/app/api/classify.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.nlp.classifier import QuestionClassifier
import logging

# Initialize router and logger
router = APIRouter()
logger = logging.getLogger("classify_api")
logging.basicConfig(level=logging.INFO)

# Initialize the question classifier once
classifier = QuestionClassifier()


# Pydantic models for request and response
class ClassifyRequest(BaseModel):
    text: str


class ClassifyResponse(BaseModel):
    category: str


@router.post("/", response_model=ClassifyResponse)
async def classify_text(req: ClassifyRequest):
    """
    Accepts a JSON payload with `text` and returns the question category.
    """
    # Input validation
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="`text` field cannot be empty.")

    try:
        # Run classification
        category = classifier.classify_question(req.text)
        logger.info(f"Classified text '{req.text}' as '{category}'.")
        return ClassifyResponse(category=category)
    except Exception as e:
        logger.exception(f"Classification error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal error during classification."
        )
