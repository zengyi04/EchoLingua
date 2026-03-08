# EchoLingua

An **Indigenous language preservation platform** for Borneo communities. Enables elders to record and share language documentation, and learners to access stories, lessons, and vocabulary.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend API | FastAPI |
| Database | MongoDB |
| File Storage | Supabase Storage |
| Auth | JWT (bcrypt) |

## Project Structure

```
EchoLingua_Borneo/
├── backend/           # FastAPI API server
│   ├── main.py       # App entry point
│   ├── config.py     # JWT & env config
│   ├── database.py   # MongoDB connection
│   ├── supabase_client.py
│   ├── dto/          # Pydantic models
│   ├── srcs/
│   │   ├── core/     # Auth, security, dependencies
│   │   ├── routes/   # API endpoints
│   │   └── services/ # Storage, etc.
│   ├── context/      # api_docs.md, db_docs.md
│   └── tests/       # API smoke tests (test_apis.ps1)
└── frontend/         # React/Expo app (if present)
```

---

## Backend Setup & Run

### 1. Create virtual environment

```bash
cd backend
python -m venv venv
```

**Windows (PowerShell):**

```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (CMD) / macOS / Linux:**

```bash
# Windows CMD
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string (Atlas or local) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/public key |
| `JWT_SECRET` | Secret for signing JWT tokens |

### 4. Run the server

```bash
cd backend
python main.py
```

Server runs at **http://localhost:8000**

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/

### 5. Run API tests

With the server running in another terminal:

```bash
cd backend
.\test_apis.ps1
```

---

## API Full Documentation

Full API specification, request/response schemas, and implementation details:

**[`backend/context/api_docs.md`](backend/context/api_docs.md)**
