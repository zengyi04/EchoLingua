from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from datetime import datetime


class UserDTO(BaseModel):
    name: str
    email: EmailStr
    passwordHash: str
    role: Literal["elder", "learner", "admin"]
    points: int = 0
    badges: List[str] = []
    languagePreference: Optional[str] = None
    createdAt: Optional[datetime] = None
    lastLogin: Optional[datetime] = None
    status: Literal["active", "suspended"] = "active"