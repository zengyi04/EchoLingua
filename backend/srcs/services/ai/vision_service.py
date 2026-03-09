"""Vision Service — detects objects in images and looks up indigenous vocabulary.

Supports two modes:
- ``extract_vocab_from_image``:  multimodal image analysis
- ``extract_vocab_from_description``: text-only fallback
"""

import base64
import json
import traceback

from langchain_core.messages import HumanMessage, SystemMessage

from srcs.services.ai.ai_dtos import CLLDEntry, VisionResponse
from srcs.services.ai.rotating_llm import RotatingLLM, LLMResponse, rotating_llm
from srcs.services.ai.dictionary_repo import DictionaryRepository, dictionary_repo

__all__ = ["VisionService", "vision_service"]


class VisionService:
    """Detects objects and looks up indigenous vocabulary using Dependency Injection."""

    def __init__(self, llm: RotatingLLM, repo: DictionaryRepository):
        self.llm = llm
        self.repo = repo

    def _build_system_prompt(self, dictionary: list[CLLDEntry]) -> str:
        """Build a system prompt with the dictionary context."""
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
            "You are a visual vocabulary assistant for Borneo indigenous language learning.\n\n"
            "Your task:\n"
            "1. Identify the main object visible in the image (or described in text).\n"
            "2. Check if its English name appears in the verified dictionary below.\n"
            "3. If found, return the indigenous word. If not, set indigenous_word to null.\n\n"
            f"Verified dictionary:\n{dict_json}\n\n"
            "Return ONLY valid JSON (no markdown fences) matching:\n"
            '{"detected_english": "<object name>", "indigenous_word": "<word or null>", "found_in_dictionary": true|false}'
        )

    async def extract_vocab_from_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        dictionary: list[CLLDEntry],
    ) -> VisionResponse:
        """Detect an object in an image and look up its indigenous name."""
        b64_image: str = base64.b64encode(image_bytes).decode("utf-8")

        messages = [
            SystemMessage(content=self._build_system_prompt(dictionary)),
            HumanMessage(content=[
                {"type": "text", "text": "Identify the main object in this image and look up its indigenous word."},
                {"type": "image_url", "image_url": f"data:{mime_type};base64,{b64_image}"},
            ]),
        ]

        result: LLMResponse = await self.llm.send_message_get_json(messages)
        if result.json_data is None:
            raise RuntimeError(f"Failed to parse vision JSON: {result.text}")

        return VisionResponse.model_validate(result.json_data)

    async def extract_vocab_from_description(
        self,
        description: str,
        dictionary: list[CLLDEntry],
    ) -> VisionResponse:
        """Text-only fallback — detect object from a text description."""
        messages = [
            SystemMessage(content=self._build_system_prompt(dictionary)),
            HumanMessage(content=f"The user sees: \"{description}\"\n\nIdentify the main object and look up its indigenous word."),
        ]

        result: LLMResponse = await self.llm.send_message_get_json(messages)
        if result.json_data is None:
            raise RuntimeError(f"Failed to parse vision JSON: {result.text}")

        return VisionResponse.model_validate(result.json_data)

    async def extract_vocab_with_db(
        self,
        description: str | None = None,
        image_bytes: bytes | None = None,
        mime_type: str | None = None,
        language_id: str = "kadazan-demo",
    ) -> VisionResponse:
        """Convenience method: fetches verified dictionary from repo before performing vision task."""
        dictionary = await self.repo.get_verified(language_id)
        if image_bytes and mime_type:
            return await self.extract_vocab_from_image(image_bytes, mime_type, dictionary)
        elif description:
            return await self.extract_vocab_from_description(description, dictionary)
        else:
            raise ValueError("Either description or image_bytes+mime_type must be provided.")


# Global Singleton for DI
vision_service = VisionService(llm=rotating_llm, repo=dictionary_repo)


if __name__ == "__main__":
    import asyncio
    import sys

    async def main() -> None:
        print("=== Vision Service — DI Test ===\n")

        try:
            # Use singleton convenience method
            response: VisionResponse = await vision_service.extract_vocab_with_db(
                description="A wooden house in a small village surrounded by tall trees",
            )
            print(json.dumps(response.model_dump(), indent=2, ensure_ascii=False))
        except Exception as exc:
            traceback.print_exc()
            print(f"\nERROR: {exc}")

    if sys.platform.startswith("win") and sys.version_info < (3, 14):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
