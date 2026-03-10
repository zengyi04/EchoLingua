from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Form
from srcs.core.dependencies import get_current_user
from srcs.services.ai.ai_dtos import (
    ElicitationTextRequest, ElicitationResponse,
    TranslationRequest, TranslationAPIRequest, TranslationResponse,
    VisionRequest, VisionAPIRequest, VisionResponse,
    StoryGenerateRequest, StoryGenerateResponse,
    TTSRequest, TTSAPIRequest, TTSResponse,
    CLLDEntry
)
from srcs.services.ai.elicitation_service import elicitation_service
from srcs.services.ai.translation_service import translation_service
from srcs.services.ai.vision_service import vision_service
from srcs.services.ai.story_service import story_service
from srcs.services.ai.tts_service import tts_service
from srcs.services.ai.dictionary_repo import DictionaryRepository, dictionary_repo
from srcs.services.storage_service import upload_recording_from_bytes
from database import get_recordings_collection
from datetime import datetime
from bson import ObjectId


def get_dictionary_repo() -> DictionaryRepository:
    """Dependency for dictionary repository."""
    return dictionary_repo

router = APIRouter(prefix="/ai", tags=["ai"])

# ---------------------------------------------------------------------------
# Phase 1: Elicitation (Ingestion)
# ---------------------------------------------------------------------------

@router.post("/elicit/text", response_model=ElicitationResponse)
async def elicit_text(
    request: ElicitationTextRequest,
    user: dict = Depends(get_current_user)
):
    """Draft and persist a dictionary entry from text elicitation."""
    try:
        response = await elicitation_service.process_text(
            anchor_text=request.anchor_text,
            indigenous_response=request.indigenous_response
        )
        
        # Override language_id if provided in request, otherwise use LLM's guess
        if request.language_id:
            response.draft_dictionary_entry.language_id = request.language_id
            
        # Save to dictionary repo
        await elicitation_service.repo.save_entry(response.draft_dictionary_entry)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/elicit/audio", response_model=ElicitationResponse)
async def elicit_audio(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """
    Draft a dictionary entry from an audio recording.
    1. Upload to Supabase
    2. Register in 'recordings' collection
    3. Process with AI and save to 'dictionary'
    """
    try:
        audio_bytes = await file.read()
        
        # 1. Upload to Supabase
        file_name = f"elicit_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        audio_url = upload_recording_from_bytes(audio_bytes, file_name)
        
        # 2. Register metadata in 'recordings'
        rec_collection = get_recordings_collection()
        await rec_collection.insert_one({
            "userId": user["_id"],
            "audioUrl": audio_url,
            "language": "kadazan-demo", # Default for now
            "aiProcessed": True,
            "createdAt": datetime.utcnow(),
            "tags": ["elicitation"]
        })

        # 3. AI Processing
        response = await elicitation_service.process_audio(
            audio_bytes=audio_bytes,
            mime_type=file.content_type or "audio/mp3",
            source_audio_url=audio_url
        )
        
        # 4. Save to dictionary repo
        await elicitation_service.repo.save_entry(response.draft_dictionary_entry)
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Phase 2: Verification (Management)
# ---------------------------------------------------------------------------

@router.get("/dictionary", response_model=list[CLLDEntry])
async def list_dictionary(
    status: str | None = Query(None, description="Filter by status (pending_verification|verified)"),
    language_id: str = "kadazan-demo",
    repo: DictionaryRepository = Depends(get_dictionary_repo),
    user: dict = Depends(get_current_user)
):
    """List dictionary entries for review or reference."""
    if status == "verified":
        return await repo.get_verified(language_id)
    elif status == "pending_verification":
        all_entries = await repo.get_all(language_id)
        return [e for e in all_entries if e.status == "pending_verification"]
    else:
        return await repo.get_all(language_id)

@router.post("/dictionary/{entry_id}/verify")
async def verify_entry(
    entry_id: str,
    repo: DictionaryRepository = Depends(get_dictionary_repo),
    user: dict = Depends(get_current_user)
):
    """Linguist verification of a drafted entry."""
    success = await repo.verify_entry(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entry not found or already verified")
    return {"message": "Entry verified successfully"}

@router.delete("/dictionary/{entry_id}")
async def delete_entry(
    entry_id: str,
    repo: DictionaryRepository = Depends(get_dictionary_repo),
    user: dict = Depends(get_current_user)
):
    """Reject/Delete a dictionary entry."""
    success = await repo.delete_entry_by_uuid(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted successfully"}


# ---------------------------------------------------------------------------
# Phase 3: Consumption (RAG)
# ---------------------------------------------------------------------------

@router.post("/translate", response_model=TranslationResponse)
async def translate(
    request: TranslationAPIRequest,
    user: dict = Depends(get_current_user)
):
    """Translate text using the verified dictionary (RAG)."""
    try:
        return await translation_service.translate_with_db(
            source_text=request.source_text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            language_id=request.language_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vision", response_model=VisionResponse)
async def extract_vision(
    request: VisionAPIRequest,
    user: dict = Depends(get_current_user)
):
    """Detect objects from text description (fallback)."""
    try:
        return await vision_service.extract_vocab_with_db(
            description=request.description,
            language_id=request.language_id
        )
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/vision/image", response_model=VisionResponse)
async def extract_vision_image(
    file: UploadFile = File(...),
    language_id: str = Form("kadazan-demo"),
    user: dict = Depends(get_current_user)
):
    """Detect objects in an uploaded image and look up indigenous vocab."""
    try:
        image_bytes: bytes = await file.read()
        
        # 1. Upload to Supabase (consistent with audio elicitation)
        file_ext: str = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
        unique_filename: str = f"vision_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{file_ext}"
        image_url: str = upload_recording_from_bytes(image_bytes, unique_filename)
        
        # 2. Register metadata in 'recordings'
        rec_collection = get_recordings_collection()
        user_id_val: str = str(user.get("_id") or user.get("id"))
        
        await rec_collection.insert_one({
            "userId": ObjectId(user_id_val),
            "audioUrl": image_url, # Reusing audioUrl field for generic media URL
            "language": language_id,
            "aiProcessed": True,
            "createdAt": datetime.utcnow(),
            "tags": ["vision_image"]
        })

        # 3. AI Processing
        return await vision_service.extract_vocab_with_db(
            image_bytes=image_bytes,
            mime_type=file.content_type or "image/jpeg",
            language_id=language_id
        )
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/story", response_model=StoryGenerateResponse)
async def generate_story(
    request: StoryGenerateRequest,
    user: dict = Depends(get_current_user)
):
    """Generate a bilingual children's story and save to the core collection."""
    try:
        story_response = await story_service.generate_book(request)
        
        # Get user ID safely (handle both ObjectId and string if necessary)
        user_id = user.get("_id") or user.get("id")
        
        # Persist to database so it appears in the main 'Stories' gallery
        await story_service.save_to_db(story_response, str(user_id))
        
        return story_response
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tts", response_model=TTSResponse)
async def get_audio(
    request: TTSAPIRequest,
    user: dict = Depends(get_current_user)
):
    """Convert indigenous text to IPA phonemes and synthesize audio."""
    try:
        return await tts_service.to_audio_with_db(
            indigenous_text=request.indigenous_text,
            language_id=request.language_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

