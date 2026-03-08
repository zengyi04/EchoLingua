"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from database import ensure_indexes
from srcs.routes.analytics import router as analytics_router
from srcs.routes.auth import router as auth_router
from srcs.routes.lesson import router as lesson_router
from srcs.routes.recording import router as recording_router
from srcs.routes.story import router as story_router
from srcs.routes.user import router as user_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup and shutdown logic."""
    await ensure_indexes()
    yield


app = FastAPI(
    title="EchoLingua Borneo API",
    description="Indigenous language preservation platform",
    lifespan=lifespan,
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(recording_router)
app.include_router(story_router)
app.include_router(lesson_router)
app.include_router(analytics_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "EchoLingua Borneo API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
