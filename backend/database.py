"""MongoDB database connection and utilities."""

import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = "borneo_language_archive"

# Global client instance
_client: AsyncIOMotorClient | None = None


def get_database():
    """Get MongoDB database instance. Creates connection if needed."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGODB_URI)
    return _client[DATABASE_NAME]


def get_users_collection():
    """Get the users collection."""
    return get_database()["users"]


async def ensure_indexes():
    """Create indexes for data integrity. Call on app startup. Matches db_docs.md."""
    db = get_database()
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


def get_recordings_collection():
    """Get the recordings collection."""
    return get_database()["recordings"]


def get_stories_collection():
    """Get the stories collection."""
    return get_database()["stories"]


def get_lessons_collection():
    """Get the lessons collection."""
    return get_database()["lessons"]
