# BorneoEchoLingua: AI API Documentation

This document specifies the endpoints for the AI language preservation lifecycle (Elicit -> Verify -> Consume).

> [!IMPORTANT]
> **Frontend Note**: The transition from Phase 1 (Elicitation) to Phase 3 (Consumption) is **NOT** automatic. All AI-generated dictionary entries require human verification in a dedicated "Review" or "Pending" page before they are used in translation/vision tasks.

## Base Path: `/ai`
**Authentication**: All endpoints require a valid `Bearer` token in the `Authorization` header.

---

## 1. Phase 1: Elicitation (Ingestion)

- **Request Body**: `ElicitationTextRequest`
  ```json
  { 
    "anchor_text": "water", 
    "indigenous_response": "waig",
    "language_id": "kadazan-demo"
  }
  ```
- **Response**: `ElicitationResponse` containing a drafted `CLLDEntry`.
- **Side Effect**: Automatically saves the drafted entry to the `dictionary` collection (status: `pending_verification`).

### `POST /ai/elicit/audio`
Drafts a dictionary entry from an audio recording.
- **Request**: `multipart/form-data` with a `file` field.
- **Response**: `ElicitationResponse` containing a drafted `CLLDEntry`.
- **Side Effects**: 
  1. Uploads audio to **Supabase Storage**.
  2. Creates a record in the `recordings` collection.
  3. Saves the drafted entry to the `dictionary` collection.

---

## 2. Phase 2: Verification (Management Workflow)

> [!TIP]
> **UI Required**: Build a "Dictionary Management" dashboard. This page should default to showing entries with `status=pending_verification`. Linguists will use this to correct LLM hallucinations before clicking "Verify".

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
**Prerequisite**: Only entries with `status="verified"` are included in the RAG context. If a word exists in the DB but is still `pending_verification`, it will be ignored by this service.
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
- **Request Body**: `StoryGenerateRequest` (supports optional `language`)
- **Response**: `StoryGenerateResponse`
- **Side Effect**: Automatically persists the generated story (including rich page data) to the core `stories` collection, making it visible in the main gallery.

### `POST /ai/tts` (Synthesis)
Converts indigenous text to IPA phonemes and synthesizes audio via **gTTS**.
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
    "pronunciation_guide": "wah-ig",
    "audio_url": "https://storage.supabase.co/.../tts_kadazan_...mp3"
  }
  ```
- **Note**: The service uses an LLM-generated pronunciation guide to drive the speech engine for maximum accuracy. Auto-uploads to Supabase.


---

## Data Models (CLLD Standard)
All AI ingestion and storage follows the **SIL CLLD standard** as defined in `srcs/services/ai/ai_dtos.py`. Key fields:
- `word`: Phonetic indigenous spelling.
- `status`: `verified` entries are used as "Ground Truth" for Phase 3.
