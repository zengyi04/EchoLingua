"""Pydantic DTOs for all AI services (SIL CLLD standard)."""

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# SIL CLLD Standard Dictionary Entry
# ---------------------------------------------------------------------------

class CLLDEntry(BaseModel):
    """A single dictionary entry following the SIL CLLD standard."""

    id: str = Field(..., description="Unique ID (UUID)")
    language_id: str = Field(
        default="kadazan-demo",
        description="Target language identifier",
    )
    word: str = Field(..., description="The indigenous word (phonetic spelling)")
    pos: str = Field(..., description="Part of speech (noun, verb, greeting …)")
    translation_malay: str = Field(..., description="Malay translation")
    translation_english: str = Field(..., description="English translation")
    cultural_note: str | None = Field(
        None,
        description="Cultural context or usage notes",
    )
    source_audio_url: str | None = Field(
        None,
        description="URL of the source audio recording",
    )
    audio_timestamp_start: float = Field(
        default=0.0,
        description="Start time in source audio (seconds)",
    )
    audio_timestamp_end: float = Field(
        default=0.0,
        description="End time in source audio (seconds)",
    )
    status: str = Field(
        default="pending_verification",
        description="pending_verification | verified",
    )


# ---------------------------------------------------------------------------
# Elicitation DTOs
# ---------------------------------------------------------------------------

class ElicitationTextRequest(BaseModel):
    """Input for text-based elicitation."""

    anchor_text: str
    indigenous_response: str
    language_id: str | None = Field(None, description="Target language ID (e.g. kadazan-demo)")


class ElicitationResponse(BaseModel):
    """Result of processing an elicitation audio / text pair."""

    anchor_language: str = Field(..., description="Language of the prompt (Malay/English)")
    anchor_text: str = Field(..., description="The transcribed prompt")
    draft_dictionary_entry: CLLDEntry = Field(
        ...,
        description="The drafted SIL-standard entry",
    )


# ---------------------------------------------------------------------------
# Translation DTOs
# ---------------------------------------------------------------------------

class TranslationRequest(BaseModel):
    """Internal service parameters for translation."""
    source_text: str
    source_lang: str
    target_lang: str
    dictionary: list[CLLDEntry] = Field(
        ...,
        description="Verified CLLD dictionary injected from the DB",
    )


class TranslationAPIRequest(BaseModel):
    """API input for translation."""
    source_text: str
    source_lang: str
    target_lang: str
    language_id: str = Field(
        default="kadazan-demo",
        description="Dictionary ID to use for RAG context",
    )


class TranslationResponse(BaseModel):
    """Translation result."""

    translated_text: str
    words_used_from_dict: list[str]


# ---------------------------------------------------------------------------
# Vision DTOs
# ---------------------------------------------------------------------------

class VisionRequest(BaseModel):
    """Internal service parameters for vision-to-vocab lookup."""
    description: str | None = None
    image_bytes: bytes | None = None
    mime_type: str | None = None
    dictionary: list[CLLDEntry]


class VisionAPIRequest(BaseModel):
    """API input for vision-to-vocab lookup (text only)."""
    description: str
    language_id: str = Field(
        default="kadazan-demo",
        description="Dictionary ID to use for lookup",
    )


class VisionResponse(BaseModel):
    """Result of vision-to-vocab lookup."""

    detected_english: str
    indigenous_word: str | None
    found_in_dictionary: bool


# ---------------------------------------------------------------------------
# Story DTOs
# ---------------------------------------------------------------------------

class AnnotatedParallelText(BaseModel):
    """A single indigenous ↔ Malay sentence pair."""

    indigenous_text: str
    malay_translation: str


class StoryPage(BaseModel):
    """One page of a bilingual children's storybook."""

    page_number: int
    indigenous_text: str
    english_translation: str
    image_generation_prompt: str
    image_url: str | None = Field(None, description="URL of the generated/stored image for this page")


class StoryGenerateRequest(BaseModel):
    """Input for story generation."""

    annotated_text: list[AnnotatedParallelText]
    grammar_rules: list[str]
    language: str = Field(default="Kadazan", description="Target language name")


class StoryGenerateResponse(BaseModel):
    """Generated bilingual storybook."""

    title: str
    pages: list[StoryPage]
    language: str | None = None
    createdBy: str | None = None


# ---------------------------------------------------------------------------
# TTS / Phoneme DTOs
# ---------------------------------------------------------------------------

class TTSRequest(BaseModel):
    """Internal service parameters for TTS phoneme bridge."""
    indigenous_text: str
    dictionary: list[CLLDEntry]


class TTSAPIRequest(BaseModel):
    """API input for TTS phoneme bridge."""
    indigenous_text: str
    language_id: str = Field(
        default="kadazan-demo",
        description="Dictionary ID to use for pronunciation reference",
    )


class TTSResponse(BaseModel):
    """Phoneme bridge result + Synthesized audio URL."""

    ipa_phonemes: str
    pronunciation_guide: str
    audio_url: str | None = Field(None, description="URL of the synthesized audio file")


# ---------------------------------------------------------------------------
# General Chat
# ---------------------------------------------------------------------------

class ChatHistoryMessage(BaseModel):
    role: str  # user | assistant | system
    text: str


class ChatAPIRequest(BaseModel):
    message: str
    system_context: str | None = None
    target_language: str | None = None
    mode: str | None = None
    history: list["ChatHistoryMessage"] = []


class ChatResponse(BaseModel):
    ai_reply: str
    model: str | None = None


# ---------------------------------------------------------------------------
# Voice Transcription
# ---------------------------------------------------------------------------

class TranscribeAPIRequest(BaseModel):
    base64_audio: str
    mime_type: str = "audio/mp4"
    target_language: str | None = None


class TranscribeResponse(BaseModel):
    transcribed_text: str

