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
    """Input for translation: source text + verified dictionary."""

    source_text: str
    source_lang: str
    target_lang: str
    dictionary: list[CLLDEntry] = Field(
        ...,
        description="Verified CLLD dictionary injected from the DB",
    )


class TranslationResponse(BaseModel):
    """Translation result."""

    translated_text: str
    words_used_from_dict: list[str]


# ---------------------------------------------------------------------------
# Vision DTOs
# ---------------------------------------------------------------------------

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


class StoryGenerateRequest(BaseModel):
    """Input for story generation."""

    annotated_text: list[AnnotatedParallelText]
    grammar_rules: list[str]


class StoryGenerateResponse(BaseModel):
    """Generated bilingual storybook."""

    title: str
    pages: list[StoryPage]


# ---------------------------------------------------------------------------
# TTS / Phoneme DTOs
# ---------------------------------------------------------------------------

class TTSRequest(BaseModel):
    """Input for TTS phoneme bridge."""

    indigenous_text: str
    dictionary: list[CLLDEntry]


class TTSResponse(BaseModel):
    """Phoneme bridge result."""

    ipa_phonemes: str
    pronunciation_guide: str
