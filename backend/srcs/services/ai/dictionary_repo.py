"""Dictionary Repository — async CRUD for CLLD entries in MongoDB.

Thin layer over the ``dictionary`` collection using Dependency Injection.
"""

import traceback
from typing import Any

from pymongo.errors import PyMongoError
from motor.motor_asyncio import AsyncIOMotorCollection

from database import get_dictionary_collection
from srcs.services.ai.ai_dtos import CLLDEntry

__all__ = ["DictionaryRepository", "dictionary_repo"]


class DictionaryRepository:
    """Repository for managing CLLD dictionary entries in MongoDB."""

    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def save_entry(self, entry: CLLDEntry) -> str:
        """Upsert a single CLLDEntry into MongoDB.

        Uses ``word`` + ``language_id`` as the natural key.

        Returns:
            The stringified ``_id`` of the upserted document.
        """
        doc: dict = entry.model_dump()
        result = await self.collection.update_one(
            {"word": entry.word, "language_id": entry.language_id},
            {"$set": doc},
            upsert=True,
        )
        if result.upserted_id:
            return str(result.upserted_id)
        
        existing = await self.collection.find_one(
            {"word": entry.word, "language_id": entry.language_id},
            {"_id": 1},
        )
        return str(existing["_id"]) if existing else ""

    async def save_entries(self, entries: list[CLLDEntry]) -> int:
        """Bulk-upsert a list of CLLDEntry objects."""
        for entry in entries:
            await self.save_entry(entry)
        return len(entries)

    async def get_verified(self, language_id: str = "kadazan-demo") -> list[CLLDEntry]:
        """Fetch all verified CLLD entries for a language."""
        cursor = self.collection.find({"language_id": language_id, "status": "verified"})
        docs: list[dict] = await cursor.to_list(length=500)
        return [CLLDEntry.model_validate(doc) for doc in docs]

    async def get_all(self, language_id: str = "kadazan-demo") -> list[CLLDEntry]:
        """Fetch all CLLD entries for a language (any status)."""
        cursor = self.collection.find({"language_id": language_id})
        docs: list[dict] = await cursor.to_list(length=500)
        return [CLLDEntry.model_validate(doc) for doc in docs]

    async def verify_entry(self, entry_id: str) -> bool:
        """Mark a single entry as verified."""
        result = await self.collection.update_one(
            {"id": entry_id},
            {"$set": {"status": "verified"}},
        )
        return result.modified_count > 0

    async def delete_entry_by_uuid(self, entry_id: str) -> bool:
        """Delete a single entry by its UUID (the 'id' field)."""
        result = await self.collection.delete_one({"id": entry_id})
        return result.deleted_count > 0


# Global Singleton for DI
dictionary_repo = DictionaryRepository(collection=get_dictionary_collection())


if __name__ == "__main__":
    import asyncio
    import json
    import sys

    async def main() -> None:
        print("=== Dictionary Repo — DI Round-Trip Test ===\n")

        test_entry = CLLDEntry(
            id="test-di-roundtrip-001",
            word="Kopio",
            pos="noun",
            translation_malay="Kopi",
            translation_english="Coffee",
            source_audio_url="https://storage.example.com/recordings/test.mp3",
            audio_timestamp_start=1.5,
            audio_timestamp_end=3.0,
            status="pending_verification",
        )

        try:
            # Use singleton
            doc_id: str = await dictionary_repo.save_entry(test_entry)
            print(f"Saved entry → _id: {doc_id}")

            # Fetch (should be pending)
            all_entries: list[CLLDEntry] = await dictionary_repo.get_all()
            print(f"All entries in DB: {len(all_entries)}")

            # Verify
            verified: bool = await dictionary_repo.verify_entry("test-di-roundtrip-001")
            print(f"Verified: {verified}")

            # Fetch verified
            verified_entries: list[CLLDEntry] = await dictionary_repo.get_verified()
            print(f"Verified entries: {len(verified_entries)}")
            for e in verified_entries:
                if e.id == "test-di-roundtrip-001":
                    print(json.dumps(e.model_dump(), indent=2, ensure_ascii=False))

            # Cleanup
            await dictionary_repo.delete_entry_by_uuid("test-di-roundtrip-001")
            print("\nCleanup: removed test entry")

        except PyMongoError as exc:
            traceback.print_exc()
            print(f"\nDB ERROR: {exc}")
        except Exception as exc:
            traceback.print_exc()
            print(f"\nERROR: {exc}")

    if sys.platform.startswith("win") and sys.version_info < (3, 14):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
