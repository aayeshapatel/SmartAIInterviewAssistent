
import logging
import requests
from typing import Optional, Dict, Any


class AnswerGenerator:
    """
    Generates interview answers via a local Ollama LLM HTTP API.
    Supports contextual prompts when profile data is provided.
    """

    def __init__(
        self,
        model_name: str = "llama3:8b",
        ollama_url: str = "http://localhost:11434",
        timeout: float = 120.0,
        include_context: bool = True,
    ) -> None:
        self.model_name = model_name
        self.ollama_url = ollama_url.rstrip('/')
        self.timeout = timeout
        self.include_context = include_context

        # Configure logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(self.__class__.__name__)

    def generate_answer(
        self,
        question: str,
        question_type: str,
        profile: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Call the Ollama API to generate an answer.

        :param question: The interview question text
        :param question_type: One of 'hr','technical','behavioral','general'
        :param profile: Optional context dict with keys: job_role, company, experience, skills
        :return: Generated answer string
        """
        prompt = self._build_prompt(question, question_type, profile)
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False
        }

        try:
            resp = requests.post(
                f"{self.ollama_url}/api/generate",
                json=payload,
                timeout=self.timeout
            )
            resp.raise_for_status()
            data = resp.json()
            answer = data.get("response", "").strip()
            return answer
        except Exception as e:
            self.logger.exception(f"Failed to generate answer: {e}")
            return "Error: could not generate answer."
    def _build_prompt(
        self,
        question: str,
        question_type: str,
        profile: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Build the LLM prompt with optional context and explicit question type labeling.
        """
        qt = question_type.lower()
        parts = []

        # 1) Inject the candidate's resume and target role explicitly
        if self.include_context and profile:
            # If you have a free-form resume text:
            if profile.get("resume"):
                parts.append("Candidate Resume:")
                # limit to first 300 chars so prompt isn't enormous
                parts.append(profile["resume"][:300].strip() + ("..." if len(profile["resume"]) > 300 else ""))
                parts.append("")
            # Map your 'role' field into 'Job Role'
            if profile.get("role"):
                parts.append(f"Target Job Role: {profile['role']}")
                parts.append("")
            # Company remains useful for tailoring language:
            if profile.get("company"):
                parts.append(f"Company: {profile['company']}")
                parts.append("")

        # 2) Add the question
        label = qt.title()
        question_label = f"Question ({label}): {question.strip().rstrip('?')}?"
        parts.append(question_label)

        # 3) Guidance: for strengths questions, be explicit
        if "strength" in question.lower():
            parts.append(
                "Based on the candidate resume above, list the candidate's top 3 strengths "
                "in first person (“I am…”), using concrete examples from their experience."
            )
        elif qt == 'hr':
            parts.append("Answer briefly and professionally, weaving in the candidate's background.")
        elif qt == 'technical':
            parts.append("Answer with clear technical details and examples, referencing their skills.")
        elif qt == 'behavioral':
            parts.append("Use the STAR method (Situation, Task, Action, Result) and reference their experience.")
        else:
            parts.append("Provide a concise, polite response, grounded in the candidate's profile.")

        return "\n\n".join(parts)

