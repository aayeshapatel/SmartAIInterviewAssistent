# src/nlp/classifier.py

import logging
from typing import Literal, List

import torch
from transformers import pipeline


class QuestionClassifier:
    """
    Classifies interview questions into one of: HR, Technical, Behavioral, or General.
    Uses a zero-shot classification pipeline (BART Large MNLI).
    """

    def __init__(self) -> None:
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(self.__class__.__name__)

        # Candidate labels
        self.labels: List[str] = ["HR", "Technical", "Behavioral", "General"]

        # Choose device: GPU if available, else CPU
        device = 0 if torch.cuda.is_available() else -1
        self.logger.info(f"Loading zero-shot classification model on {'GPU' if device==0 else 'CPU'}.")

        # Initialize zero-shot classifier
        self.classifier = pipeline(
            task="zero-shot-classification",
            model="facebook/bart-large-mnli",
            device=device,
        )

    def classify_question(self, question: str) -> Literal["hr", "technical", "behavioral", "general"]:
        """
        Classify the input question text and return the category in lowercase.

        :param question: transcribed question text
        :return: one of 'hr', 'technical', 'behavioral', 'general'
        """
        try:
            result = self.classifier(
                sequences=question,
                candidate_labels=self.labels,
                multi_label=False,
            )
            top_label: str = result["labels"][0]
            self.logger.debug(f"Classification result: {top_label} (scores: {result['scores'][0]:.2f})")
            return top_label.lower()

        except Exception as e:
            self.logger.exception(f"Error classifying question: {e}")
            # Fallback: simple keyword-based heuristic
            q_lower = question.lower()
            if any(kw in q_lower for kw in ["tell me", "why", "strength"]):
                return "hr"
            if any(kw in q_lower for kw in ["how", "what is", "explain", "difference"]):
                return "technical"
            if any(kw in q_lower for kw in ["describe", "time you", "example", "situation"]):
                return "behavioral"
            return "general"
