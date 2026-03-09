"""Elicitation Service — drafts CLLD dictionary entries from audio or text.

Supports two modes:
- ``process_audio``: sends base64-encoded audio as a multimodal HumanMessage
- ``process_text``:  text-only fallback when no audio is available
"""

import base64
import json
import traceback
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage

from srcs.services.ai.ai_dtos import CLLDEntry, ElicitationResponse
from srcs.services.ai.rotating_llm import RotatingLLM, LLMResponse, rotating_llm
from srcs.services.ai.dictionary_repo import DictionaryRepository, dictionary_repo

__all__ = ["ElicitationService", "elicitation_service"]

# ---------------------------------------------------------------------------
# System prompt shared by both audio and text paths
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT: str = """\
You are a linguistic fieldwork assistant specialising in Borneo indigenous languages.

Your task:
1. Identify the anchor phrase (the known-language prompt, usually Malay or English).
2. Analyse the indigenous response.
3. Draft a CLLD-standard dictionary entry predicting the meaning and phonetic spelling.
4. If processing audio, identify the exact timestamps (in seconds) where the indigenous response starts and ends.

Return ONLY valid JSON matching this schema (no markdown fences):
{
  "anchor_language": "<Malay|English>",
  "anchor_text": "<transcribed anchor phrase>",
  "draft_dictionary_entry": {
    "id": "<generate-a-uuid>",
    "language_id": "kadazan-demo",
    "word": "<phonetic indigenous word>",
    "pos": "<part of speech>",
    "translation_malay": "<Malay meaning>",
    "translation_english": "<English meaning>",
    "cultural_note": null,
    "source_audio_url": null,
    "audio_timestamp_start": 0.0,
    "audio_timestamp_end": 0.0,
    "status": "pending_verification"
  }
}
"""


class ElicitationService:
    """Drafts CLLD dictionary entries from elicitation sessions using Dependency Injection."""

    def __init__(self, llm: RotatingLLM, repo: DictionaryRepository):
        self.llm = llm
        self.repo = repo

    async def process_audio(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/mp3",
        source_audio_url: str | None = None,
    ) -> ElicitationResponse:
        """Process an audio recording containing a Malay anchor + indigenous response."""
        b64_audio: str = base64.b64encode(audio_bytes).decode("utf-8")

        messages = [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=[
                {"type": "text", "text": "Process this elicitation audio. Identify the anchor phrase, note the exact timestamps of the indigenous response, and draft a dictionary entry."},
                {"type": "media", "mime_type": mime_type, "data": b64_audio},
            ]),
        ]

        result: LLMResponse = await self.llm.send_message_get_json(messages)
        if result.json_data is None:
            raise RuntimeError(f"Failed to parse elicitation JSON: {result.text}")

        response: ElicitationResponse = ElicitationResponse.model_validate(result.json_data)
        if source_audio_url:
            response.draft_dictionary_entry.source_audio_url = source_audio_url
        return response

    async def process_text(
        self,
        anchor_text: str,
        indigenous_response: str,
    ) -> ElicitationResponse:
        """Text-only fallback — draft a CLLD entry without audio."""
        human_text: str = (
            f"Anchor phrase (Malay): \"{anchor_text}\"\n"
            f"Indigenous response: \"{indigenous_response}\"\n\n"
            "Draft a CLLD dictionary entry for the indigenous response."
        )

        messages = [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=human_text),
        ]

        result: LLMResponse = await self.llm.send_message_get_json(messages)
        if result.json_data is None:
            raise RuntimeError(f"Failed to parse elicitation JSON: {result.text}")

        return ElicitationResponse.model_validate(result.json_data)


# Global Singleton for DI
elicitation_service = ElicitationService(llm=rotating_llm, repo=dictionary_repo)

# ---------------------------------------------------------------------------
# Test audio file path (relative to project/backend/)
# ---------------------------------------------------------------------------
_TEST_AUDIO_PATH: Path = Path(__file__).resolve().parents[2] / "tests" / "test_elicitation.mp3"


if __name__ == "__main__":
    import asyncio
    import sys

    async def _test_audio_mode() -> ElicitationResponse:
        """Test with a real audio file."""
        print(f"Found test audio: {_TEST_AUDIO_PATH}\n")
        audio_bytes: bytes = _TEST_AUDIO_PATH.read_bytes()
        return await elicitation_service.process_audio(
            audio_bytes=audio_bytes,
            mime_type="audio/mp3",
            source_audio_url=f"file://{_TEST_AUDIO_PATH}",
        )

    async def _test_text_mode() -> ElicitationResponse:
        """Fallback to text mode."""
        print("No test audio found. Falling back to text mode.\n")
        return await elicitation_service.process_text(
            anchor_text="Saya mahu makan",
            indigenous_response="Mogihon oku mokan",
        )

    async def main() -> None:
        print("=== Elicitation Service — DI Test ===\n")

        try:
            if _TEST_AUDIO_PATH.exists():
                response = await _test_audio_mode()
            else:
                response = await _test_text_mode()

            print(json.dumps(response.model_dump(), indent=2, ensure_ascii=False))

            # Save drafted entry to DB via repo
            doc_id: str = await elicitation_service.repo.save_entry(response.draft_dictionary_entry)
            print(f"\nSaved to DB → _id: {doc_id}")

            # Cleanup
            await elicitation_service.repo.delete_entry_by_uuid(response.draft_dictionary_entry.id)
            print(f"Cleanup: removed test entry {response.draft_dictionary_entry.id}")

        except Exception as exc:
            traceback.print_exc()
            print(f"\nERROR: {exc}")

    if sys.platform.startswith("win") and sys.version_info < (3, 14):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
