"""TTS Phoneme Bridge — converts indigenous text to IPA phonetic transcription.

Uses the CLLD dictionary as a pronunciation reference so the LLM can
produce consistent IPA output suitable for downstream voice-cloning tools.
"""

import json
import traceback

from langchain_core.messages import HumanMessage, SystemMessage

from srcs.services.ai.ai_dtos import CLLDEntry, TTSRequest, TTSResponse
from srcs.services.ai.rotating_llm import RotatingLLM, LLMResponse


def _build_system_prompt(dictionary: list[CLLDEntry]) -> str:
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


class TTSService:
    """Converts indigenous text to IPA phonemes for voice cloning pipelines."""

    @staticmethod
    async def to_phonemes(
        llm: RotatingLLM,
        request: TTSRequest,
    ) -> TTSResponse:
        """Convert indigenous text to IPA phonetic transcription.

        Args:
            llm: RotatingLLM instance.
            request: Indigenous text and dictionary context.

        Returns:
            TTSResponse with IPA phonemes and pronunciation guide.

        Raises:
            RuntimeError: If the LLM fails to return parseable JSON.
        """
        messages = [
            SystemMessage(content=_build_system_prompt(request.dictionary)),
            HumanMessage(content=f"Convert this indigenous text to IPA phonemes:\n\"{request.indigenous_text}\""),
        ]

        result: LLMResponse = await llm.send_message_get_json(messages)
        if result.json_data is None:
            raise RuntimeError(f"Failed to parse TTS JSON: {result.text}")

        return TTSResponse.model_validate(result.json_data)


if __name__ == "__main__":
    import asyncio
    import sys

    from srcs.services.ai import dictionary_repo
    from srcs.services.ai.rotating_llm import rotating_llm

    async def main() -> None:
        print("=== TTS Phoneme Bridge ===\n")

        dictionary: list[CLLDEntry] = await dictionary_repo.get_verified()
        if not dictionary:
            print("ERROR: No verified entries in DB. Run mock_clld_data first to seed.")
            return

        print(f"Loaded {len(dictionary)} verified entries from DB.\n")

        request = TTSRequest(
            indigenous_text="Oku mogihon do walai do pogun",
            dictionary=dictionary,
        )

        try:
            response: TTSResponse = await TTSService.to_phonemes(
                llm=rotating_llm,
                request=request,
            )
            print(json.dumps(response.model_dump(), indent=2, ensure_ascii=False))
        except Exception as exc:
            traceback.print_exc()
            print(f"\nERROR: {exc}")

    if sys.platform.startswith("win") and sys.version_info < (3, 14):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())

