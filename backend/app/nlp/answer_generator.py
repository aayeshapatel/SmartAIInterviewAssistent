# # backend/app/nlp/answer_generator.py
#
# import logging
# import requests
# from typing import Optional, Dict, Any
#
#
# class AnswerGenerator:
#     """
#     Generates interview answers via a local Ollama LLM HTTP API.
#     Supports contextual prompts when profile data is provided.
#     """
#
#     def __init__(
#         self,
#         model_name: str = "llama3:8b",
#         ollama_url: str = "http://localhost:11434",
#         timeout: float = 10.0,
#         include_context: bool = True,
#     ) -> None:
#         self.model_name = model_name
#         self.ollama_url = ollama_url.rstrip('/')
#         self.timeout = timeout
#         self.include_context = include_context
#
#         # Configure logging
#         logging.basicConfig(level=logging.INFO)
#         self.logger = logging.getLogger(self.__class__.__name__)
#
#     def generate_answer(
#         self,
#         question: str,
#         question_type: str,
#         profile: Optional[Dict[str, Any]] = None,
#     ) -> str:
#         """
#         Call the Ollama API to generate an answer.
#
#         :param question: The interview question text
#         :param question_type: One of 'hr','technical','behavioral','general'
#         :param profile: Optional context dict with keys: job_role, company, experience, skills
#         :return: Generated answer string
#         """
#         prompt = self._build_prompt(question, question_type, profile)
#         payload = {
#             "model": self.model_name,
#             "prompt": prompt,
#             "stream": False
#         }
#
#         try:
#             resp = requests.post(
#                 f"{self.ollama_url}/api/generate",
#                 json=payload,
#                 timeout=self.timeout
#             )
#             resp.raise_for_status()
#             data = resp.json()
#             answer = data.get("response", "").strip()
#             return answer
#         except Exception as e:
#             self.logger.exception(f"Failed to generate answer: {e}")
#             return "Error: could not generate answer."
#
#     def _build_prompt(
#         self,
#         question: str,
#         question_type: str,
#         profile: Optional[Dict[str, Any]] = None,
#     ) -> str:
#         """
#         Build the LLM prompt with optional context.
#         """
#         qt = question_type.lower()
#         parts = []
#         if self.include_context and profile:
#             ctx = []
#             for key in ["job_role", "company", "experience", "skills"]:
#                 if profile.get(key):
#                     ctx.append(f"{key.replace('_',' ').title()}: {profile[key]}")
#             if ctx:
#                 parts.append("Context:")
#                 parts.extend(ctx)
#                 parts.append("")
#         parts.append(f"Question ({qt.title()}): {question}")
#
#         if qt == 'hr':
#             parts.append("Answer briefly and professionally.")
#         elif qt == 'technical':
#             parts.append("Answer with clear technical details and examples.")
#         elif qt == 'behavioral':
#             parts.append("Use the STAR method (Situation, Task, Action, Result)")
#         else:
#             parts.append("Provide a concise, polite response.")
#
#         return "\n".join(parts)

# backend/app/nlp/answer_generator.py

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

        # Add context if enabled
        if self.include_context and profile:
            ctx = []
            for key in ["job_role", "company", "experience", "skills"]:
                if profile.get(key):
                    ctx.append(f"{key.replace('_',' ').title()}: {profile[key]}")
            if ctx:
                parts.append("Context:")
                parts.extend(ctx)
                parts.append("")

        # Use question type label in prompt
        label = qt.title()
        question_label = f"Question ({label}): {question.strip().rstrip('?')}?"
        parts.append(question_label)

        # Add guidance based on type
        if qt == 'hr':
            parts.append("Answer briefly and professionally.")
        elif qt == 'technical':
            parts.append("Answer with clear technical details and examples.")
        elif qt == 'behavioral':
            parts.append("Use the STAR method (Situation, Task, Action, Result) in your answer.")
        else:
            parts.append("Provide a concise, polite response.")

        # Join parts with newlines
        return "\n".join(parts)
