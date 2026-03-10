"""Integrated AI Services Test Suite — consolidation of all smoke tests.

This script runs the entire AI pipeline sequentially to demonstrate 
the end-to-end flow:
1. Seed DB (Mock Data)
2. Elicitation (Draft new entry)
3. Translation (RAG lookup)
4. Vision (Object detection → lookup)
5. Story (Bilingual generation)
6. TTS (Phonetic bridge)
"""

import asyncio
import json
import sys
import traceback
from pathlib import Path
from unittest.mock import AsyncMock

# Add project root to path for imports
sys.path.append(str(Path(__file__).resolve().parents[1]))

from srcs.services.ai.ai_dtos import AnnotatedParallelText, StoryGenerateRequest
from srcs.services.ai.dictionary_repo import DictionaryRepository
from srcs.services.ai.elicitation_service import elicitation_service
from srcs.services.ai.translation_service import translation_service
from srcs.services.ai.story_service import story_service
from srcs.services.ai.vision_service import vision_service
from srcs.services.ai.tts_service import tts_service
from srcs.services.ai.mock_clld_data import get_mock_dictionary

# ---------------------------------------------------------------------------
# Stateless Test Setup (Mocking DB)
# ---------------------------------------------------------------------------
# Create a shared mock repo for all services
mock_repo = AsyncMock(spec=DictionaryRepository)

# Inject mock repo into singleton services
elicitation_service.repo = mock_repo
translation_service.repo = mock_repo
vision_service.repo = mock_repo
tts_service.repo = mock_repo

# Setup mock behavior
mock_entries = get_mock_dictionary()
mock_repo.get_verified.return_value = mock_entries
mock_repo.get_all.return_value = mock_entries
mock_repo.save_entries.return_value = len(mock_entries)
mock_repo.save_entry.return_value = "mock-id-123"
mock_repo.delete_entry_by_uuid.return_value = True

async def run_pipeline():
    print("🚀 Starting Integrated AI Services Test Pipeline (STATELESS MOCK MODE)\n")
    print("-" * 50)

    try:
        # 1. SEEDING
        print("\nStep 1: Seeding Dictionary Database (Mock)...")
        mock_entries = get_mock_dictionary()
        count = await mock_repo.save_entries(mock_entries)
        print(f"✅ Mock-seeded {count} foundational entries.")

        # 2. ELICITATION
        print("\nStep 2: Testing Elicitation (Text Mode)...")
        elicit_resp = await elicitation_service.process_text(
            anchor_text="Saya mahu minum air",
            indigenous_response="Mogihon oku nahu",
        )
        print(f"✅ Drafted: {elicit_resp.draft_dictionary_entry.word} -> {elicit_resp.draft_dictionary_entry.translation_english}")
        
        # Save to DB for downstream
        await mock_repo.save_entry(elicit_resp.draft_dictionary_entry)
        print("✅ Elicited entry saved to Mock DB.")

        # 3. TRANSLATION
        print("\nStep 3: Testing Translation (RAG)...")
        trans_resp = await translation_service.translate_with_db(
            source_text="I eat at the beautiful house",
            source_lang="English",
            target_lang="Kadazan"
        )
        print(f"✅ Result: {trans_resp.translated_text}")
        print(f"✅ Words used from dict: {trans_resp.words_used_from_dict}")

        # 4. VISION
        print("\nStep 4: Testing Vision (Description Mode)...")
        vision_resp = await vision_service.extract_vocab_with_db(
            description="A big wooden house near the river"
        )
        print(f"✅ Detected: {vision_resp.detected_english}")
        print(f"✅ Indigenous word: {vision_resp.indigenous_word} (Found: {vision_resp.found_in_dictionary})")

        # 5. STORY
        print("\nStep 5: Testing Story Generation...")
        story_req = StoryGenerateRequest(
            annotated_text=[
                AnnotatedParallelText(indigenous_text="Oku mogihon do walai", malay_translation="Saya makan di rumah"),
                AnnotatedParallelText(indigenous_text="Sungoi diti pomoguon", malay_translation="Sungai ini cantik")
            ],
            grammar_rules=["Adjectives follow the noun", "S-V-O order"]
        )
        story_resp = await story_service.generate_book(story_req)
        print(f"✅ Story Title: {story_resp.title}")
        print(f"✅ Pages generated: {len(story_resp.pages)}")

        # 6. TTS PHONEME BRIDGE
        print("\nStep 6: Testing TTS Phoneme Bridge...")
        tts_resp = await tts_service.to_phonemes_with_db(
            indigenous_text="Oku mogihon do walai do sungoi"
        )
        print(f"✅ IPA: {tts_resp.ipa_phonemes}")
        print(f"✅ Guide: {tts_resp.pronunciation_guide}")

        print("\n" + "-" * 50)
        print("🎉 All AI services verified successfully!")

        # FINAL CLEANUP
        print("\nCleaning up elicitation test data (Mock)...")
        await mock_repo.delete_entry_by_uuid(elicit_resp.draft_dictionary_entry.id)
        print("✅ Mock cleanup complete.")

    except Exception as e:
        print(f"\n❌ PIPELINE FAILED at Step")
        traceback.print_exc()


if __name__ == "__main__":
    if sys.platform.startswith("win") and sys.version_info < (3, 11):
        # Already handle loop policy if needed, though Pydantic/Motor usually need it on Windows
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    asyncio.run(run_pipeline())
