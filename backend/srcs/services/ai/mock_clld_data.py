"""Mock CLLD dictionary data for smoke-testing AI services.

Contains ~12 Kadazan-Malay-English entries. The ``__main__`` block
seeds the MongoDB ``dictionary`` collection using DI.
"""

from srcs.services.ai.ai_dtos import CLLDEntry

__all__ = ["get_mock_dictionary"]


def get_mock_dictionary() -> list[CLLDEntry]:
    """Return a list of hardcoded, *verified* CLLD entries."""

    return [
        CLLDEntry(
            id="a1b2c3d4-0001",
            word="Mogihon",
            pos="verb",
            translation_malay="Makan",
            translation_english="Eat",
            source_audio_url="https://storage.example.com/recordings/mogihon.mp3",
            audio_timestamp_start=2.1,
            audio_timestamp_end=3.4,
            status="verified",
        ),
        CLLDEntry(
            id="a1b2c3d4-0002",
            word="Walai",
            pos="noun",
            translation_malay="Rumah",
            translation_english="House",
            source_audio_url="https://storage.example.com/recordings/walai.mp3",
            audio_timestamp_start=1.8,
            audio_timestamp_end=2.9,
            status="verified",
        ),
        CLLDEntry(
            id="a1b2c3d4-0003",
            word="Pogun",
            pos="noun",
            translation_malay="Kampung",
            translation_english="Village",
            source_audio_url="https://storage.example.com/recordings/pogun.mp3",
            audio_timestamp_start=2.0,
            audio_timestamp_end=3.1,
            status="verified",
        ),
        CLLDEntry(
            id="a1b2c3d4-0004",
            word="Tondou",
            pos="noun",
            translation_malay="Gunung",
            translation_english="Mountain",
            source_audio_url="https://storage.example.com/recordings/tondou.mp3",
            audio_timestamp_start=1.5,
            audio_timestamp_end=2.8,
            status="verified",
        ),
        CLLDEntry(
            id="a1b2c3d4-0005",
            word="Sungoi",
            pos="noun",
            translation_malay="Sungai",
            translation_english="River",
            source_audio_url="https://storage.example.com/recordings/sungoi.mp3",
            audio_timestamp_start=2.3,
            audio_timestamp_end=3.5,
            status="verified",
        ),
        CLLDEntry(
            id="a1b2c3d4-0006",
            word="Tompok",
            pos="noun",
            translation_malay="Pokok",
            translation_english="Tree",
            source_audio_url="https://storage.example.com/recordings/tompok.mp3",
            audio_timestamp_start=1.9,
            audio_timestamp_end=3.0,
            status="verified",
        ),
        CLLDEntry(
            id="a1b2c3d4-0007",
            word="Oku",
            pos="pronoun",
            translation_malay="Saya",
            translation_english="I",
            source_audio_url="https://storage.example.com/recordings/oku.mp3",
            audio_timestamp_start=2.0,
            audio_timestamp_end=2.5,
            status="verified",
        ),
        CLLDEntry(
            id="a1b2c3d4-0008",
            word="Iko",
            pos="pronoun",
            translation_malay="Kamu",
            translation_english="You",
            source_audio_url="https://storage.example.com/recordings/iko.mp3",
            audio_timestamp_start=2.0,
            audio_timestamp_end=2.6,
            status="verified",
        ),
        CLLDEntry(
            id="a1b2c3d4-0009",
            word="Pomoguon",
            pos="adjective",
            translation_malay="Cantik",
            translation_english="Beautiful",
            source_audio_url="https://storage.example.com/recordings/pomoguon.mp3",
            audio_timestamp_start=1.7,
            audio_timestamp_end=3.2,
            status="verified",
        ),
        CLLDEntry(
            id="a1b2c3d4-0010",
            word="Toos",
            pos="adjective",
            translation_malay="Besar",
            translation_english="Big",
            source_audio_url="https://storage.example.com/recordings/toos.mp3",
            audio_timestamp_start=2.0,
            audio_timestamp_end=2.7,
            status="verified",
        ),
        CLLDEntry(
            id="a1b2c3d4-0011",
            word="Nahu",
            pos="noun",
            translation_malay="Air",
            translation_english="Water",
            source_audio_url="https://storage.example.com/recordings/nahu.mp3",
            audio_timestamp_start=1.8,
            audio_timestamp_end=2.5,
            status="verified",
        ),
        CLLDEntry(
            id="a1b2c3d4-0012",
            word="Hinava",
            pos="noun",
            translation_malay="Hidangan ikan mentah",
            translation_english="Raw fish dish",
            cultural_note="Traditional Kadazan-Dusun delicacy made from fresh river fish cured in lime juice.",
            source_audio_url="https://storage.example.com/recordings/hinava.mp3",
            audio_timestamp_start=2.5,
            audio_timestamp_end=4.0,
            status="verified",
        ),
    ]


if __name__ == "__main__":
    import asyncio
    import sys
    import traceback

    from srcs.services.ai.dictionary_repo import dictionary_repo

    async def main() -> None:
        print("=== Mock CLLD Data — DI Seeding DB ===\n")
        entries: list[CLLDEntry] = get_mock_dictionary()

        try:
            # Use singleton
            count: int = await dictionary_repo.save_entries(entries)
            print(f"Seeded {count} verified entries into MongoDB.\n")

            # Verify by fetching back
            verified: list[CLLDEntry] = await dictionary_repo.get_verified()
            print(f"Verified entries now in DB: {len(verified)}")
            for e in verified:
                print(f"  - {e.word} ({e.pos}): {e.translation_english} | audio: {e.source_audio_url}")

            print("\nNOTE: These entries are persistent for downstream testing.")
            print("To clear them, run the dictionary_repo test or manually purge.")

        except Exception as exc:
            traceback.print_exc()
            print(f"\nERROR: {exc}")

    if sys.platform.startswith("win") and sys.version_info < (3, 14):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
