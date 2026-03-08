# EchoLingua Backend API Documentation

## Core & Database APIs (Member 3)

This document describes the **backend APIs required for the Core & Database module** of the EchoLingua Indigenous Language Preservation platform.

The backend is implemented using:

- **FastAPI** (API server)
- **MongoDB** (metadata database)
- **Supabase Storage** (audio file storage)
- **JWT Authentication** (user authentication)
- **Pydantic DTOs** (data validation)

---

## 1. System Architecture

```
Client
  ↓
FastAPI Backend
  ↓
Supabase Storage (audio files)
  ↓
MongoDB (metadata & structured data)
```

### File Storage

```
Supabase Storage
├── recordings/
├── stories/
└── lessons/
```

### MongoDB Collections

```
users
recordings
stories
lessons
```

---

## 2. Authentication APIs

### 2.1 Register User

**Endpoint:** `POST /auth/register`

Creates a new user account.

**Request Body:**

```json
{
  "name": "Ali",
  "email": "ali@example.com",
  "password": "password123",
  "role": "learner"
}
```

**Validation Rules:**

| Field    | Type   | Required |
| -------- | ------ | -------- |
| name     | string | yes      |
| email    | string | yes      |
| password | string | yes      |
| role     | enum   | yes      |

Allowed roles: `elder`, `learner`, `admin`

**Backend Process:**

```
validate request
  ↓
check if email exists
  ↓
hash password using bcrypt
  ↓
insert user into MongoDB
  ↓
generate JWT token
  ↓
return user + token
```

**Response:**

```json
{
  "message": "User registered successfully",
  "token": "JWT_TOKEN",
  "user": {
    "id": "user_id",
    "name": "Ali",
    "role": "learner"
  }
}
```

---

### 2.2 Login

**Endpoint:** `POST /auth/login`

**Request Body:**

```json
{
  "email": "ali@example.com",
  "password": "password123"
}
```

**Backend Process:**

```
find user by email
  ↓
verify password
  ↓
generate JWT token
  ↓
return token
```

**Response:**

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "id": "user_id",
    "role": "learner"
  }
}
```

---

### 2.3 Forgot Password

**Endpoint:** `POST /auth/forgot-password`

**Description:** Initiates password reset by sending a reset link or token to the user's email.

**Request Body:**

```json
{
  "email": "ali@example.com"
}
```

**Backend Process:**

```
validate email exists
  ↓
generate reset token (expiry 1 hour)
  ↓
store token in DB or cache
  ↓
send email with reset link
  ↓
return success (do not reveal if email exists)
```

**Response:**

```json
{
  "message": "If the email exists, a reset link has been sent."
}
```

---

### 2.4 Reset Password

**Endpoint:** `POST /auth/reset-password`

**Description:** Resets user password using the token from the forgot-password flow.

**Request Body:**

```json
{
  "token": "reset_token_from_email",
  "newPassword": "newSecurePassword123",
  "confirmPassword": "newSecurePassword123"
}
```

**Backend Process:**

```
validate token (check expiry)
  ↓
validate password match
  ↓
hash new password
  ↓
update user in MongoDB
  ↓
invalidate token
  ↓
return success
```

**Response:**

```json
{
  "message": "Password reset successfully"
}
```

---

## 3. User APIs

### 3.1 Get Current User

**Endpoint:** `GET /users/me`

**Authentication:** Bearer JWT token

**Response:**

```json
{
  "id": "user_id",
  "name": "Ali",
  "email": "ali@example.com",
  "role": "learner",
  "points": 10,
  "badges": []
}
```

---

### 3.2 Update Current User

**Endpoint:** `PATCH /users/me`

**Authentication:** Bearer JWT token

**Description:** Updates the authenticated user's profile. Used for points, badges, language preference, and other profile fields. Partial updates supported.

**Request Body:**

```json
{
  "name": "Ali Updated",
  "languagePreference": "iban",
  "points": 25,
  "badges": ["storyteller", "first_steps"]
}
```

**Validation Rules:**

| Field              | Type          | Required | Description                    |
| ------------------ | ------------- | -------- | ------------------------------ |
| name               | string        | no       | User's display name            |
| languagePreference | string / null | no       | Preferred learning language   |
| points             | integer       | no       | Gamification score             |
| badges             | array[string] | no       | Achievement badges             |

**Backend Process:**

```
validate JWT
  ↓
