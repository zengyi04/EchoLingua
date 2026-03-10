# EchoLingua Borneo: API Documentation

This document provides a comprehensive guide to the EchoLingua Borneo API.

**Base URL**: `http://localhost:8000` (Local)
**Authentication**: Most endpoints require a `Bearer` token in the `Authorization` header.

---

## 🔐 1. Authentication (`/auth`)
Handle user registration and session management.

### `POST /auth/register`
Create a new user account. Returns a JWT token upon success.
- **Body**: 
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "role": "elder" 
  }
  ```
- **Response**: 
  ```json
  {
    "message": "User registered successfully",
    "token": "eyJhbG... [JWT Token]",
    "user": {
      "id": "65edc... [MongoDB ObjectId]",
      "name": "John Doe",
      "role": "elder"
    }
  }
  ```

### `POST /auth/login`
Authenticate existing users.
- **Body**: 
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Response**: 
  ```json
  {
    "token": "eyJhbG... [JWT Token]",
    "user": {
      "id": "65edc... [MongoDB ObjectId]",
      "name": "John Doe",
      "role": "elder"
    }
  }
  ```

---

## 👤 2. User Profiles (`/users`)

### `GET /users/me`
Retrieve the authenticated user's profile, including points and badges.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  {
    "id": "65edc... [User ObjectId]",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "elder",
    "points": 150,
    "badges": ["pioneer", "speaker"]
  }
  ```

---

## 🎙️ 3. Recording Management (`/recordings`)
Centralized storage for all voice recordings.

### `GET /recordings`
List available recordings across the platform.
- **Query Params**:
  - `language`: Filter by language name (e.g., `Kadazan`).
  - `userId`: Filter by owner ID.
- **Response**: 
  ```json
  [
    {
      "id": "65edc... [Recording ObjectId]",
      "audioUrl": "https://storage.supabase.co/... [Public Audio URL]",
      "language": "Kadazan",
      "createdAt": "2024-03-10T... [ISO Timestamp]"
    }
  ]
  ```

### `POST /recordings/upload`
Upload raw audio to Supabase and register it in the DB.
- **Body**: `multipart/form-data`
  - `file`: Audio file (mp3, wav, etc.)
  - `userId`: String
  - `language`: String
  - `consent`: Boolean
  - `visibility`: `private` | `community` | `public`
  - `transcript`: Optional string
- **Response**: 
  ```json
  {
    "message": "Recording uploaded successfully",
    "recording": {
      "id": "65edc... [Recording ObjectId]",
      "audioUrl": "https://... [Public Audio URL]",
      "language": "Kadazan",
      "createdAt": "2024-03-10T... [ISO Timestamp]"
    }
  }
  ```

---

## 📖 4. Stories & Lessons (`/stories`, `/lessons`)

### `GET /stories`
List bilingual stories.
- **Query Params**: `language`, `tags` (comma-separated).
- **Response**: 
  ```json
  [
    {
      "id": "65edc... [Story ObjectId]",
      "title": "The Golden Frog",
      "language": "Kadazan",
      "createdBy": "65edc... [User ObjectId]",
      "tags": ["folk", "animals"]
    }
  ]
  ```

### `POST /stories`
Manually create a story entry.
- **Body**: 
  ```json
  {
    "title": "The Brave Hunter",
    "language": "Kadazan",
    "text": "Long ago in the jungle... [Full Text]",
    "tags": ["hero", "nature"]
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Story created successfully",
    "story": { 
      "id": "65edc... [Story ObjectId]", 
      "title": "The Brave Hunter" 
    }
  }
  ```

### `GET /lessons`
List vocabulary lessons and quizzes.
- **Query Params**: `difficulty` (beginner|intermediate|advanced), `language`, `category`.
- **Response**: 
  ```json
  [
    {
      "id": "65edc... [Lesson ObjectId]",
      "title": "Greetings in Kadazan",
      "difficulty": "beginner",
      "vocabulary": [
        { "word": "Kopivosian", "translation": "Hello" }
      ]
    }
  ]
  ```

### `POST /lessons`
Create a new lesson with a quiz.
- **Body**: 
  ```json
  {
    "title": "Numbers 1-10",
    "category": "Math",
    "difficulty": "beginner",
    "language": "Kadazan",
    "vocabulary": [
      { "word": "Isiso", "translation": "One" }
    ],
    "quiz": [
      {
        "question": "What is 'One'?",
        "options": ["Isiso", "Duo"],
        "answer": "Isiso"
      }
    ]
  }
  ```
- **Response**: `{"message": "Lesson created", "lesson": { "[Full Lesson Object]" } }`

---

## 🔍 4.5 Detail Lookups
Endpoints for fetching a single resource by ID.

### `GET /stories/{story_id}`
### `GET /lessons/{lesson_id}`
### `GET /recordings/{recording_id}`
**Response**: The full object (matches the "List" response format but as a single object).

---

## 🤖 5. AI Services Layer (`/ai`)
The core preservation lifecycle: **Elicit -> Verify -> Consume**.

### 🛠️ Phase 1: Elicitation (Ingestion)
Turn interactions into structured dictionary data.

