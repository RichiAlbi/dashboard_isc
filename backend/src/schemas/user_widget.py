from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from typing import Optional


class UserWidgetBase(BaseModel):
    visible: bool = True
    config: dict = {}


class UserWidgetCreate(UserWidgetBase):
    user_id: UUID = Field(alias="userId")
    widget_id: UUID = Field(alias="widgetId")


class UserWidgetUpdate(BaseModel):
    user_id: UUID = Field(alias="userId")
    widget_id: UUID = Field(alias="widgetId")
    visible: Optional[bool] = None
    config: Optional[dict] = None

    model_config = ConfigDict(populate_by_name=True)


class UserWidgetRead(BaseModel):
    user_id: UUID = Field(alias="userId")
    widget_id: UUID = Field(alias="widgetId")
    target: str
    icon: str
    title: str
    color: str
    visible: bool
    config: dict
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
