from pydantic import BaseModel, EmailStr, Field
from typing import Literal

Role = Literal["elder", "learner", "admin"]

class RegisterRequest(BaseModel):
    # Request body for POST /auth/register.

    name: str = Field(..., min_length=1, max_length=200, description="User's display name")
    email: EmailStr = Field(..., description="Login email address")
    password: str = Field(..., min_length=6, max_length=128, description="Plain-text password")
    role: Role = Field(..., description="User role: elder, learner, or admin")

class LoginRequest(BaseModel):
    # Request body for POST /auth/login.

    email: EmailStr = Field(..., description="Login email address")
    password: str = Field(..., min_length=1, description="Plain-text password")

class AuthUserResponse(BaseModel):
    # User object in auth responses (no sensitive fields).

    id: str
    name: str
    role: str

class RegisterResponse(BaseModel):
    # Response for successful registration.

    message: str
    token: str
    user: AuthUserResponse

class LoginResponse(BaseModel):
    # Response for successful login.

    token: str
    user: AuthUserResponse
