"""TTS Phoneme Bridge — converts indigenous text to IPA phonetic transcription.

Uses the CLLD dictionary as a pronunciation reference.
"""

import json
import traceback

from langchain_core.messages import HumanMessage, SystemMessage

from srcs.services.ai.ai_dtos import CLLDEntry, TTSRequest, TTSResponse
from srcs.services.ai.rotating_llm import RotatingLLM, LLMResponse, rotating_llm
from srcs.services.ai.dictionary_repo import DictionaryRepository, dictionary_repo
import io
from gtts import gTTS
from srcs.services.storage_service import upload_recording_from_bytes
from datetime import datetime

__all__ = ["TTSService", "tts_service"]


class TTSService:
    """Converts indigenous text to IPA phonemes using Dependency Injection."""

    def __init__(self, llm: RotatingLLM, repo: DictionaryRepository):
        self.llm = llm
        self.repo = repo

    def _build_system_prompt(self, dictionary: list[CLLDEntry]) -> str:
        """Build a system prompt with dictionary entries as pronunciation guides."""
        dict_json: str = json.dumps(
            [
                {
                    "word": e.word,
                    "translation_english": e.translation_english,
                    "translation_malay": e.translation_malay,
                }
                for e in dictionary
            ],
            ensure_ascii=False,
        )

        return (
            "You are a phonetics expert specialising in Southeast Asian indigenous languages.\n\n"
            "Your task: convert the given indigenous text into IPA (International Phonetic Alphabet) "
            "transcription following standard Borneo vowel and consonant conventions.\n\n"
            "Use this dictionary as a pronunciation reference:\n"
            f"{dict_json}\n\n"
            "Conventions:\n"
            "- Use standard IPA symbols.\n"
            "- Southeast Asian vowel rules: 'a' = /a/, 'i' = /i/, 'o' = /o/, 'u' = /u/, 'e' = /ə/.\n"
            "- Stress typically falls on the penultimate syllable.\n"
            "- Provide a human-readable pronunciation guide alongside the IPA.\n\n"
            "Return ONLY valid JSON (no markdown fences) matching:\n"
            '{"ipa_phonemes": "<IPA transcription>", "pronunciation_guide": "<human-readable guide>"}'
        )

    async def to_phonemes(
        self,
        request: TTSRequest,
    ) -> TTSResponse:
        """Convert indigenous text to IPA phonetic transcription."""
        messages = [
            SystemMessage(content=self._build_system_prompt(request.dictionary)),
            HumanMessage(content=f"Convert this indigenous text to IPA phonemes:\n\"{request.indigenous_text}\""),
        ]

        result: LLMResponse = await self.llm.send_message_get_json(messages)
        if result.json_data is None:
            raise RuntimeError(f"Failed to parse TTS JSON: {result.text}")

        return TTSResponse.model_validate(result.json_data)

    async def to_phonemes_with_db(
        self,
        indigenous_text: str,
        language_id: str,
    ) -> TTSResponse:
        """Convenience method: fetches verified dictionary from repo before converting to phonemes."""
        dictionary = await self.repo.get_verified(language_id)
        request = TTSRequest(
            indigenous_text=indigenous_text,
            dictionary=dictionary,
        )
        return await self.to_phonemes(request)

    async def to_audio_with_db(
        self,
        indigenous_text: str,
        language_id: str,
    ) -> TTSResponse:
        """Full pipeline: Text -> Phonics -> gTTS Audio (Free)."""
        # 1. Get IPA & Pronunciation Guide (Phonics)
        response = await self.to_phonemes_with_db(indigenous_text, language_id)

        # 2. Synthesize Audio via gTTS (Free)
        try:

            # We use the 'pronunciation_guide' (phonetic spelling) 
            # instead of original text to ensure 'ms' engine speaks it correctly.
            tts = gTTS(text=response.pronunciation_guide, lang='ms')
            
            # Save to buffer
            mp3_fp = io.BytesIO()
            tts.write_to_fp(mp3_fp)
            audio_bytes = mp3_fp.getvalue()

            # 3. Upload to Supabase
            file_name = f"tts_{language_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.mp3"
            audio_url = upload_recording_from_bytes(audio_bytes, file_name)
            
            response.audio_url = audio_url
            return response

        except Exception as e:
            traceback.print_exc()
            print(f"gTTS Synthesis Error: {e}")
            return response



# Global Singleton for DI
tts_service = TTSService(llm=rotating_llm, repo=dictionary_repo)


if __name__ == "__main__":
    import asyncio
    import sys
    from unittest.mock import MagicMock

    async def main() -> None:
        print("=== TTS Service Verification ===\n")

        # 1. Test Phoneme Bridge (LLM only, Mock DB)
        print("[Step 1] Verifying Phoneme Bridge...")
        mock_repo = MagicMock()
        async def mock_get_verified(lid): return []
        mock_repo.get_verified = mock_get_verified
        
        test_service = TTSService(llm=rotating_llm, repo=mock_repo)
        
        try:
            sample_text = "Oku mogihon do walai"
            response = await test_service.to_phonemes_with_db(sample_text, "test-lang")
            print(f"  Input: {sample_text}")
            print(f"  IPA: {response.ipa_phonemes}")
            print(f"  Guide: {response.pronunciation_guide}")
            
            # 2. Test Full Audio Synthesis
            print("\n[Step 2] Verifying Audio Synthesis...")
            # Note: This will attempt upload to Supabase if config is present
            audio_response = await test_service.to_audio_with_db(sample_text, "test-lang")
            print(f"  Audio URL: {audio_response.audio_url or 'Upload skipped/failed'}")
            
            # 3. Save local test.mp3 using the same logic for immediate hearing
            print("\n[Step 3] Saving local 'test.mp3' for verification...")
            tts = gTTS(text=audio_response.pronunciation_guide, lang='ms')
            tts.save("test.mp3")
            print("  [SUCCESS] Check 'test.mp3' in the root directory.")

        except Exception as exc:
            traceback.print_exc()
            print(f"\nERROR during verification: {exc}")

    if sys.platform.startswith("win") and sys.version_info < (3, 14):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())


