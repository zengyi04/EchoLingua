# BorneoEchoLingua: AI API Documentation

This document specifies the endpoints for the AI language preservation lifecycle (Elicit -> Verify -> Consume).

## Base Path: `/ai`
**Authentication**: All endpoints require a valid `Bearer` token in the `Authorization` header.

---

## 1. Phase 1: Elicitation (Ingestion)

### `POST /ai/elicit/text`
Drafts a dictionary entry from a text-based elicitation response.
- **Request Body**: `ElicitationTextRequest`
  ```json
  { "anchor_text": "water", "indigenous_response": "waig" }
  ```
- **Response**: `ElicitationResponse` containing a drafted `CLLDEntry` with `status: "pending_verification"`.

### `POST /ai/elicit/audio`
Drafts a dictionary entry from an audio recording.
- **Request**: `multipart/form-data` with a `file` field.
- **Response**: `ElicitationResponse` containing a drafted `CLLDEntry` with identified timestamps.

---

## 2. Phase 2: Verification (Management)

### `GET /ai/dictionary`
List dictionary entries for review.
- **Query Params**:
  - `status`: `pending_verification` | `verified` (Optional)
  - `language_id`: Defaults to `kadazan-demo`.
- **Response**: `list[CLLDEntry]`

### `POST /ai/dictionary/{entry_id}/verify`
Marks a specific entry as verified.
- **Response**: `{"message": "Entry verified successfully"}`

### `DELETE /ai/dictionary/{entry_id}`
Rejects and deletes a drafted entry.
- **Response**: `{"message": "Entry deleted successfully"}`

---

## 3. Phase 3: Consumption (RAG)

### `POST /ai/translate`
RAG-based translation using only verified entries.
- **Request Body**: `TranslationAPIRequest`
  ```json
  { 
    "source_text": "The river flows", 
    "source_lang": "English", 
    "target_lang": "Kadazan",
    "language_id": "kadazan-demo" 
  }
  ```
- **Response**: `TranslationResponse`

### `POST /ai/vision`
Identifies objects and looks up their indigenous name.
- **Request Body**: `VisionAPIRequest`
  ```json
  { 
    "description": "wooden house",
    "language_id": "kadazan-demo" 
  }
  ```
- **Response**: `VisionResponse`

### `POST /ai/story`
Generates a 3-page bilingual children's storybook.
- **Request Body**: `StoryGenerateRequest`
- **Response**: `StoryGenerateResponse`

### `POST /ai/tts` (Phonetic Bridge)
**Warning**: This service currently acts as a **Phonetic Bridge**, not a full audio synthesizer.
- **Request Body**: `TTSAPIRequest`
  ```json
  {
    "indigenous_text": "...",
    "language_id": "kadazan-demo"
  }
  ```
- **Response**: `TTSResponse`
  ```json
  {
    "ipa_phonemes": "/waig/",
    "pronunciation_guide": "wah-ig"
  }
  ```
- **Note**: The API loads the dictionary for `language_id` automatically. The client does NOT provide the dictionary.

---

## Data Models (CLLD Standard)
All AI ingestion and storage follows the **SIL CLLD standard** as defined in `srcs/services/ai/ai_dtos.py`. Key fields:
- `word`: Phonetic indigenous spelling.
- `status`: `verified` entries are used as "Ground Truth" for Phase 3.
