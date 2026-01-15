from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID


class NewsBase(BaseModel):
    title: str
    description: str


class NewsCreate(NewsBase):
    pass


class NewsUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class NewsRead(NewsBase):
    news_id: UUID = Field(alias="newsId")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
