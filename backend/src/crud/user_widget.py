from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, join
from sqlalchemy.ext.asyncio import AsyncSession
from models.user_widget import UserWidget
from models.widget import Widget
from schemas.user_widget import UserWidgetCreate, UserWidgetUpdate


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


async def list_for_user_with_widgets(session: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 50, visible_only: bool = True) -> List[
    tuple[UserWidget, Widget]]:
    j = join(UserWidget, Widget, UserWidget.widget_id == Widget.widget_id)
    stmt = (
        select(UserWidget, Widget)
        .select_from(j)
        .where(UserWidget.user_id == user_id)
    )
    if visible_only:
        stmt = stmt.where(UserWidget.visible == True)
    stmt = stmt.offset(skip).limit(limit)
    result = await session.execute(stmt)
    return result.all()


async def list_hidden_for_user_with_widgets(session: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 50) -> List[
    tuple[UserWidget, Widget]]:
    """Get user widgets where visible=false (can be re-added)"""
    j = join(UserWidget, Widget, UserWidget.widget_id == Widget.widget_id)
    stmt = (
        select(UserWidget, Widget)
        .select_from(j)
        .where(UserWidget.user_id == user_id)
        .where(UserWidget.visible == False)
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
    data = obj_in.model_dump(exclude_unset=True, by_alias=False)
    # Remove widget_id from update data (it's a key, not updatable)
    data.pop("widget_id", None)
    for field, value in data.items():
        setattr(db_obj, field, value)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def remove(session: AsyncSession, db_obj: UserWidget) -> UserWidget:
    await session.delete(db_obj)
    await session.commit()
    return db_obj


async def bulk_update_for_user(session: AsyncSession, user_id: UUID, updates: List[UserWidgetUpdate]) -> List[UserWidget]:
    """
    Bulk update user widgets for a specific user (positions, visibility)
    Creates new rows if they don't exist, updates if they do
    """
    updated: List[UserWidget] = []
    try:
        for u in updates:
            # Try to get existing user_widget
            uw = await get(session, user_id, u.widget_id)

            if uw:
                # Update existing
                data = u.model_dump(exclude_unset=True, by_alias=False)
                data.pop("widget_id", None)
                for field, value in data.items():
                    setattr(uw, field, value)
                updated.append(uw)
            else:
                # Create new if doesn't exist
                uw = UserWidget(
                    user_id=user_id,
                    widget_id=u.widget_id,
                    visible=u.visible if u.visible is not None else True,
                    config=u.config if u.config is not None else {},
                )
                session.add(uw)
                updated.append(uw)

        await session.commit()
        for uw in updated:
            await session.refresh(uw)
        return updated
    except Exception:
        await session.rollback()
        raise


async def bulk_update(session: AsyncSession, updates: List[UserWidgetUpdate]) -> List[UserWidget]:
    """
    Deprecated: Use bulk_update_for_user instead
    Bulk update user widgets (positions, visibility)
    Creates new rows if they don't exist, updates if they do
    """
    updated: List[UserWidget] = []
    try:
        for u in updates:
            # This version doesn't have user_id in updates anymore
            # So we can't use it - keeping for backwards compatibility
            raise NotImplementedError("Use bulk_update_for_user with user_id from path")
    except Exception:
        await session.rollback()
        raise


async def initialize_user_widgets(session: AsyncSession, user_id: UUID, default_widgets: List) -> List[UserWidget]:
    """
    Initialize user_widget rows for a new user with all default widgets
    Calculates initial positions in a 3-column grid
    """
    created: List[UserWidget] = []
    try:
        for index, widget in enumerate(default_widgets):
            uw = UserWidget(
                user_id=user_id,
                widget_id=widget.widget_id,
                visible=True,
                config={"x": index % 3, "y": index // 3},
            )
            session.add(uw)
            created.append(uw)

        await session.commit()
        for uw in created:
            await session.refresh(uw)
        return created
    except Exception:
        await session.rollback()
        raise
