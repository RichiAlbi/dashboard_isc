from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from schemas.widget import WidgetRead, WidgetCreate, WidgetUpdate
from schemas.user_widget import UserWidgetRead, UserWidgetUpdate, UserWidgetBulkUpdate
from crud import widget as crud_widget
from crud import user_widget as crud_user_widget
from api.v1.deps import get_db

router = APIRouter(prefix="/widgets", tags=["widgets"])


@router.get("/", response_model=list[WidgetRead])
async def list_widgets(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    default: bool | None = Query(None, description="Filter widgets by default status"),
    db: AsyncSession = Depends(get_db)
):
    widgets = await crud_widget.get_multi(db, skip=offset, limit=limit, default=default)
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
async def get_user_widgets(
        user_id: UUID,
        limit: int = Query(50, ge=1, le=100),
        offset: int = Query(0, ge=0),
        db: AsyncSession = Depends(get_db)
):
    await crud_user_widget.cleanup_orphan_user_widgets(db, user_id)
    await crud_user_widget.sync_missing_user_widgets(db, user_id)

    rows = await crud_user_widget.list_for_user_with_widgets(
        db, user_id, skip=offset, limit=limit, visible_only=True
    )

    return [{
        "userId": uw.user_id,
        "widgetId": w.widget_id,
        "target": w.target,
        "icon": w.icon,
        "title": w.title,
        "color": w.color,
        "default": w.default,
        "allow_iframe": w.allow_iframe,
        "visible": uw.visible,
        "config": uw.config,
    } for uw, w in rows]



@router.get("/{user_id}/hidden", response_model=list[UserWidgetRead])
async def get_hidden_user_widgets(
        user_id: UUID,
        limit: int = Query(50, ge=1, le=100),
        offset: int = Query(0, ge=0),
        db: AsyncSession = Depends(get_db)
):
    await crud_user_widget.cleanup_orphan_user_widgets(db, user_id)
    await crud_user_widget.sync_missing_user_widgets(db, user_id)

    rows = await crud_user_widget.list_hidden_for_user_with_widgets(
        db, user_id, skip=offset, limit=limit
    )

    return [{
        "userId": uw.user_id,
        "widgetId": w.widget_id,
        "target": w.target,
        "icon": w.icon,
        "title": w.title,
        "color": w.color,
        "default": w.default,
        "allow_iframe": w.allow_iframe,
        "visible": uw.visible,
        "config": uw.config,
    } for uw, w in rows]



@router.put("/{user_id}", response_model=list[UserWidgetRead])
async def bulk_update_user_widgets(user_id: UUID, payload: UserWidgetBulkUpdate, db: AsyncSession = Depends(get_db)):
    """
    Bulk update user widget positions and visibility for a specific user.
    Creates new rows if they don't exist, updates if they do.
    Used for saving widget layout changes.
    """
    try:
        updated = await crud_user_widget.bulk_update_for_user(db, user_id, payload.widgets)

        # Transform to response format by joining with widget data
        resp = []
        for uw in updated:
            widget = await crud_widget.get(db, uw.widget_id)
            if widget:
                resp.append({
                    "userId": uw.user_id,
                    "widgetId": widget.widget_id,
                    "target": widget.target,
                    "icon": widget.icon,
                    "title": widget.title,
                    "color": widget.color,
                    "default": widget.default,
                    "allow_iframe": widget.allow_iframe,
                    "visible": uw.visible,
                    "config": uw.config,
                })
        return resp
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