fetch user by id from token
  ↓
merge allowed fields (exclude email, role from client update)
  ↓
update user in MongoDB
  ↓
return updated user
```

**Response:**

```json
{
  "id": "user_id",
  "name": "Ali Updated",
  "email": "ali@example.com",
  "role": "learner",
  "points": 25,
  "badges": ["storyteller", "first_steps"],
  "languagePreference": "iban"
}
```

---

## 4. Recording APIs

Recordings are **audio documentation of indigenous language** recorded by elders. Audio files are uploaded to **Supabase Storage**, while metadata is stored in MongoDB.

### 4.1 Upload Recording

**Endpoint:** `POST /recordings/upload`

**Request Type:** `multipart/form-data`

**Fields:**

| Field      | Type       |
| ---------- | ---------- |
| file       | audio file |
| language   | string     |
| consent    | boolean    |
| visibility | string     |

**Example Request:**

```
file: elder_story.mp3
language: iban
consent: true
visibility: community
```

**Backend Process:**

```
Client uploads file
  ↓
FastAPI receives UploadFile
  ↓
Generate unique filename
  ↓
Upload file to Supabase Storage (recordings bucket)
  ↓
Get public URL
  ↓
Insert metadata into MongoDB
  ↓
Return recording document
```

**Stored MongoDB Document:**

```json
{
  "userId": "user_object_id",
  "audioUrl": "https://project.supabase.co/storage/v1/object/public/recordings/audio1.mp3",
  "transcript": "",
  "language": "iban",
  "duration": 0,
  "consent": true,
  "visibility": "community",
  "aiProcessed": false,
  "createdAt": "timestamp"
}
```

**Response:**

```json
{
  "message": "Recording uploaded successfully",
  "recording": {
    "id": "recording_id",
    "audioUrl": "https://...",
    "language": "iban"
  }
}
```

---

### 4.2 Get Recordings

**Endpoint:** `GET /recordings`

**Query Parameters:**

| Parameter | Description        |
| --------- | ------------------ |
| language  | filter by language |
| userId    | filter by user     |

**Example:** `GET /recordings?language=iban`

**Response:**

```json
[
  {
    "id": "recording_id",
    "audioUrl": "...",
    "language": "iban",
    "createdAt": "timestamp"
  }
]
```

---

### 4.3 Get Recording By ID

**Endpoint:** `GET /recordings/{recordingId}`

**Response:**

```json
{
  "id": "recording_id",
  "audioUrl": "...",
  "transcript": "...",
  "language": "iban",
  "visibility": "community"
}
```

---

### 4.4 Delete Recording

**Endpoint:** `DELETE /recordings/{recordingId}`

**Authentication:** Bearer JWT token

**Description:** Deletes a recording. Only the recording owner (or admin) may delete. Optionally removes the file from Supabase Storage or marks as soft-deleted.

**Backend Process:**

```
validate JWT
  ↓
fetch recording by id
  ↓
verify userId matches token (or user is admin)
  ↓
delete from MongoDB
  ↓
(optional) delete file from Supabase Storage
  ↓
return success
```

**Response:**

```json
{
  "message": "Recording deleted successfully"
}
```

**Error (403 Forbidden):** When user does not own the recording and is not admin.

---

## 5. Story APIs

Stories represent **traditional folklore or cultural narratives**.

### 5.1 Create Story

**Endpoint:** `POST /stories`

**Request Body:**

```json
{
  "title": "Forest Spirit",
  "language": "iban",
  "text": "Long ago the forest...",
  "childrenVersion": "A spirit protected the forest",
  "audioUrl": "...",
  "tags": ["folklore", "culture"]
}
```

**Backend Process:**

```
validate request
  ↓
insert story into MongoDB
  ↓
