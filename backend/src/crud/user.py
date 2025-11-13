from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User
from schemas.user import UserCreate, UserUpdate


async def get(session: AsyncSession, user_id: UUID) -> Optional[User]:
    result = await session.execute(select(User).where(User.user_id == user_id))
    return result.scalar_one_or_none()


async def get_by_username(session: AsyncSession, username: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_multi(session: AsyncSession, skip: int = 0, limit: int = 50, search: str | None = None) -> List[User]:
    stmt = select(User)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            or_(
                User.username.ilike(like),
                User.email.ilike(like),
                User.display_name.ilike(like),
                User.first_name.ilike(like),
                User.last_name.ilike(like)
            )
        )
    stmt = stmt.offset(skip).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def create(session: AsyncSession, obj_in: UserCreate) -> User:
    db_obj = User(
        username=obj_in.username,
        email=obj_in.email,
        first_name=obj_in.first_name,
        last_name=obj_in.last_name,
        display_name=obj_in.display_name,
        is_active=obj_in.is_active if obj_in.is_active is not None else True,
        theme=obj_in.theme,
        from_ldap=False
    )
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