#### `POST /ai/elicit/text`
Draft a dictionary entry from a text response.
- **Body**: 
  ```json
  {
    "anchor_text": "water",
    "indigenous_response": "waig",
    "language_id": "kadazan-demo"
  }
  ```
- **Response**: 
  ```json
  {
    "anchor_language": "English",
    "anchor_text": "water",
    "draft_dictionary_entry": {
      "id": "uuid-0000... [UUID String]",
      "word": "waig",
      "pos": "noun",
      "translation_english": "water",
      "status": "pending_verification"
    }
  }
  ```
- **Side Effect**: Saves entry to `dictionary` collection with `status="pending_verification"`.

#### `POST /ai/elicit/audio`
Draft a dictionary entry from a voice clip.
- **Body**: `multipart/form-data` containing `file`.
- **Response**: 
  ```json
  {
    "anchor_language": "English",
    "anchor_text": "What is water?",
    "draft_dictionary_entry": {
      "id": "uuid-0000... [UUID String]",
      "word": "waig",
      "pos": "noun",
      "source_audio_url": "https://... [Public Audio URL]"
    }
  }
  ```
- **Side Effects**: 
  1. Uploads to Supabase.
  2. Creates a recording record.
  3. AI transcribes and drafts a `CLLDEntry` (status: `pending`).

### ⚖️ Phase 2: Verification (Management)
Linguists must verify AI drafts before they enter the RAG context.

#### `GET /ai/dictionary`
Fetch entries for review.
- **Query Params**: `status` (pending_verification|verified), `language_id`.
- **Response**: 
  ```json
  [
    {
      "id": "uuid-0000... [UUID String]",
      "word": "waig",
      "pos": "noun",
      "status": "pending_verification"
    }
  ]
  ```

#### `POST /ai/dictionary/{entry_id}/verify`
Approve an AI draft, making it "Ground Truth" for translation/vision.

#### `DELETE /ai/dictionary/{entry_id}`
Reject and delete a hallucinated entry.

### 🚀 Phase 3: Consumption (RAG-Driven)
Services that use the **Verified Dictionary** to provide accurate AI.

#### `POST /ai/translate`
Context-aware translation using verified vocabulary.
- **Body**: 
  ```json
  {
    "source_text": "The river flows",
    "source_lang": "English",
    "target_lang": "Kadazan",
    "language_id": "kadazan-demo"
  }
  ```
- **Response**: 
  ```json
  {
    "translated_text": "Sungei flows... [Indigenous Translation]",
    "words_used_from_dict": ["Sungei", "waig"]
  }
  ```

#### `POST /ai/vision`
Extract vocabulary from an image description.
- **Body**: 
  ```json
  {
    "description": "a small wooden house",
    "language_id": "kadazan-demo"
  }
  ```
- **Response**: 
  ```json
  {
    "detected_english": "house",
    "indigenous_word": "Walai",
    "found_in_dictionary": true
  }
  ```

#### `POST /ai/story`
Generate a multi-page bilingual storybook.
- **Body**: 
  ```json
  {
    "annotated_text": [
      { 
        "indigenous_text": "Kopivosian... [A greeting]", 
        "malay_translation": "Apa khabar... [How are you]" 
      }
    ],
    "grammar_rules": ["S-V-O [Sentence structure rules]"],
    "language": "Kadazan"
  }
  ```
- **Response**: 
  ```json
  {
    "title": "The Golden Frog",
    "pages": [
      {
        "page_number": 1,
        "indigenous_text": "Long ago... [Indigenous version]",
        "english_translation": "Dulu kala... [English version]",
        "image_url": "https://... [Public Page Image URL]"
      }
    ]
  }
  ```
- **Side Effect**: Automatically persists to the core `stories` collection.

#### `POST /ai/tts`
High-accuracy speech synthesis using an IPA bridge.
- **Body**: 
  ```json
  {
    "indigenous_text": "waig",
    "language_id": "kadazan-demo"
  }
  ```
- **Response**: 
  ```json
  {
    "ipa_phonemes": "/waig/",
    "pronunciation_guide": "wah-ig",
    "audio_url": "https://storage.supabase.co/... [Synthesis Audio URL]"
  }
  ```

---

## 📊 6. Analytics (`/analytics`)

### `GET /analytics/language-usage`
Returns a breakdown of which indigenous languages are being recorded most.
- **Response**: 
  ```json
  {
    "Kadazan": 42,
    "Dusun": 12,
    "Malay": 5
  }
  ```

---

## 📐 Data Models (CLLD & Extensions)

### `CLLDEntry` (Dictionary)
| Field | Type | Description |
|---|---|---|
| `id` | String | UUID |
| `word` | String | Phonetic indigenous spelling |
| `pos` | String | Part of speech |
| `status` | String | `pending_verification` or `verified` |
| `translation_english` | String | Primary English meaning |

### `StoryPage`
Used in generated storybooks.
- `page_number`: Integer
- `indigenous_text`: String
- `english_translation`: String
- `image_url`: AI-generated or uploaded visual asset.