return story
```

---

### 5.2 Get Stories

**Endpoint:** `GET /stories`

**Query Parameters:**

| Parameter | Description        |
| --------- | ------------------ |
| language  | filter by language |
| tags      | filter by tag      |

**Example:** `GET /stories?language=iban`

---

### 5.3 Get Story By ID

**Endpoint:** `GET /stories/{storyId}`

**Description:** Returns a single story by ID. Used when opening a story for reading or playback.

**Response:**

```json
{
  "id": "story_id",
  "title": "Forest Spirit",
  "language": "iban",
  "text": "Long ago the forest was protected by a spirit...",
  "childrenVersion": "A spirit protected the forest.",
  "audioUrl": "https://.../stories/story_audio_001.mp3",
  "createdBy": "user_id",
  "tags": ["folklore", "culture"],
  "createdAt": "timestamp"
}
```

---

### 5.4 Create Story with Audio Upload

**Endpoint:** `POST /stories/upload`

**Request Type:** `multipart/form-data`

**Description:** Creates a story with an audio file. Used by CommunityStoryScreen when sharing a recording as a story. Audio is uploaded to Supabase Storage (stories bucket), then metadata is stored in MongoDB.

**Fields:**

| Field          | Type       | Required | Description                  |
| -------------- | ---------- | -------- | ---------------------------- |
| file           | audio file | yes      | Story narration audio        |
| title          | string     | yes      | Story title                  |
| language       | string     | yes      | Language code (e.g., iban)   |
| text           | string     | no       | Full story text              |
| childrenVersion| string     | no       | Simplified version          |
| description    | string     | no       | Story description            |
| tags           | string     | no       | Comma-separated tags         |
| category       | string     | no       | e.g., Folklore, Culture      |

**Backend Process:**

```
receive multipart form
  ↓
upload audio to Supabase Storage (stories bucket)
  ↓
get public URL
  ↓
build story document with audioUrl
  ↓
insert into MongoDB (createdBy = JWT userId)
  ↓
return story
```

**Response:**

```json
{
  "message": "Story created successfully",
  "story": {
    "id": "story_id",
    "title": "Forest Spirit",
    "audioUrl": "https://.../stories/story_001.mp3",
    "language": "iban",
    "createdAt": "timestamp"
  }
}
```

---

## 6. Lesson APIs

Lessons support **interactive language learning**.

### 6.1 Create Lesson

**Endpoint:** `POST /lessons`

**Request Body:**

```json
{
  "title": "Basic Greetings",
  "category": "greetings",
  "difficulty": "beginner",
  "language": "iban",
  "vocabulary": [
    {
      "word": "Selamat",
      "translation": "Hello",
      "audioUrl": "..."
    }
  ],
  "quiz": [
    {
      "question": "What does Selamat mean?",
      "options": ["Hello", "Food", "Tree"],
      "answer": "Hello"
    }
  ]
}
```

---

### 6.2 Get Lessons

**Endpoint:** `GET /lessons`

**Query Parameters:**

| Parameter  | Description          |
| ---------- | -------------------- |
| difficulty | beginner, intermediate, advanced |
| language   | filter by language   |
| category   | filter by category   |

**Example:** `GET /lessons?difficulty=beginner`

---

### 6.3 Get Lesson By ID

**Endpoint:** `GET /lessons/{lessonId}`

**Description:** Returns a single lesson with full vocabulary and quiz data. Used when a user opens a specific lesson.

**Response:**

```json
{
  "id": "lesson_id",
  "title": "Basic Greetings",
  "category": "greetings",
  "difficulty": "beginner",
  "language": "iban",
  "vocabulary": [
    {
      "word": "Selamat",
      "translation": "Hello",
      "audioUrl": "https://.../lessons/hello.mp3"
    }
  ],
  "quiz": [
    {
      "question": "What does Selamat mean?",
      "options": ["Hello", "Food", "Tree"],
      "answer": "Hello"
    }
  ],
  "createdAt": "timestamp"
}
```

---

### 6.4 Get Vocabulary

**Endpoint:** `GET /vocabulary`

**Description:** Returns a flattened list of vocabulary items, optionally filtered. Can be derived from lessons or stored as a dedicated collection. Used by VocabularyScreen for word lists and flash cards.

**Query Parameters:**

| Parameter  | Description                    |
| ---------- | ------------------------------ |
| language   | filter by language             |
| difficulty | easy, medium, hard             |
| category   | filter by category             |
| limit      | max items (default 100)        |

**Example:** `GET /vocabulary?language=iban&difficulty=easy`

**Response:**

```json
[
  {
    "id": "vocab_id",
    "word": "Selamat",
    "translation": "Hello",
    "pronunciation": "suh-lah-mat",
    "audioUrl": "https://.../hello.mp3",
    "difficulty": "easy",
    "language": "iban"
  }
]
```

*Note:* Vocabulary can also be extracted from `GET /lessons` (each lesson has a vocabulary array). A dedicated `/vocabulary` endpoint supports standalone vocabulary browsing and search.

---

## 7. Quiz & Scores API

### 7.1 Submit Quiz Score

**Endpoint:** `POST /scores`

**Authentication:** Bearer JWT token

**Description:** Saves a quiz result for the authenticated user. Used by QuizScreen and scoringService when backend sync is enabled. Links score to userId for leaderboards and progress tracking.

**Request Body:**

```json
{
  "score": 8,
  "totalQuestions": 10,
  "language": "iban",
  "difficulty": "medium",
  "quizNumber": 1
}
```

**Validation Rules:**

| Field          | Type   | Required | Description                |
| -------------- | ------ | -------- | --------------------------- |
| score          | number | yes      | Correct answers count       |
| totalQuestions | number | yes      | Total questions in quiz     |
| language       | string | no       | Language practiced          |
| difficulty     | string | no       | easy, medium, hard          |
| quizNumber     | number | no       | Quiz variant identifier     |

**Backend Process:**

```
validate JWT
  ↓
