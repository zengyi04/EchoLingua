from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, EmailStr

class UserMeResponse(BaseModel):
    # Response for GET /users/me.

    id: str
    name: str
    email: str
    role: str
    points: int = 0
    badges: List[str] = []

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