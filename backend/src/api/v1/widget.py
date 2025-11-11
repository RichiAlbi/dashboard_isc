from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from src.schemas.widget import WidgetRead, WidgetUpdate
from src.crud import widget as crud_widget
from src.api.v1.deps import get_db

router = APIRouter(prefix="/widget", tags=["widgets"])


@router.put("/{widget_id}", response_model=WidgetRead)
async def update_widget(
        widget_id: UUID,
        widget_in: WidgetUpdate,
        db: AsyncSession = Depends(get_db)
):
    """Einzelnes Widget aktualisieren"""
    widget = await crud_widget.get(db, widget_id)
    if not widget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Widget with id {widget_id} not found"
        )
    # Sicherstellen dass widget_id im Schema vorhanden ist für Konsistenz
    widget_in_dict = widget_in.model_dump(exclude_unset=True)
    widget_in_dict["widget_id"] = widget_id
    widget_in = WidgetUpdate(**widget_in_dict)
    return await crud_widget.update(db, widget, widget_in)


@router.delete("/{widget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_widget(
        widget_id: UUID,
        db: AsyncSession = Depends(get_db)
):
    """Widget löschen"""
    widget = await crud_widget.get(db, widget_id)
    if not widget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Widget with id {widget_id} not found"
        )
    await crud_widget.remove(db, widget)
