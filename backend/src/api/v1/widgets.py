from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from src.schemas.widget import WidgetRead, WidgetCreate, WidgetUpdate
from src.schemas.user_widget import UserWidgetRead
from src.crud import widget as crud_widget
from src.crud import user_widget as crud_user_widget
from src.api.v1.deps import get_db

router = APIRouter(prefix="/widgets", tags=["widgets"])


@router.get("/", response_model=list[WidgetRead])
async def list_widgets(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0),
                       db: AsyncSession = Depends(get_db)):
    widgets = await crud_widget.get_multi(db, skip=offset, limit=limit)
    return widgets


@router.post("/", response_model=WidgetRead, status_code=status.HTTP_201_CREATED)
async def create_widget(widget_in: WidgetCreate, db: AsyncSession = Depends(get_db)):
    return await crud_widget.create(db, widget_in)


@router.put("/", response_model=list[WidgetRead])
async def bulk_update_widgets(updates: list[WidgetUpdate], db: AsyncSession = Depends(get_db)):
    try:
        updated_widgets = await crud_widget.bulk_update(db, updates)
        return updated_widgets
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{user_id}", response_model=list[UserWidgetRead])
async def get_user_widgets(user_id: UUID, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0),
                           db: AsyncSession = Depends(get_db)):
    rows = await crud_user_widget.list_for_user_with_widgets(db, user_id, skip=offset, limit=limit)
    # Transformiere Tupel (UserWidget, Widget) in Schema-Dicts
    resp = []
    for uw, w in rows:
        resp.append({
            "userId": uw.user_id,
            "widgetId": w.widget_id,
            "target": w.target,
            "icon": w.icon,
            "title": w.title,
            "color": w.color,
            "visible": uw.visible,
            "config": uw.config,
        })
    return resp
