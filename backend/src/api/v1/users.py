from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from src.schemas.user import UserRead, UserCreate, UserUpdate
from src.crud import user as crud_user
from src.api.v1.deps import get_db

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserRead])
async def list_users(
        q: Optional[str] = Query(None, description="Suchbegriff für display_name oder role"),
        limit: int = Query(50, ge=1, le=100),
        offset: int = Query(0, ge=0),
        db: AsyncSession = Depends(get_db)
):
    """Liste aller Users mit optionaler Suche und Paginierung"""
    users = await crud_user.get_multi(db, skip=offset, limit=limit, search=q)
    return users


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
        user_id: UUID,
        db: AsyncSession = Depends(get_db)
):
    """Einzelnen User anhand ID abrufen"""
    user = await crud_user.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    return user


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
        user_in: UserCreate,
        db: AsyncSession = Depends(get_db)
):
    """Neuen User erstellen"""
    return await crud_user.create(db, user_in)


@router.put("/{user_id}", response_model=UserRead)
async def update_user(
        user_id: UUID,
        user_in: UserUpdate,
        db: AsyncSession = Depends(get_db)
):
    """User aktualisieren"""
    user = await crud_user.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    return await crud_user.update(db, user, user_in)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
        user_id: UUID,
        db: AsyncSession = Depends(get_db)
):
    """User löschen"""
    user = await crud_user.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    await crud_user.remove(db, user)
