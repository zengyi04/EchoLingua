# EchoLingua

BorNEO HackWknd 2026
Team UM is One

EchoLingua is a mobile-first platform for indigenous language preservation and learning in Borneo communities. It combines community storytelling, AI-assisted language tools, cultural documentation, and interactive learning features to support long-term language revitalization.

## Final Report Link
https://drive.google.com/file/d/17jdritN2Onja39VbLjdJlD10Uiak6gDy/view?usp=sharing

## Demo Video Link

## Slides Link

## 1. General Description

### What the project does

EchoLingua provides an integrated platform for both language learning and language preservation. The prototype supports:

- Vocabulary learning, quizzes, and scenario-based practice.
- Community storytelling and cultural knowledge sharing.
- Audio recording for pronunciation and oral history documentation.
- AI-assisted chat, translation, story generation, transcription, and text-to-speech.
- Progress tracking through XP, streaks, and user profiles.

The goal is to preserve language and culture while making learning accessible to younger generations.

### SDGs addressed

- SDG 4: Quality Education.
  - Promotes inclusive learning through interactive language content and AI-assisted practice.
- SDG 11: Sustainable Cities and Communities.
  - Protects intangible cultural heritage through digital preservation of stories and pronunciation.

### Target users

- Indigenous elders and fluent speakers who want to preserve language and cultural narratives.
- Youth learners and students who need engaging language learning tools.
- Families who want intergenerational language learning at home.
- Educators, NGOs, and community organizations supporting language revitalization.
- Judges and evaluators assessing social impact technology prototypes.

## 2. Setup Instructions

### How to install

Prerequisites:

- Python 3.10+
- Node.js 18+ and npm
- MongoDB access
- Supabase credentials
- API keys for Gemini, Maps, and OCR/Vision features

Backend installation:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Frontend installation:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

Configure environment values:

- Backend `.env`: `MONGODB_URI`, `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, `GEMINI_API_KEY_LIST`
- Frontend `.env`: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, `EXPO_PUBLIC_GEMINI_API_KEY`, `EXPO_PUBLIC_GEMINI_MODEL`, `EXPO_PUBLIC_GOOGLE_VISION_API_KEY`, `EXPO_PUBLIC_OCR_SPACE_API_KEY`

Update API URL in [frontend/src/services/api.js](frontend/src/services/api.js):

- Local web or emulator: `http://localhost:8000`
- Physical device via Expo Go: `http://your-lan-ip:8000`

### How to run

Run backend:

```powershell
cd backend
python main.py
```

Backend endpoints:

- Health check: `http://localhost:8000/`
- Swagger docs: `http://localhost:8000/docs`

Run frontend:

```powershell
cd frontend
npm start
```

In Expo:

- Press `w` for web.
- Press `a` for Android emulator.
- Or scan the QR code with Expo Go.

## 3. How to Interact With the Prototype

### Step-by-step guide for judges

1. Start the backend and confirm the health endpoint is reachable.
2. Start the frontend and open the app.
3. On the authentication screen, choose `Sign Up` or `Continue as Guest`.
4. On the Home screen, show the language dashboard and key navigation.
5. Open the Learn section and demonstrate vocabulary and quiz flow.
6. Open the Stories section and show story library or community stories.
7. Open Record or an AI feature and demonstrate one AI interaction.
8. Open Profile or Progress and show XP, streaks, and learner statistics.
9. Open backend Swagger docs at `http://localhost:8000/docs` as API proof.

### Test cases (if applicable)

Automated backend smoke test:

```powershell
cd backend\tests
.\test_apis.ps1
```

This validates:

- Health check.
- Register and profile flow.
- Stories and lessons endpoints.
- Analytics endpoint.
- Invalid ID error handling.

Optional test run:

```powershell
cd backend
pytest tests
```

Manual test checklist for judges:

1. Register a new user and log in successfully.
2. Open and complete at least one quiz interaction.
3. Open one story and verify content displays correctly.
4. Run one AI feature and verify a valid response is returned.
5. Verify API routes are visible in Swagger documentation.

## Additional References

- [backend/context/api_docs.md](backend/context/api_docs.md)
- [backend/context/db_docs.md](backend/context/db_docs.md)
- [frontend/README.md](frontend/README.md)
