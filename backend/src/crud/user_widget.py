from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, join
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.user_widget import UserWidget
from src.models.widget import Widget
from src.schemas.user_widget import UserWidgetCreate, UserWidgetUpdate


async def get(session: AsyncSession, user_id: UUID, widget_id: UUID) -> Optional[UserWidget]:
    stmt = select(UserWidget).where(
        UserWidget.user_id == user_id, UserWidget.widget_id == widget_id
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_for_user(session: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 50) -> List[UserWidget]:
    stmt = select(UserWidget).where(UserWidget.user_id == user_id).offset(skip).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def list_for_user_with_widgets(session: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 50) -> List[
    tuple[UserWidget, Widget]]:
    j = join(UserWidget, Widget, UserWidget.widget_id == Widget.widget_id)
    stmt = (
        select(UserWidget, Widget)
        .select_from(j)
        .where(UserWidget.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return result.all()


async def create(session: AsyncSession, obj_in: UserWidgetCreate) -> UserWidget:
    db_obj = UserWidget(
        user_id=obj_in.user_id,
        widget_id=obj_in.widget_id,
        visible=obj_in.visible,
        config=obj_in.config or {},
    )
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def update(session: AsyncSession, db_obj: UserWidget, obj_in: UserWidgetUpdate) -> UserWidget:
    data = obj_in.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(db_obj, field, value)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def remove(session: AsyncSession, db_obj: UserWidget) -> UserWidget:
    await session.delete(db_obj)
    await session.commit()
    return db_obj
