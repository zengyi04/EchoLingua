from pydantic import BaseModel
from typing import List, Literal
from datetime import datetime


class VocabularyItem(BaseModel):
    word: str
    translation: str
    audioUrl: str


class QuizItem(BaseModel):
    question: str
    options: List[str]
    answer: str


class LessonDTO(BaseModel):
    title: str
    category: str
    difficulty: Literal["beginner", "intermediate", "advanced"]
    language: str
    vocabulary: List[VocabularyItem]
    quiz: List[QuizItem]
    createdAt: datetime