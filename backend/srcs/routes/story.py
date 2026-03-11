from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from database import get_stories_collection
from dto.story_dto import CreateStoryRequest
from srcs.core.dependencies import get_current_user

router = APIRouter(prefix="/stories", tags=["stories"])


def _build_story_summary(doc: dict) -> str:
    """Build a readable short summary for clients that expect description fields."""
    existing = (doc.get("summary") or doc.get("description") or "").strip()
    if existing:
        return existing

    pages = doc.get("pages") if isinstance(doc.get("pages"), list) else []
    for page in pages:
        if not isinstance(page, dict):
            continue
        candidate = (
            (page.get("english_translation") or "").strip()
            or (page.get("translation") or "").strip()
            or (page.get("indigenous_text") or "").strip()
            or (page.get("text") or "").strip()
        )
        if candidate:
            return candidate[:240]

    text = (doc.get("text") or "").strip()
    return text[:240] if text else ""

def _story_to_response(doc: dict) -> dict:
    summary = _build_story_summary(doc)

    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", ""),
        "language": doc.get("language", ""),
        "text": doc.get("text"),
        "pages": doc.get("pages", []),
        "summary": summary,
        "description": summary,
        "childrenVersion": doc.get("childrenVersion") or "",
        "audioUrl": doc.get("audioUrl") or "",
        "createdBy": str(doc["createdBy"]) if doc.get("createdBy") else None,
        "tags": doc.get("tags", []),
        "createdAt": doc.get("createdAt"),
    }

@router.post("", status_code=201)
async def create_story(
    request: CreateStoryRequest,
    user: dict = Depends(get_current_user),
):

    collection = get_stories_collection()
    story_doc = {
        "title": request.title.strip(),
        "language": request.language.strip(),
        "text": request.text.strip() if request.text else "",
        "childrenVersion": request.childrenVersion.strip() if request.childrenVersion else "",
        "audioUrl": request.audioUrl.strip() if request.audioUrl else "",
        "createdBy": user["_id"],
        "tags": request.tags[:20] if request.tags else [],
        "pages": request.pages if request.pages else [],
        "createdAt": datetime.utcnow(),
    }

    result = await collection.insert_one(story_doc)
    story_doc["_id"] = result.inserted_id
    story_doc["createdBy"] = str(story_doc["createdBy"])

    return {
        "message": "Story created successfully",
        "story": _story_to_response({**story_doc, "createdBy": user["_id"]}),
    }

@router.get("")
async def list_stories(
    language: str | None = Query(None, description="Filter by language"),
    tags: str | None = Query(None, description="Comma-separated tags to filter"),
):

    collection = get_stories_collection()
    query: dict = {}
    if language:
        query["language"] = language
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list:
            query["tags"] = {"$in": tag_list}

    cursor = collection.find(query).sort("createdAt", -1)
    docs = await cursor.to_list(length=100)
    return [_story_to_response(d) for d in docs]

@router.get("/me/created")
async def get_my_created_stories(
    user: dict = Depends(get_current_user),
):
    """List stories created by the authenticated user."""
    collection = get_stories_collection()
    cursor = collection.find({"createdBy": user["_id"]}).sort("createdAt", -1)
    docs = await cursor.to_list(length=200)
    return [_story_to_response(d) for d in docs]

@router.get("/{story_id}")
async def get_story(story_id: str):

    if not ObjectId.is_valid(story_id):
        raise HTTPException(status_code=404, detail="Story not found")

    collection = get_stories_collection()
    doc = await collection.find_one({"_id": ObjectId(story_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Story not found")

    return _story_to_response(doc)
