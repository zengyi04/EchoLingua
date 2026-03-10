"""Story Service — generates bilingual children's storybooks.

Combines parallel indigenous-Malay text and grammar rules into a structured
multipage story via LLM.
"""

import json
import traceback
from datetime import datetime
from bson import ObjectId

from langchain_core.messages import HumanMessage, SystemMessage

from database import get_stories_collection
from srcs.services.ai.ai_dtos import AnnotatedParallelText, StoryGenerateRequest, StoryGenerateResponse
from srcs.services.ai.rotating_llm import RotatingLLM, LLMResponse, rotating_llm

__all__ = ["StoryService", "story_service"]

# ---------------------------------------------------------------------------
# System prompt for story generation
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT: str = """\
You are a children's book author specialising in Borneo indigenous stories.

Your task:
1. Take a list of parallel sentences (indigenous origin + Malay translation).
2. Expand them into a bilingual (Indigenous/English) children's storybook.
3. Ensure the grammar follows the provided rules.
4. For each page, provide a vivid image-generation prompt for an illustrator.

Return ONLY valid JSON matching this schema (no markdown fences):
{
  "title": "<Story Title>",
  "pages": [
    {
      "page_number": 1,
      "indigenous_text": "<text>",
      "english_translation": "<translation>",
      "image_generation_prompt": "<vivid detailed description>"
    }
  ]
}
"""


class StoryService:
    """Generates bilingual stories using Dependency Injection."""

    def __init__(self, llm: RotatingLLM):
        self.llm = llm

    async def generate_book(
        self,
        request: StoryGenerateRequest,
    ) -> StoryGenerateResponse:
        """Create a bilingual storybook with image prompts from parallel text."""
        human_text: str = (
            "Based on these parallel texts and grammar rules, generate a 3-page story.\n\n"
            f"Parallel Text: {json.dumps([p.model_dump() for p in request.annotated_text], ensure_ascii=False)}\n"
            f"Grammar Rules: {request.grammar_rules}\n\n"
            "Produce the story title and pages."
        )

        messages = [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=human_text),
        ]

        result: LLMResponse = await self.llm.send_message_get_json(messages)
        response = StoryGenerateResponse.model_validate(result.json_data)
        response.language = request.language
        return response

    async def save_to_db(
        self,
        story_data: StoryGenerateResponse,
        user_id: str,
    ) -> str:
        """Persist a generated story to the core 'stories' collection."""
        collection = get_stories_collection()
        
        # Map AI-specific fields to the core story schema
        # We store the rich 'pages' in a new field, but keep 'text' for compatibility
        summary_text = "\n\n".join([f"Page {p.page_number}: {p.indigenous_text}" for p in story_data.pages])
        
        doc = {
            "title": story_data.title,
            "language": story_data.language or "Unknown",
            "text": summary_text,
            "pages": [p.model_dump() for p in story_data.pages],
            "createdBy": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
            "tags": ["ai-generated"],
            "createdAt": datetime.utcnow(),
        }
        
        result = await collection.insert_one(doc)
        return str(result.inserted_id)


# Global Singleton for DI
story_service = StoryService(llm=rotating_llm)


if __name__ == "__main__":
    import asyncio
    import sys

    async def main() -> None:
        print("=== Story Service — DI Test ===\n")

        request = StoryGenerateRequest(
            annotated_text=[
                AnnotatedParallelText(indigenous_text="Oku mogihon do walai", malay_translation="Saya makan di rumah"),
                AnnotatedParallelText(indigenous_text="Pogun diti pomoguon", malay_translation="Kampung ini cantik"),
            ],
            grammar_rules=[
                "Subject-Verb-Object word order",
                "Adjectives follow the noun",
            ],
        )

        try:
            # Use singleton
            response: StoryGenerateResponse = await story_service.generate_book(request)
            print(json.dumps(response.model_dump(), indent=2, ensure_ascii=False))
        except Exception as exc:
            traceback.print_exc()
            print(f"\nERROR: {exc}")

    if sys.platform.startswith("win") and sys.version_info < (3, 14):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
