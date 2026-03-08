from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class StoryDTO(BaseModel):
    title: str
    language: str
    text: str
    childrenVersion: Optional[str] = None
    audioUrl: Optional[str] = None
    createdBy: str
    tags: List[str] = []
    createdAt: Optional[datetime] = None