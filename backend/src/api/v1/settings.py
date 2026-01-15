from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from api.v1.deps import get_db
from crud import user as crud_user
from schemas.user import UserRead

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/")
async def get_global_settings():
    return {"settings": {}, "note": "Global settings not defined in current data model"}


@router.get("/{user_id}", response_model=UserRead)
async def get_user_settings(user_id: UUID, db: AsyncSession = Depends(get_db)):
    user = await crud_user.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
