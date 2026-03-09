import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from supabase import create_client

# Load .env from backend directory (works regardless of cwd)
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
_supabase_client: Any | None = None


def get_supabase_client() -> Any:
    """Get (or lazily create) the Supabase client.

    We avoid raising at import-time so the API can still boot for routes that
    don't require storage.
    """
    global _supabase_client

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_KEY must be set in backend/.env. "
            "Get them from Supabase Dashboard -> Project Settings -> API."
        )

    if _supabase_client is None:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

    return _supabase_client
