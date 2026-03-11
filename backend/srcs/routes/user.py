from fastapi import APIRouter, Depends, HTTPException, Query
from dto.user_dto import UserMeResponse, UserSearchResult
from database import get_users_collection
from srcs.core.dependencies import get_current_user
from typing import Optional

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/search", response_model=UserSearchResult)
async def search_user(
    email: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Look up another user by email, username, or phone.
    Requires authentication. Returns minimal public info only.
    """
    if not email and not username and not phone:
        raise HTTPException(status_code=400, detail="Provide at least one of: email, username, or phone")

    collection = get_users_collection()
    query_conditions = []
    if email:
        query_conditions.append({"email": email.strip().lower()})
    if username:
        query_conditions.append({"username": {"$regex": f"^{username.strip()}$", "$options": "i"}})
        query_conditions.append({"name": {"$regex": f"^{username.strip()}$", "$options": "i"}})
    if phone:
        query_conditions.append({"phone": phone.strip()})

    user = await collection.find_one({"$or": query_conditions})
    if not user:
        raise HTTPException(status_code=404, detail="No app account found matching the provided details")

    return UserSearchResult(id=str(user["_id"]), name=user["name"], email=user["email"])

@router.get("/me", response_model=UserMeResponse)
async def get_current_user_profile(user: dict = Depends(get_current_user)):
    """
    Return the authenticated user's profile.

    Requires: Bearer JWT token in Authorization header.
    """
    return UserMeResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
        points=user.get("points", 0),
        badges=user.get("badges", []),
    )
