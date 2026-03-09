"""Vision Service — detects objects in images and looks up indigenous vocabulary.

Supports two modes:
- ``extract_vocab_from_image``:  sends base64-encoded image as multimodal HumanMessage
- ``extract_vocab_from_description``: text-only fallback for testing without images
"""

import base64
import json
import traceback

from langchain_core.messages import HumanMessage, SystemMessage

from srcs.services.ai.ai_dtos import CLLDEntry, VisionResponse
from srcs.services.ai.rotating_llm import RotatingLLM, LLMResponse


def _build_system_prompt(dictionary: list[CLLDEntry]) -> str:
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


class VisionService:
    """Detects objects and looks up indigenous vocabulary."""

    @staticmethod
    async def extract_vocab_from_image(
        llm: RotatingLLM,
        image_bytes: bytes,
        mime_type: str,
        dictionary: list[CLLDEntry],
    ) -> VisionResponse:
        """Detect an object in an image and look up its indigenous name.

        Args:
            llm: RotatingLLM instance.
            image_bytes: Raw image file bytes.
            mime_type: MIME type (e.g. ``image/jpeg``, ``image/png``).
            dictionary: Verified CLLD dictionary.

        Returns:
            VisionResponse with detected object and optional indigenous word.

        Raises:
            RuntimeError: If the LLM fails to return parseable JSON.
        """
        b64_image: str = base64.b64encode(image_bytes).decode("utf-8")

        messages = [
            SystemMessage(content=_build_system_prompt(dictionary)),
            HumanMessage(content=[
                {"type": "text", "text": "Identify the main object in this image and look up its indigenous word."},
                {"type": "image_url", "image_url": f"data:{mime_type};base64,{b64_image}"},
            ]),
        ]

        result: LLMResponse = await llm.send_message_get_json(messages)
        if result.json_data is None:
            raise RuntimeError(f"Failed to parse vision JSON: {result.text}")

        return VisionResponse.model_validate(result.json_data)

    @staticmethod
    async def extract_vocab_from_description(
        llm: RotatingLLM,
        description: str,
        dictionary: list[CLLDEntry],
    ) -> VisionResponse:
        """Text-only fallback — detect object from a text description.

        Args:
            llm: RotatingLLM instance.
            description: Text description of what is visible (e.g. "a large tree").
            dictionary: Verified CLLD dictionary.

        Returns:
            VisionResponse with detected object and optional indigenous word.

        Raises:
            RuntimeError: If the LLM fails to return parseable JSON.
        """
        messages = [
            SystemMessage(content=_build_system_prompt(dictionary)),
            HumanMessage(content=f"The user sees: \"{description}\"\n\nIdentify the main object and look up its indigenous word."),
        ]

        result: LLMResponse = await llm.send_message_get_json(messages)
        if result.json_data is None:
            raise RuntimeError(f"Failed to parse vision JSON: {result.text}")

        return VisionResponse.model_validate(result.json_data)


if __name__ == "__main__":
    import asyncio
    import sys

    from srcs.services.ai import dictionary_repo
    from srcs.services.ai.rotating_llm import rotating_llm

    async def main() -> None:
        print("=== Vision Service — Text Description Mode ===\n")

        dictionary: list[CLLDEntry] = await dictionary_repo.get_verified()
        if not dictionary:
            print("ERROR: No verified entries in DB. Run mock_clld_data first to seed.")
            return

        print(f"Loaded {len(dictionary)} verified entries from DB.\n")

        try:
            response: VisionResponse = await VisionService.extract_vocab_from_description(
                llm=rotating_llm,
                description="A wooden house in a small village surrounded by tall trees",
                dictionary=dictionary,
            )
            print(json.dumps(response.model_dump(), indent=2, ensure_ascii=False))
        except Exception as exc:
            traceback.print_exc()
            print(f"\nERROR: {exc}")

    if sys.platform.startswith("win") and sys.version_info < (3, 14):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())