validate request body
  ↓
compute percentage
  ↓
insert score document (userId, score, totalQuestions, percentage, metadata)
  ↓
update user points (optional gamification)
  ↓
return created score
```

**Response:**

```json
{
  "id": "score_id",
  "userId": "user_id",
  "score": 8,
  "totalQuestions": 10,
  "percentage": 80,
  "language": "iban",
  "difficulty": "medium",
  "createdAt": "timestamp"
}
```

---

### 7.2 Get User Scores

**Endpoint:** `GET /users/me/scores`

**Authentication:** Bearer JWT token

**Description:** Returns the authenticated user's quiz history for profile and progress views.

**Query Parameters:**

| Parameter | Description     |
| --------- | --------------- |
| limit     | max results     |
| language  | filter by lang  |

**Response:**

```json
[
  {
    "id": "score_id",
    "score": 8,
    "totalQuestions": 10,
    "percentage": 80,
    "language": "iban",
    "difficulty": "medium",
    "createdAt": "timestamp"
  }
]
```

---

## 8. Contributions API

Community contributions allow users to submit Story, Phrase, or Cultural Knowledge with optional audio. Submissions go through an approval workflow (Pending → Approved / Rejected) with admin feedback.

### 8.1 Submit Contribution

**Endpoint:** `POST /contributions`

**Authentication:** Bearer JWT token

**Request Type:** `multipart/form-data` (if audio included) or `application/json`

**Fields:**

| Field       | Type       | Required | Description                         |
| ----------- | ---------- | -------- | ----------------------------------- |
| title       | string     | yes      | Contribution title                  |
| description | string     | yes      | Description or transcript           |
| category    | enum       | yes      | Story, Phrase, Cultural Knowledge   |
| file        | audio file | no       | Optional audio file                 |

**Backend Process:**

```
validate JWT
  ↓
validate required fields
  ↓
(if file) upload to Supabase Storage
  ↓
insert contribution (status: "pending", submittedBy: userId)
  ↓
