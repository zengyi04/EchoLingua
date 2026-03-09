from datetime import datetime
from fastapi import APIRouter, HTTPException
from database import get_users_collection
from dto.auth_dto import (
    AuthUserResponse,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
)
from srcs.core.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

def _user_to_response(user_doc: dict) -> AuthUserResponse:

    return AuthUserResponse(
        id=str(user_doc["_id"]),
        name=user_doc["name"],
        role=user_doc["role"],
    )

@router.post("/register", response_model=RegisterResponse)
async def register(request: RegisterRequest):
    """
    Create a new user account.

    Flow:
    1. Validate request
    2. Check if email already exists
    3. Hash password with bcrypt
    4. Insert user into MongoDB
    5. Generate JWT token
    6. Return user + token
    """
    collection = get_users_collection()

    # Normalize email for lookup
    email_lower = request.email.strip().lower()

    # Check if email exists
    existing = await collection.find_one({"email": email_lower})
    if existing:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists",
        )

    # Hash password
    password_hash = hash_password(request.password)

    # Build user document
    user_doc = {
        "name": request.name.strip(),
        "email": email_lower,
        "passwordHash": password_hash,
        "role": request.role,
        "points": 0,
        "badges": [],
        "languagePreference": None,
        "createdAt": datetime.utcnow(),
        "lastLogin": None,
        "status": "active",
    }

    try:
        result = await collection.insert_one(user_doc)
        user_id = str(result.inserted_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create user: {str(e)}",
        ) from e

    # Generate JWT
    token = create_access_token(subject=user_id)

    user_response = AuthUserResponse(id=user_id, name=user_doc["name"], role=user_doc["role"])

    return RegisterResponse(
        message="User registered successfully",
        token=token,
        user=user_response,
    )

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate user and return JWT token.

    Flow:
    1. Find user by email
    2. Verify password
    3. Generate JWT token
    4. Update lastLogin
    5. Return token + user
    """
    collection = get_users_collection()

    email_lower = request.email.strip().lower()

    # Find user
    user = await collection.find_one({"email": email_lower})
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    # Check status
    if user.get("status") == "suspended":
        raise HTTPException(
            status_code=403,
            detail="Account is suspended",
        )

    # Verify password
    if not verify_password(request.password, user["passwordHash"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    user_id = str(user["_id"])

    # Update lastLogin (fire-and-forget, non-blocking)
    try:
        await collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"lastLogin": datetime.utcnow()}},
        )
    except Exception:
        pass  # Non-critical; do not fail login

    token = create_access_token(subject=user_id)

    return LoginResponse(
        token=token,
        user=AuthUserResponse(
            id=user_id,
            name=user["name"],
            role=user["role"],
        ),
    )
