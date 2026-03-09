import tempfile
from pathlib import Path
from supabase_client import SUPABASE_URL, get_supabase_client

def upload_recording(file_path: str, file_name: str) -> str:
    """
    Upload an audio recording from a local file path.

    Args:
        file_path: Local path to the file.
        file_name: Name to use when storing the file (e.g., elder_story_001.mp3).

    Returns:
        Public URL of the uploaded file.
    """
    supabase = get_supabase_client()

    with open(file_path, "rb") as f:
        supabase.storage.from_("recordings").upload(
            file_name,
            f,
        )

    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is not configured in backend/.env")

    url = f"{SUPABASE_URL}/storage/v1/object/public/recordings/{file_name}"
    return url

def upload_recording_from_bytes(file_content: bytes, file_name: str) -> str:
    """
    Upload an audio recording from bytes (e.g., from FastAPI UploadFile).

    Args:
        file_content: Raw file bytes.
        file_name: Name to use when storing the file.

    Returns:
        Public URL of the uploaded file.
    """
    with tempfile.NamedTemporaryFile(
        suffix=Path(file_name).suffix or ".mp3",
        delete=False,
    ) as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name
    try:
        return upload_recording(tmp_path, file_name)
    finally:
        Path(tmp_path).unlink(missing_ok=True)
