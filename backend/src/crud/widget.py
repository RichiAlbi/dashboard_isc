from typing import Optional, List
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.widget import Widget
from schemas.widget import WidgetCreate, WidgetUpdate


async def get(session: AsyncSession, widget_id: UUID) -> Optional[Widget]:
    result = await session.execute(select(Widget).where(Widget.widget_id == widget_id))
    return result.scalar_one_or_none()


async def get_multi(session: AsyncSession, skip: int = 0, limit: int = 50) -> List[Widget]:
    stmt = select(Widget).offset(skip).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def create(session: AsyncSession, obj_in: WidgetCreate) -> Widget:
    db_obj = Widget(**obj_in.model_dump())
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def update(session: AsyncSession, widget: Widget, obj_in: WidgetUpdate) -> Widget:
    data = obj_in.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(widget, field, value)
    await session.commit()
    await session.refresh(widget)
    return widget


async def bulk_update(session: AsyncSession, updates: List[WidgetUpdate]) -> List[Widget]:
    updated: List[Widget] = []
    try:
        for u in updates:
            w = await get(session, u.widget_id)
            if not w:
                continue
            data = u.model_dump(exclude_unset=True)
            data.pop("widget_id", None)
            for field, value in data.items():
                setattr(w, field, value)
            updated.append(w)
        await session.commit()
        for w in updated:
            await session.refresh(w)
        return updated
    except Exception:
        await session.rollback()
        raise


async def remove(session: AsyncSession, widget: Widget) -> Widget:
    await session.delete(widget)
    await session.commit()
    return widget
