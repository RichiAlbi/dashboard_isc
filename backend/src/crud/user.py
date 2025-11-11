from typing import Optional, List
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.user import User
from src.schemas.user import UserCreate, UserUpdate


async def get(session: AsyncSession, user_id: UUID) -> Optional[User]:
    result = await session.execute(select(User).where(User.user_id == user_id))
    return result.scalar_one_or_none()


async def get_multi(session: AsyncSession, skip: int = 0, limit: int = 50, search: str | None = None) -> List[User]:
    stmt = select(User)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(User.theme.ilike(like))
    stmt = stmt.offset(skip).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def create(session: AsyncSession, obj_in: UserCreate) -> User:
    db_obj = User(theme=obj_in.theme)
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def update(session: AsyncSession, user: User, obj_in: UserUpdate) -> User:
    data = obj_in.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(user, field, value)
    await session.commit()
    await session.refresh(user)
    return user


async def remove(session: AsyncSession, user: User) -> User:
    await session.delete(user)
    await session.commit()
    return user
