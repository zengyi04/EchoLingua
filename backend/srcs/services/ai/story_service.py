"""Story Service — generates bilingual children's storybooks.

Takes annotated parallel text (indigenous ↔ Malay) plus grammar rules
and produces a structured storybook with pages and image-generation prompts.
"""

import json
import traceback

from langchain_core.messages import HumanMessage, SystemMessage

from srcs.services.ai.ai_dtos import (
    AnnotatedParallelText,
    StoryGenerateRequest,
    StoryGenerateResponse,
    StoryPage,
)
from srcs.services.ai.rotating_llm import RotatingLLM, LLMResponse


_SYSTEM_PROMPT: str = """\
You are a children's book author specialising in bilingual indigenous-language storybooks for Borneo communities.

Given parallel text (indigenous ↔ Malay) and grammar rules, create a short illustrated children's story.

Rules:
- Use ONLY the provided indigenous vocabulary and grammar — never invent new words.
- Each page has: indigenous text, English translation, and a vivid image-generation prompt.
- Keep sentences short and child-friendly (ages 5-10).
- The story should teach cultural values or daily life themes.

Return ONLY valid JSON (no markdown fences) matching:
{
  "title": "<bilingual title>",
  "pages": [
    {
      "page_number": 1,
      "indigenous_text": "<text>",
      "english_translation": "<text>",
      "image_generation_prompt": "<vivid description for image AI>"
    }
  ]
}

Generate 3-5 pages.
"""


class StoryService:
    """Generates bilingual children's storybooks from parallel text."""

    @staticmethod
    async def generate_book(
        llm: RotatingLLM,
        request: StoryGenerateRequest,
    ) -> StoryGenerateResponse:
        """Generate a bilingual storybook.

        Args:
            llm: RotatingLLM instance.
            request: Parallel text and grammar rules.

        Returns:
            StoryGenerateResponse with title and pages.

        Raises:
            RuntimeError: If the LLM fails to return parseable JSON.
        """
        parallel_json: str = json.dumps(
            [t.model_dump() for t in request.annotated_text],
            ensure_ascii=False,
        )

        human_text: str = (
            f"Parallel text:\n{parallel_json}\n\n"
            f"Grammar rules:\n"
            + "\n".join(f"- {rule}" for rule in request.grammar_rules)
            + "\n\nGenerate a bilingual children's storybook."
        )

        messages = [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=human_text),
        ]

        result: LLMResponse = await llm.send_message_get_json(messages, temperature=0.4)
        if result.json_data is None:
            raise RuntimeError(f"Failed to parse story JSON: {result.text}")

        return StoryGenerateResponse.model_validate(result.json_data)


if __name__ == "__main__":
    import asyncio
    import sys

    from srcs.services.ai.rotating_llm import rotating_llm

    async def main() -> None:
        print("=== Story Service ===\n")

        request = StoryGenerateRequest(
            annotated_text=[
                AnnotatedParallelText(
                    indigenous_text="Oku mogihon do walai.",
                    malay_translation="Saya makan di rumah.",
                ),
                AnnotatedParallelText(
                    indigenous_text="Tompok do pogun pomoguon.",
                    malay_translation="Pokok di kampung cantik.",
                ),
                AnnotatedParallelText(
                    indigenous_text="Nahu do sungoi toos.",
                    malay_translation="Air di sungai besar.",
                ),
            ],
            grammar_rules=[
                "'do' is a locative preposition meaning 'at/in'",
                "Adjectives follow the noun they modify",
                "Subject typically comes before the verb",
            ],
        )

        try:
            response: StoryGenerateResponse = await StoryService.generate_book(
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
