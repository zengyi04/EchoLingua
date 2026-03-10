import pytest
from httpx import AsyncClient, ASGITransport
import uuid
from pathlib import Path
import sys
from bson import ObjectId

# Add project root to path for imports
sys.path.append(str(Path(__file__).resolve().parents[1]))

from main import app
from srcs.core.dependencies import get_current_user
from srcs.services.ai.dictionary_repo import DictionaryRepository
from srcs.services.ai.ai_dtos import CLLDEntry
from srcs.routes.ai import get_dictionary_repo
import database

# ---------------------------------------------------------------------------
# SETUP
# ---------------------------------------------------------------------------

TEST_LANG_ID: str = "test-vision-image-live"

async def mock_get_current_user() -> dict:
    """Mock authentication."""
    return {
        "_id": ObjectId("65edc9f1f1d1e1e1e1e1e1e1"), 
        "id": "test-user-live", 
        "username": "test_linguist_live"
    }

app.dependency_overrides[get_current_user] = mock_get_current_user

@pytest.fixture(scope="module")
def anyio_backend() -> str:
    """Anyio backend."""
    return "asyncio"

@pytest.fixture
async def async_client() -> AsyncClient:
    """Async client for testing FastAPI with httpx."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def repo() -> DictionaryRepository:
    """Fresh DictionaryRepository per test."""
    database._client = None
    collection = database.get_dictionary_collection()
    r: DictionaryRepository = DictionaryRepository(collection=collection)
    app.dependency_overrides[get_dictionary_repo] = lambda: r
    yield r
    if get_dictionary_repo in app.dependency_overrides:
        del app.dependency_overrides[get_dictionary_repo]

# ---------------------------------------------------------------------------
# TESTS
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_vision_image_live_workflow(async_client: AsyncClient, repo: DictionaryRepository) -> None:
    """
    Test the full image upload -> AI vision workflow.
    Ensures image is uploaded to Supabase and registered in recordings.
    """
    # 1. Setup: Add a keyword to DB for RAG lookup
    test_id: str = str(uuid.uuid4())
    await repo.save_entry(CLLDEntry(
        id=test_id,
        word="Walai",
        pos="noun",
        translation_malay="Rumah",
        translation_english="House",
        language_id=TEST_LANG_ID,
        status="verified"
    ))
    
    # 2. Prepare a mock image file (1x1 transparent PNG)
    mock_image_bytes: bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00"
        b"\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00"
        b"\x00\x00IEND\xaeB`\x82"
    )
    
    files: dict = {"file": ("test.png", mock_image_bytes, "image/png")}
    data: dict = {"language_id": TEST_LANG_ID}
    
    # 3. Request
    response = await async_client.post("/ai/vision/image", files=files, data=data)
    
    # 4. Assertions
    assert response.status_code == 200
    res_json: dict = response.json()
    assert "detected_english" in res_json
    # Note: AI might not detect anything in a 1x1 pixel, but we verify the plumbing
    
    # 5. Verify recording metadata exists
    rec_coll = database.get_recordings_collection()
    recording: dict | None = await rec_coll.find_one({
        "userId": ObjectId("65edc9f1f1d1e1e1e1e1e1e1"),
        "tags": "vision_image"
    })
    
    assert recording is not None
    assert "audioUrl" in recording
    assert recording["language"] == TEST_LANG_ID
    
    # Cleanup
    await repo.delete_entry_by_uuid(test_id)
    await rec_coll.delete_one({"_id": recording["_id"]})
