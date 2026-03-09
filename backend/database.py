import logging
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
import certifi

_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = "borneo_language_archive"

# Global client instance
_client: AsyncIOMotorClient | None = None
logger = logging.getLogger(__name__)

def get_database():
    """Get MongoDB database instance. Creates connection if needed."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            MONGODB_URI,
            tlsCAFile=certifi.where()
        )
    return _client[DATABASE_NAME]

def get_users_collection():
    """Get the users collection."""
    return get_database()["users"]

async def ensure_indexes():
    """Create indexes for data integrity. Call on app startup. Matches db_docs.md."""
    db = get_database()
    try:
        # Users: email (unique), role per db_docs §4
        await db["users"].create_index("email", unique=True)
        await db["users"].create_index("role")
        # Recordings: userId, language, createdAt per db_docs §5
        await db["recordings"].create_index("userId")
        await db["recordings"].create_index("language")
        await db["recordings"].create_index([("createdAt", -1)])
        # Stories: language, tags, createdAt per db_docs §6
        await db["stories"].create_index("language")
        await db["stories"].create_index("tags")
        await db["stories"].create_index([("createdAt", -1)])
        # Lessons: language, difficulty, category, createdAt per db_docs §7
        await db["lessons"].create_index("language")
        await db["lessons"].create_index("difficulty")
        await db["lessons"].create_index("category")
        await db["lessons"].create_index([("createdAt", -1)])
        # Dictionary (CLLD entries): language_id, status, word+language_id unique
        await db["dictionary"].create_index("language_id")
        await db["dictionary"].create_index("status")
        await db["dictionary"].create_index(
            [("word", 1), ("language_id", 1)], unique=True
        )
    except PyMongoError as exc:
        logger.warning(
            "Skipping index creation because MongoDB is unreachable during startup: %s",
            exc,
        )

def get_recordings_collection():
    """Get the recordings collection."""
    return get_database()["recordings"]

def get_stories_collection():
    """Get the stories collection."""
    return get_database()["stories"]

def get_lessons_collection():
    """Get the lessons collection."""
    return get_database()["lessons"]

def get_dictionary_collection():
    """Get the dictionary (CLLD entries) collection."""
    return get_database()["dictionary"]
