from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from schemas.user import UserRead, UserCreate, UserUpdate
from crud import user as crud_user
from api.v1.deps import get_db
from services.ldap_service import ldap_service
from core.config import settings

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserRead])
async def list_users(
        q: Optional[str] = Query(None, description="Suchbegriff für username, email, firstName, lastName"),
        limit: int = Query(50, ge=1, le=100),
        offset: int = Query(0, ge=0),
        db: AsyncSession = Depends(get_db)
):
    """Liste aller Lehrer mit optionaler Suche und Paginierung"""
    users = await crud_user.get_multi(db, skip=offset, limit=limit, search=q)
    return users


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
        user_id: UUID,
        db: AsyncSession = Depends(get_db)
):
    """
    Einzelnen Lehrer anhand ID abrufen.
    Wenn LDAP aktiviert ist und der Lehrer einen username hat,
    werden aktuelle LDAP-Daten abgerufen und in die Response integriert.
    """
    user = await crud_user.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )

    # LDAP-Daten abrufen, falls aktiviert und User hat username
    if settings.ldap_enabled and user.username:
        ldap_data = ldap_service.get_user_by_username(user.username)
        if ldap_data:
            # Aktualisiere User-Objekt temporär mit LDAP-Daten für Response
            # (ohne DB-Update, nur für diese Response)
            user.email = ldap_data.get('email') or user.email
            user.first_name = ldap_data.get('first_name') or user.first_name
            user.last_name = ldap_data.get('last_name') or user.last_name

    return user


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
        user_in: UserCreate,
        db: AsyncSession = Depends(get_db)
):
    """Neuen Lehrer erstellen"""
    return await crud_user.create(db, user_in)


@router.put("/{user_id}", response_model=UserRead)
async def update_user(user_id: UUID, user_in: UserUpdate, db: AsyncSession = Depends(get_db)):
    user = await crud_user.get(db, user_id)
    if not user:
        raise HTTPException(404, detail=f"User with id {user_id} not found")

    if user.is_admin and user_in.is_admin is False:
        admin_count = await crud_user.count_admins(db)
        if admin_count <= 1:
            raise HTTPException(400, detail="Es muss mindestens ein Admin im System verbleiben.")

    return await crud_user.update(db, user, user_in)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    user = await crud_user.get(db, user_id)
    if not user:
        raise HTTPException(404, detail=f"User with id {user_id} not found")

    if user.is_admin:
        admin_count = await crud_user.count_admins(db)
        if admin_count <= 1:
            raise HTTPException(400, detail="Der letzte Admin kann nicht gelöscht werden.")

    await crud_user.remove(db, user)


@router.post("/sync-ldap", status_code=status.HTTP_200_OK)
async def sync_ldap_users(
        db: AsyncSession = Depends(get_db)
):
    """
    Manuelle LDAP-Synchronisation durchführen.
    Synchronisiert alle LDAP-Lehrer mit der Datenbank.
    """
    if not settings.ldap_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LDAP ist nicht aktiviert"
        )

    try:
        stats = await ldap_service.sync_users(db)
        return {
            "message": "LDAP-Synchronisation erfolgreich",
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler bei LDAP-Synchronisation: {str(e)}"
        )
