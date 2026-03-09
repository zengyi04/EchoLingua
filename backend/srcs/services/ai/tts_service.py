"""TTS Phoneme Bridge — converts indigenous text to IPA phonetic transcription.

Uses the CLLD dictionary as a pronunciation reference.
"""

import json
import traceback

from langchain_core.messages import HumanMessage, SystemMessage

from srcs.services.ai.ai_dtos import CLLDEntry, TTSRequest, TTSResponse
from srcs.services.ai.rotating_llm import RotatingLLM, LLMResponse, rotating_llm
from srcs.services.ai.dictionary_repo import DictionaryRepository, dictionary_repo

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
        language_id: str = "kadazan-demo",
    ) -> TTSResponse:
        """Convenience method: fetches verified dictionary from repo before converting to phonemes."""
        dictionary = await self.repo.get_verified(language_id)
        request = TTSRequest(
            indigenous_text=indigenous_text,
            dictionary=dictionary,
        )
        return await self.to_phonemes(request)


# Global Singleton for DI
tts_service = TTSService(llm=rotating_llm, repo=dictionary_repo)


if __name__ == "__main__":
    import asyncio
    import sys

    async def main() -> None:
        print("=== TTS Phoneme Bridge — DI Test ===\n")

        try:
            # Use singleton convenience method
            response: TTSResponse = await tts_service.to_phonemes_with_db(
                indigenous_text="Oku mogihon do walai do pogun",
            )
            print(json.dumps(response.model_dump(), indent=2, ensure_ascii=False))
        except Exception as exc:
            traceback.print_exc()
            print(f"\nERROR: {exc}")

    if sys.platform.startswith("win") and sys.version_info < (3, 14):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