return contribution
```

**Response:**

```json
{
  "id": "contribution_id",
  "title": "Traditional Wedding Song",
  "category": "Story",
  "status": "pending",
  "submittedBy": "user_id",
  "submittedAt": "timestamp",
  "message": "Contribution submitted. You will be notified when reviewed."
}
```

---

### 8.2 Get My Contributions

**Endpoint:** `GET /users/me/contributions`

**Authentication:** Bearer JWT token

**Description:** Returns the authenticated user's contributions with status and admin feedback. Used by CommunityContributionScreen to show Approved, Pending, Rejected submissions.

**Query Parameters:**

| Parameter | Description      |
| --------- | ---------------- |
| status    | pending, approved, rejected |
| limit     | max results      |

**Response:**

```json
[
  {
    "id": "contribution_id",
    "title": "Traditional Wedding Song",
    "category": "Story",
    "status": "Approved",
    "date": "2026-02-28",
    "adminComment": "Beautiful contribution! Well recorded and documented."
  },
  {
    "id": "contribution_id_2",
    "title": "Harvest Ritual Story",
    "category": "Cultural Knowledge",
    "status": "Rejected",
    "date": "2026-02-25",
    "adminComment": "Audio quality too low. Please re-record in a quieter environment."
  }
]
```

---

### 8.3 Update Contribution Status (Admin)

**Endpoint:** `PATCH /contributions/{contributionId}`

**Authentication:** Bearer JWT token (admin role)

**Request Body:**

```json
{
  "status": "approved",
  "adminComment": "Beautiful contribution! Well recorded and documented."
}
```

**Description:** Admin-only. Updates contribution status and optionally adds feedback visible to the submitter.

---

## 9. Language Analytics API

Provides statistics for language preservation activity.

**Endpoint:** `GET /analytics/language-usage`

**Backend Process:**

MongoDB aggregation:

```
group recordings by language
  ↓
count number of recordings
  ↓
