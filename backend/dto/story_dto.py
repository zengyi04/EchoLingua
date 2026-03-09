from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class CreateStoryRequest(BaseModel):
    # Request body for POST /stories.

    title: str = Field(..., min_length=1, max_length=300)
    language: str = Field(..., min_length=1, max_length=50)
    text: str = Field(default="")
    childrenVersion: Optional[str] = Field(None, max_length=2000)
    audioUrl: Optional[str] = Field(None)
    tags: List[str] = Field(default_factory=list, max_length=20)

class StoryResponse(BaseModel):
    # Story in API responses.

    id: str
    title: str
    language: str
    text: Optional[str] = None
    childrenVersion: Optional[str] = None
    audioUrl: Optional[str] = None
    createdBy: Optional[str] = None
    tags: List[str] = []
    createdAt: Optional[datetime] = None

class StoryDTO(BaseModel):
    title: str
    language: str
    text: str
    childrenVersion: Optional[str] = None
    audioUrl: Optional[str] = None
    createdBy: str
    tags: List[str] = []
    createdAt: Optional[datetime] = None