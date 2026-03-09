"""Translation Service — RAG-based translation using a verified CLLD dictionary.

The LLM is instructed to translate using *only* words present in the
verified dictionary.
"""

import json
import traceback

from langchain_core.messages import HumanMessage, SystemMessage

from srcs.services.ai.ai_dtos import CLLDEntry, TranslationRequest, TranslationResponse
from srcs.services.ai.rotating_llm import RotatingLLM, LLMResponse, rotating_llm
from srcs.services.ai.dictionary_repo import DictionaryRepository, dictionary_repo

__all__ = ["TranslationService", "translation_service"]


class TranslationService:
    """Translates text using a verified CLLD dictionary as context via Dependency Injection."""

    def __init__(self, llm: RotatingLLM, repo: DictionaryRepository):
        self.llm = llm
        self.repo = repo

    def _build_system_prompt(self, request: TranslationRequest) -> str:
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

    async def translate(
        self,
        request: TranslationRequest,
    ) -> TranslationResponse:
        """Translate source text using dictionary-constrained RAG."""
        messages = [
            SystemMessage(content=self._build_system_prompt(request)),
            HumanMessage(content=f"Translate this: \"{request.source_text}\""),
        ]

        result: LLMResponse = await self.llm.send_message_get_json(messages)
        if result.json_data is None:
            raise RuntimeError(f"Failed to parse translation JSON: {result.text}")

        return TranslationResponse.model_validate(result.json_data)

    async def translate_with_db(
        self,
        source_text: str,
        source_lang: str,
        target_lang: str,
        language_id: str = "kadazan-demo",
    ) -> TranslationResponse:
        """Convenience method: fetches verified dictionary from repo before translating."""
        dictionary = await self.repo.get_verified(language_id)
        request = TranslationRequest(
            source_text=source_text,
            source_lang=source_lang,
            target_lang=target_lang,
            dictionary=dictionary,
        )
        return await self.translate(request)


# Global Singleton for DI
translation_service = TranslationService(llm=rotating_llm, repo=dictionary_repo)


if __name__ == "__main__":
    import asyncio
    import sys

    async def main() -> None:
        print("=== Translation Service — DI Test ===\n")

        try:
            # Use singleton convenience method
            response: TranslationResponse = await translation_service.translate_with_db(
                source_text="I want to eat at the house in the village",
                source_lang="English",
                target_lang="Kadazan",
            )
            print(json.dumps(response.model_dump(), indent=2, ensure_ascii=False))
        except Exception as exc:
            traceback.print_exc()
            print(f"\nERROR: {exc}")

    if sys.platform.startswith("win") and sys.version_info < (3, 14):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
