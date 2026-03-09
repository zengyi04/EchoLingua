from datetime import datetime
from typing import Literal
from bson import ObjectId
from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from database import get_recordings_collection
from srcs.services.storage_service import upload_recording_from_bytes

router = APIRouter(prefix="/recordings", tags=["recordings"])

def _recording_to_response(doc: dict) -> dict:

    out = {
        "id": str(doc["_id"]),
        "audioUrl": doc.get("audioUrl", ""),
        "language": doc.get("language", ""),
        "createdAt": doc.get("createdAt"),
    }
    if "transcript" in doc:
        out["transcript"] = doc["transcript"]
    if "visibility" in doc:
        out["visibility"] = doc["visibility"]
    return out


@router.get("")
async def list_recordings(
    language: str | None = Query(None, description="Filter by language"),
    userId: str | None = Query(None, description="Filter by user ID"),
):

    collection = get_recordings_collection()
    query: dict = {}
    if language:
        query["language"] = language
    if userId and ObjectId.is_valid(userId):
        query["userId"] = ObjectId(userId)

    cursor = collection.find(query).sort("createdAt", -1)
    docs = await cursor.to_list(length=100)
    return [_recording_to_response(d) for d in docs]


@router.get("/{recording_id}")
async def get_recording(recording_id: str):

    if not ObjectId.is_valid(recording_id):
        raise HTTPException(status_code=400, detail="Invalid recording ID")

    collection = get_recordings_collection()
    doc = await collection.find_one({"_id": ObjectId(recording_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Recording not found")

    return _recording_to_response(doc)


@router.post("/upload")
async def upload_recording(
    file: UploadFile = File(...),
    userId: str = Form(...),
    transcript: str = Form(default=""),
    language: str = Form(...),
    duration: int = Form(default=0),
    consent: bool = Form(...),
    visibility: Literal["private", "community", "public"] = Form(default="community"),
):
    """
    Upload an audio recording to Supabase Storage and save metadata to MongoDB.

    Flow:
    1. Upload file to Supabase Storage
    2. Get public URL
    3. Store recording document in MongoDB
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required")
    if not ObjectId.is_valid(userId):
        raise HTTPException(status_code=400, detail="Invalid userId format")

    file_name = file.filename
    # Ensure unique filename using timestamp
    stem = file_name.rsplit(".", 1)[0] if "." in file_name else file_name
    ext = file_name.rsplit(".", 1)[1] if "." in file_name else "mp3"
    unique_name = f"{stem}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{ext}"

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}") from e

    # 1. Upload to Supabase Storage
    try:
        audio_url = upload_recording_from_bytes(content, unique_name)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload to storage: {str(e)}",
        ) from e

    # 2. Build recording document
    recording = {
        "userId": ObjectId(userId),
        "audioUrl": audio_url,
        "transcript": transcript,
        "language": language,
        "duration": duration,
        "consent": consent,
        "visibility": visibility,
        "aiProcessed": False,
        "createdAt": datetime.utcnow(),
    }

    # 3. Save to MongoDB
    try:
        collection = get_recordings_collection()
        result = await collection.insert_one(recording)
        recording["_id"] = str(result.inserted_id)
        recording["userId"] = str(recording["userId"])
        return recording
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save to database: {str(e)}",
        ) from e
