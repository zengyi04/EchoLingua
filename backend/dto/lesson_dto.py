from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class VocabularyItem(BaseModel):
    """Vocabulary entry in a lesson."""

    word: str = Field(..., min_length=1)
    translation: str = Field(..., min_length=1)
    audioUrl: str = Field(default="")


class QuizItem(BaseModel):
    """Quiz question in a lesson."""

    question: str = Field(..., min_length=1)
    options: List[str] = Field(..., min_length=2)
    answer: str = Field(..., min_length=1)


class CreateLessonRequest(BaseModel):
    """Request body for POST /lessons."""

    title: str = Field(..., min_length=1, max_length=300)
    category: str = Field(..., min_length=1, max_length=100)
    difficulty: Literal["beginner", "intermediate", "advanced"]
    language: str = Field(..., min_length=1, max_length=50)
    vocabulary: List[VocabularyItem] = Field(default_factory=list)
    quiz: List[QuizItem] = Field(default_factory=list)


class LessonDTO(BaseModel):
    """Legacy lesson schema (for reference)."""

    title: str
    category: str
    difficulty: Literal["beginner", "intermediate", "advanced"]
    language: str
    vocabulary: List[VocabularyItem]
    quiz: List[QuizItem]
    createdAt: Optional[datetime] = None