from datetime import datetime
from typing import Literal

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

from database import get_lessons_collection
from dto.lesson_dto import CreateLessonRequest

router = APIRouter(prefix="/lessons", tags=["lessons"])


def _lesson_to_response(doc: dict) -> dict:
    """Convert MongoDB document to API response."""
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", ""),
        "category": doc.get("category", ""),
        "difficulty": doc.get("difficulty", ""),
        "language": doc.get("language", ""),
        "vocabulary": doc.get("vocabulary", []),
        "quiz": doc.get("quiz", []),
        "createdAt": doc.get("createdAt"),
    }


@router.post("", status_code=201)
async def create_lesson(request: CreateLessonRequest):
    """
    Create a new lesson. No auth required per Core API spec.
    """
    collection = get_lessons_collection()
    lesson_doc = {
        "title": request.title.strip(),
        "category": request.category.strip(),
        "difficulty": request.difficulty,
        "language": request.language.strip(),
        "vocabulary": [v.model_dump() for v in request.vocabulary],
        "quiz": [q.model_dump() for q in request.quiz],
        "createdAt": datetime.utcnow(),
    }

    result = await collection.insert_one(lesson_doc)
    lesson_doc["_id"] = result.inserted_id

    return {
        "message": "Lesson created successfully",
        "lesson": _lesson_to_response(lesson_doc),
    }


@router.get("")
async def list_lessons(
    difficulty: Literal["beginner", "intermediate", "advanced"] | None = Query(
        None, description="Filter by difficulty"
    ),
    language: str | None = Query(None, description="Filter by language"),
    category: str | None = Query(None, description="Filter by category"),
):
    """
    List lessons with optional filters.

    Query params: difficulty, language, category
    """
    collection = get_lessons_collection()
    query: dict = {}
    if difficulty:
        query["difficulty"] = difficulty
    if language:
        query["language"] = language
    if category:
        query["category"] = category

    cursor = collection.find(query).sort("createdAt", -1)
    docs = await cursor.to_list(length=100)
    return [_lesson_to_response(d) for d in docs]


@router.get("/{lesson_id}")
async def get_lesson(lesson_id: str):
    """Get a single lesson by ID with full vocabulary and quiz data."""
    if not ObjectId.is_valid(lesson_id):
        raise HTTPException(status_code=400, detail="Invalid lesson ID")

    collection = get_lessons_collection()
    doc = await collection.find_one({"_id": ObjectId(lesson_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return _lesson_to_response(doc)
