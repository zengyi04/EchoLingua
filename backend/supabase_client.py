import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load .env from backend directory (works regardless of cwd)
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "SUPABASE_URL and SUPABASE_KEY must be set in .env. "
        "Get them from Supabase Dashboard → Project Settings → API."
    )

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
