from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from schemas.news import NewsRead, NewsCreate, NewsUpdate
from crud import news as crud_news
from api.v1.deps import get_db

router = APIRouter(prefix="/newsfeed", tags=["newsfeed"])


@router.get("/", response_model=list[NewsRead])
async def list_news(
        limit: int = Query(50, ge=1, le=100),
        offset: int = Query(0, ge=0),
        db: AsyncSession = Depends(get_db),
):
    items = await crud_news.get_multi(db, skip=offset, limit=limit)
    return items


@router.post("/", response_model=NewsRead, status_code=status.HTTP_201_CREATED)
async def create_news(
        news_in: NewsCreate,
        db: AsyncSession = Depends(get_db),
):
    return await crud_news.create(db, news_in)


@router.get("/{news_id}", response_model=NewsRead)
async def get_news(
        news_id: UUID,
        db: AsyncSession = Depends(get_db),
):
    item = await crud_news.get(db, news_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News item not found")
    return item


@router.put("/{news_id}", response_model=NewsRead)
async def update_news(
        news_id: UUID,
        news_in: NewsUpdate,
        db: AsyncSession = Depends(get_db),
):
    item = await crud_news.get(db, news_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News item not found")
    return await crud_news.update(db, item, news_in)


@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_news(
        news_id: UUID,
        db: AsyncSession = Depends(get_db),
):
    item = await crud_news.get(db, news_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News item not found")
    await crud_news.remove(db, item)
