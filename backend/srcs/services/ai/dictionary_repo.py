"""Dictionary Repository — async CRUD for CLLD entries in MongoDB.

Thin layer over the ``dictionary`` collection.  Used by AI services
to persist drafted entries and retrieve verified vocabulary.
"""

import traceback

from pymongo.errors import PyMongoError

from database import get_dictionary_collection
from srcs.services.ai.ai_dtos import CLLDEntry


async def save_entry(entry: CLLDEntry) -> str:
    """Upsert a single CLLDEntry into MongoDB.

    Uses ``word`` + ``language_id`` as the natural key so re-running
    elicitation for the same word updates rather than duplicates.

    Returns:
        The stringified ``_id`` of the upserted document.
    """
    collection = get_dictionary_collection()
    doc: dict = entry.model_dump()
    result = await collection.update_one(
        {"word": entry.word, "language_id": entry.language_id},
        {"$set": doc},
        upsert=True,
    )
    if result.upserted_id:
        return str(result.upserted_id)
    # Existing doc was updated — fetch its _id
    existing = await collection.find_one(
        {"word": entry.word, "language_id": entry.language_id},
        {"_id": 1},
    )
    return str(existing["_id"]) if existing else ""


async def save_entries(entries: list[CLLDEntry]) -> int:
    """Bulk-upsert a list of CLLDEntry objects.

    Returns:
        Number of entries processed.
    """
    for entry in entries:
        await save_entry(entry)
    return len(entries)


async def get_verified(language_id: str = "kadazan-demo") -> list[CLLDEntry]:
    """Fetch all verified CLLD entries for a language.

    Args:
        language_id: The language to filter by.

    Returns:
        List of verified CLLDEntry objects.
    """
    collection = get_dictionary_collection()
    cursor = collection.find({"language_id": language_id, "status": "verified"})
    docs: list[dict] = await cursor.to_list(length=500)
    return [CLLDEntry.model_validate(doc) for doc in docs]


async def get_all(language_id: str = "kadazan-demo") -> list[CLLDEntry]:
    """Fetch all CLLD entries for a language (any status).

    Args:
        language_id: The language to filter by.

    Returns:
        List of all CLLDEntry objects.
    """
    collection = get_dictionary_collection()
    cursor = collection.find({"language_id": language_id})
    docs: list[dict] = await cursor.to_list(length=500)
    return [CLLDEntry.model_validate(doc) for doc in docs]


async def verify_entry(entry_id: str) -> bool:
    """Mark a single entry as verified.

    Args:
        entry_id: The ``id`` field of the CLLDEntry (not MongoDB ``_id``).

    Returns:
        True if an entry was updated, False otherwise.
    """
    collection = get_dictionary_collection()
    result = await collection.update_one(
        {"id": entry_id},
        {"$set": {"status": "verified"}},
    )
    return result.modified_count > 0


async def delete_entry_by_uuid(entry_id: str) -> bool:
    """Delete a single entry by its UUID (the 'id' field).

    Args:
        entry_id: The UUID ``id`` field of the CLLDEntry.

    Returns:
        True if an entry was deleted, False otherwise.
    """
    collection = get_dictionary_collection()
    result = await collection.delete_one({"id": entry_id})
    return result.deleted_count > 0


if __name__ == "__main__":
    import asyncio
    import json
    import sys

    async def main() -> None:
        print("=== Dictionary Repo — Round-Trip Test ===\n")

        test_entry = CLLDEntry(
            id="test-roundtrip-001",
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
            # Save
            doc_id: str = await save_entry(test_entry)
            print(f"Saved entry → _id: {doc_id}")

            # Fetch (should be pending)
            all_entries: list[CLLDEntry] = await get_all()
            print(f"All entries in DB: {len(all_entries)}")

            # Verify
            verified: bool = await verify_entry("test-roundtrip-001")
            print(f"Verified: {verified}")

            # Fetch verified
            verified_entries: list[CLLDEntry] = await get_verified()
            print(f"Verified entries: {len(verified_entries)}")
            for e in verified_entries:
                if e.id == "test-roundtrip-001":
                    print(json.dumps(e.model_dump(), indent=2, ensure_ascii=False))

            # Cleanup
            collection = get_dictionary_collection()
            await collection.delete_one({"id": "test-roundtrip-001"})
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
