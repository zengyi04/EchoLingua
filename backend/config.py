"""Application configuration from environment variables."""

import os
from pathlib import Path

from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)

# JWT
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-use-long-random-string")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # 7 days
