from fastapi import APIRouter, Depends
from dto.user_dto import UserMeResponse
from srcs.core.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

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
