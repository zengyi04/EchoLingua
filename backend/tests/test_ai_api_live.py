import os
import sys
import uuid
from pathlib import Path

import pytest
import os
import sys
import uuid
from pathlib import Path

import pytest
from httpx import AsyncClient, ASGITransport

# Add project root to path for imports
sys.path.append(str(Path(__file__).resolve().parents[1]))

from main import app
from srcs.core.dependencies import get_current_user
from srcs.services.ai.dictionary_repo import DictionaryRepository
from srcs.services.ai.ai_dtos import CLLDEntry
from srcs.routes.ai import get_dictionary_repo
import database
from bson import ObjectId

# ---------------------------------------------------------------------------
# LIVE SETUP (Connects to real DB)
# ---------------------------------------------------------------------------

# Use an isolated language_id to avoid polluting production data
TEST_LANG_ID = "test-live-run"

# Mock Authentication (bypass JWT)
async def mock_get_current_user():
    return {
        "_id": ObjectId("65edc9f1f1d1e1e1e1e1e1e1"), 
        "id": "test-user-live", 
        "username": "test_linguist_live"
    }

app.dependency_overrides[get_current_user] = mock_get_current_user

# ---------------------------------------------------------------------------
# FIXTURES
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"

@pytest.fixture
async def async_client():
    """Async client for testing FastAPI with httpx."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

from srcs.services.ai.elicitation_service import elicitation_service
from srcs.services.ai.translation_service import translation_service
from srcs.services.ai.vision_service import vision_service
from srcs.services.ai.tts_service import tts_service

@pytest.fixture
async def repo():
    """
    Fresh DictionaryRepository per test.
    Resets the global database client and patches all AI services to use the fresh repo.
    """
    # Reset the global client so it's recreated in the current event loop
    database._client = None
    collection = database.get_dictionary_collection()
    r = DictionaryRepository(collection=collection)
    
    # Patch all services that use a repository singleton
    # This is critical because the services were initialized with a stale repo
    elicitation_service.repo = r
    translation_service.repo = r
    vision_service.repo = r
    tts_service.repo = r

    # Override the dependency in the app
    app.dependency_overrides[get_dictionary_repo] = lambda: r
    
    yield r
    
    # Clean up override
    if get_dictionary_repo in app.dependency_overrides:
        del app.dependency_overrides[get_dictionary_repo]

@pytest.fixture
async def db_cleanup(repo: DictionaryRepository):
    """Tracks entry IDs created during tests and deletes them after."""
    created_ids = []
    yield created_ids
    
    print(f"\n[Cleanup] Removing {len(created_ids)} test entries...")
    for entry_id in created_ids:
        await repo.delete_entry_by_uuid(entry_id)

# ---------------------------------------------------------------------------
# API TESTS
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_elicit_text_live_workflow(async_client: AsyncClient, repo: DictionaryRepository, db_cleanup):
    """
    Test the full elicitation -> verification -> deletion workflow.
    This hits the Live LLM and Live Database.
    """
    # 1. ELICIT
    payload = {
        "anchor_text": "I want to eat rice",
        "indigenous_response": "Makan nahu oku do baras",
        "language_id": TEST_LANG_ID
    }
    response = await async_client.post("/ai/elicit/text", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    entry = data["draft_dictionary_entry"]
    entry_id = entry["id"]
    db_cleanup.append(entry_id) # Register for cleanup
    
    # 2. VERIFY THAT IT WAS SAVED AUTOMATICALLY
    # (No need to manual save anymore, the route does it)
    
    # 3. LIST (Management)
    list_response = await async_client.get(f"/ai/dictionary?language_id={TEST_LANG_ID}")
    assert list_response.status_code == 200
    entries = list_response.json()
    assert any(e["id"] == entry_id for e in entries)
    
    # 4. VERIFY (Management)
    verify_response = await async_client.post(f"/ai/dictionary/{entry_id}/verify")
    assert verify_response.status_code == 200
    assert verify_response.json()["message"] == "Entry verified successfully"
    
    # Verify status changed in DB
    list_verified = await async_client.get(f"/ai/dictionary?status=verified&language_id={TEST_LANG_ID}")
    assert any(e["id"] == entry_id for e in list_verified.json())
    
    # 5. DELETE (Management)
    delete_response = await async_client.delete(f"/ai/dictionary/{entry_id}")
    assert delete_response.status_code == 200
    
    # Verify gone
    list_after = await async_client.get(f"/ai/dictionary?language_id={TEST_LANG_ID}")
    assert not any(e["id"] == entry_id for e in list_after.json())

@pytest.mark.anyio
async def test_translate_live(async_client: AsyncClient, repo: DictionaryRepository, db_cleanup):
    """Test translation with Live LLM + Live DB (RAG)."""
    # Setup: Add a custom word to DB
    test_id = str(uuid.uuid4())
    db_cleanup.append(test_id)
    word_entry = CLLDEntry(
        id=test_id,
        word="Mogihon",
        pos="verb",
        translation_malay="Makan",
        translation_english="Eat",
        language_id=TEST_LANG_ID,
        status="verified"
    )
    await repo.save_entry(word_entry)
    
    payload = {
        "source_text": "I want to eat",
        "source_lang": "English",
        "target_lang": "Kadazan",
        "language_id": TEST_LANG_ID
    }
    response = await async_client.post("/ai/translate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "translated_text" in data
    # The LLM should ideally use our injected word "Mogihon"
    assert "Mogihon" in data["translated_text"] or len(data.get("words_used_from_dict", [])) > 0

@pytest.mark.anyio
async def test_vision_live(async_client: AsyncClient, repo: DictionaryRepository, db_cleanup):
    """Test vision analysis with Live LLM + Live DB."""
    # Setup: Add a keyword to DB
    test_id = str(uuid.uuid4())
    db_cleanup.append(test_id)
    await repo.save_entry(CLLDEntry(
        id=test_id,
        word="Walai",
        pos="noun",
        translation_malay="Rumah",
        translation_english="House",
        language_id=TEST_LANG_ID,
        status="verified"
    ))
    
    payload = {
        "description": "A beautiful big house near the river",
        "language_id": TEST_LANG_ID
    }
    response = await async_client.post("/ai/vision", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["found_in_dictionary"] is True
    assert data["indigenous_word"] == "Walai"

@pytest.mark.anyio
async def test_story_live(async_client: AsyncClient, repo: DictionaryRepository):
    """Test story generation with Live LLM."""
    payload = {
        "annotated_text": [
            {"indigenous_text": "Oku mogihon do walai", "malay_translation": "Saya makan di rumah"}
        ],
        "grammar_rules": ["S-V-O order", "Subject focus prefix 'm-'"]
    }
    response = await async_client.post("/ai/story", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert len(data["pages"]) > 0

@pytest.mark.anyio
async def test_tts_live(async_client: AsyncClient, repo: DictionaryRepository, db_cleanup):
    """Test phoneme bridge with Live LLM + Live DB."""
    # Setup: Add pronunciation hint
    test_id = str(uuid.uuid4())
    db_cleanup.append(test_id)
    await repo.save_entry(CLLDEntry(
        id=test_id,
        word="Nahu",
        pos="particle",
        translation_malay="Sudah",
        translation_english="Already",
        cultural_note="Pronounced with a glottal stop at the end /nahuʔ/",
        language_id=TEST_LANG_ID,
        status="verified"
    ))
    
    payload = {
        "indigenous_text": "Makan nahu oku",
        "language_id": TEST_LANG_ID
    }
    response = await async_client.post("/ai/tts", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "ipa_phonemes" in data
    assert "pronunciation_guide" in data

if __name__ == "__main__":
    import asyncio
    # For manual running without pytest
    print("Run this file using: pytest tests/test_ai_api_live.py")
