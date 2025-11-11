from typing import Optional, List
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.news import News
from src.schemas.news import NewsCreate, NewsUpdate


async def get(session: AsyncSession, news_id: UUID) -> Optional[News]:
    result = await session.execute(select(News).where(News.news_id == news_id))
    return result.scalar_one_or_none()


async def get_multi(session: AsyncSession, skip: int = 0, limit: int = 50) -> List[News]:
    stmt = select(News).offset(skip).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def create(session: AsyncSession, obj_in: NewsCreate) -> News:
    db_obj = News(**obj_in.model_dump())
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def update(session: AsyncSession, db_obj: News, obj_in: NewsUpdate) -> News:
    data = obj_in.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(db_obj, field, value)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def remove(session: AsyncSession, db_obj: News) -> News:
    await session.delete(db_obj)
    await session.commit()
    return db_obj