return statistics
```

**Response:**

```json
{
  "iban": 12,
  "dusun": 7,
  "bidayuh": 4
}
```

---

## 10. Leaderboard API

**Endpoint:** `GET /leaderboard`

**Description:** Returns top contributors by points or activity. Used by LanguageVitalityDashboard for community engagement display.

**Query Parameters:**

| Parameter | Description                    |
| --------- | ------------------------------ |
| limit     | max results (default 10)       |
| sortBy    | points, contributions, recent  |

**Response:**

```json
[
  {
    "rank": 1,
    "userId": "user_id",
    "name": "Sarah Iban",
    "avatar": "SI",
    "points": 2450,
    "contributions": 87,
    "badge": "Elder"
  }
]
```

*Note:* Data can be aggregated from users (points, badges) and recordings/stories count (contributions).

---

## 11. Notifications API

### 11.1 Get Notifications

**Endpoint:** `GET /notifications`

**Authentication:** Bearer JWT token

**Description:** Returns notifications for the authenticated user (e.g., new community story, contribution status update).

**Query Parameters:**

| Parameter | Description     |
| --------- | --------------- |
| unreadOnly| true/false      |
| limit     | max results     |

**Response:**

```json
[
  {
    "id": "notif_id",
    "type": "story",
    "title": "New Community Story",
    "message": "Someone shared: Forest Spirit",
    "read": false,
    "timestamp": "timestamp",
    "storyData": { "id": "...", "title": "..." }
  }
]
```

---

### 11.2 Mark Notification Read

**Endpoint:** `PATCH /notifications/{notificationId}/read`

**Authentication:** Bearer JWT token

**Request Body:**

```json
{
  "read": true
}
```

**Response:**

```json
{
  "message": "Notification marked as read"
}
```

---

## 12. Story Engagement API (Nice-to-Have)

### 12.1 Like Story

**Endpoint:** `POST /stories/{storyId}/like`

**Authentication:** Bearer JWT token

**Description:** Toggles like on a story. Idempotent.

**Response:**

```json
{
  "liked": true,
  "likeCount": 42
}
```

---

### 12.2 Collect Story

**Endpoint:** `POST /stories/{storyId}/collect`

**Authentication:** Bearer JWT token

**Description:** Adds story to user's collection. Used by CommunityStoryScreen.

---

### 12.3 Add Story Comment

**Endpoint:** `POST /stories/{storyId}/comments`

**Authentication:** Bearer JWT token

**Request Body:**

```json
{
  "content": "Beautiful story! Thank you for sharing."
}
```

---

## 13. Role-Based Access Control

| API                 | Role    |
| ------------------- | ------- |
| upload recordings   | elder   |
| create stories      | elder   |
| view lessons        | learner |
| submit contributions| learner, elder |
| admin contributions | admin   |
| admin dashboard     | admin   |

JWT token contains: `userId`, `role`

Middleware verifies role before allowing access.

---

## 14. Security Considerations

Security measures implemented:

- password hashing (bcrypt)
- JWT authentication
- role-based authorization
- file type validation
- privacy visibility control
- consent verification for recordings
- reset token expiry (forgot password)

---

## 15. API Summary

### Implementation Priority

- **Core (Phase 1) — implement first:** Register, Login, GET /users/me, Recording upload/list/get, Stories create/list/get, Lessons create/list/get, GET /lessons/{id}, GET /stories/{id}, Analytics.
- **Extended (Phase 2):** POST /scores, GET /users/me/scores, PATCH /users/me, DELETE /recordings, GET /vocabulary, POST /stories/upload, Contributions, Forgot/Reset password.
- **Low priority — skip first ⏭️:** Forgot password, Reset password, PATCH /users/me, DELETE /recordings, POST /stories/upload, GET /vocabulary, Quiz & Scores API, Contributions API, Leaderboard, Notifications, Story Engagement (like/collect/comments).

---

### All Endpoints

| Method | Endpoint                  | Purpose               | Priority   | Done |
| ------ | ------------------------- | --------------------- | ---------- | ---- |
| POST   | /auth/register            | register user         | Core       | ✓ |
| POST   | /auth/login               | login user            | Core       | ✓ |
| POST   | /auth/forgot-password     | request password reset | ⏭️ Skip first | |
| POST   | /auth/reset-password      | reset password        | ⏭️ Skip first | |
| GET    | /users/me                 | get current user      | Core       | ✓ |
| PATCH  | /users/me                 | update user profile   | ⏭️ Skip first | |
| POST   | /recordings/upload        | upload recording      | Core       | ✓ |
| GET    | /recordings               | list recordings       | Core       | ✓ |
| GET    | /recordings/{id}          | get recording         | Core       | ✓ |
| DELETE | /recordings/{id}          | delete recording      | ⏭️ Skip first | |
| POST   | /stories                  | create story (JSON)   | Core       | ✓ |
| POST   | /stories/upload           | create story with audio | ⏭️ Skip first | |
| GET    | /stories                  | list stories          | Core       | ✓ |
| GET    | /stories/{id}             | get story             | Core       | ✓ |
| POST   | /lessons                  | create lesson         | Core       | ✓ |
| GET    | /lessons                  | list lessons          | Core       | ✓ |
| GET    | /lessons/{id}             | get lesson            | Core       | ✓ |
| GET    | /vocabulary               | get vocabulary list   | ⏭️ Skip first | |
| POST   | /scores                   | submit quiz score     | ⏭️ Skip first | |
| GET    | /users/me/scores          | get user quiz history | ⏭️ Skip first | |
| POST   | /contributions            | submit contribution   | ⏭️ Skip first | |
| GET    | /users/me/contributions   | get my contributions  | ⏭️ Skip first | |
| PATCH  | /contributions/{id}       | admin: update status  | ⏭️ Skip first | |
| GET    | /analytics/language-usage | language statistics   | Core       | ✓ |
| GET    | /leaderboard              | top contributors      | ⏭️ Skip first | |
| GET    | /notifications            | get notifications     | ⏭️ Skip first | |
| PATCH  | /notifications/{id}/read  | mark notification read | ⏭️ Skip first | |
| POST   | /stories/{id}/like        | like story            | ⏭️ Skip first | |
| POST   | /stories/{id}/collect     | collect story         | ⏭️ Skip first | |
| POST   | /stories/{id}/comments    | add comment           | ⏭️ Skip first | |
