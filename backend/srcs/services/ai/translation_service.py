"""Translation Service — RAG-based translation using a verified CLLD dictionary.

The LLM is instructed to translate using *only* words present in the
verified dictionary.  Any word not in the dictionary is left untranslated
and flagged.
"""

import json
import traceback

from langchain_core.messages import HumanMessage, SystemMessage

from srcs.services.ai.ai_dtos import CLLDEntry, TranslationRequest, TranslationResponse
from srcs.services.ai.rotating_llm import RotatingLLM, LLMResponse


def _build_system_prompt(request: TranslationRequest) -> str:
    """Build a system prompt that injects the dictionary as context."""

    dict_json: str = json.dumps(
        [
            {
                "word": e.word,
                "pos": e.pos,
                "translation_malay": e.translation_malay,
                "translation_english": e.translation_english,
            }
            for e in request.dictionary
        ],
        ensure_ascii=False,
    )

    return (
        f"You are a translation assistant for Borneo indigenous languages.\n\n"
        f"Translate from **{request.source_lang}** to **{request.target_lang}**.\n\n"
        f"STRICTLY use ONLY the following verified vocabulary:\n{dict_json}\n\n"
        f"Rules:\n"
        f"- Never invent or hallucinate words outside this list.\n"
        f"- If a word has no match in the dictionary, keep it in the source language and note it.\n"
        f"- Return ONLY valid JSON (no markdown fences) matching:\n"
        f'{{"translated_text": "<result>", "words_used_from_dict": ["<word1>", "<word2>"]}}'
    )


class TranslationService:
    """Translates text using a verified CLLD dictionary as context."""

    @staticmethod
    async def translate(
        llm: RotatingLLM,
        request: TranslationRequest,
    ) -> TranslationResponse:
        """Translate source text using dictionary-constrained RAG.

        Args:
            llm: RotatingLLM instance.
            request: Translation request with source text and dictionary.

        Returns:
            TranslationResponse with translated text and words used.

        Raises:
            RuntimeError: If the LLM fails to return parseable JSON.
        """
        messages = [
            SystemMessage(content=_build_system_prompt(request)),
            HumanMessage(content=f"Translate this: \"{request.source_text}\""),
        ]

        result: LLMResponse = await llm.send_message_get_json(messages)
        if result.json_data is None:
            raise RuntimeError(f"Failed to parse translation JSON: {result.text}")

        return TranslationResponse.model_validate(result.json_data)


if __name__ == "__main__":
    import asyncio
    import sys

    from srcs.services.ai import dictionary_repo
    from srcs.services.ai.rotating_llm import rotating_llm

    async def main() -> None:
        print("=== Translation Service ===\n")

        dictionary: list[CLLDEntry] = await dictionary_repo.get_verified()
        if not dictionary:
            print("ERROR: No verified entries in DB. Run mock_clld_data first to seed.")
            return

        print(f"Loaded {len(dictionary)} verified entries from DB.\n")

        request = TranslationRequest(
            source_text="I want to eat at the house in the village",
            source_lang="English",
            target_lang="Kadazan",
            dictionary=dictionary,
        )

        try:
            response: TranslationResponse = await TranslationService.translate(
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

