from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class RecordingDTO(BaseModel):
    userId: str
    audioUrl: str
    transcript: str
    language: str
    duration: int
    consent: bool
    visibility: Literal["private", "community", "public"]
    aiProcessed: Optional[bool] = False
    createdAt: Optional[datetime] = None