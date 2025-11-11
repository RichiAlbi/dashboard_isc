from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from typing import Optional


class UserBase(BaseModel):
    theme: Optional[str] = None  # light|dark|system


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    theme: Optional[str] = None


class UserRead(UserBase):
    user_id: UUID = Field(alias="userId")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class UserSearchQuery(BaseModel):
    q: Optional[str] = None
    limit: int = Field(50, ge=1, le=100)
    offset: int = Field(0, ge=0)
