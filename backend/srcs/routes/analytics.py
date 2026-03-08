from fastapi import APIRouter

from database import get_recordings_collection

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/language-usage")
async def get_language_usage():
    """
    Return recording counts grouped by language.

    MongoDB aggregation: group recordings by language, count, return stats.
    """
    collection = get_recordings_collection()
    pipeline = [
        {"$group": {"_id": "$language", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    cursor = collection.aggregate(pipeline)
    results = await cursor.to_list(length=100)

    # Convert to { "iban": 12, "dusun": 7, ... }
    stats: dict[str, int] = {}
    for r in results:
        lang = r.get("_id") or "unknown"
        stats[str(lang)] = r.get("count", 0)

    return stats
