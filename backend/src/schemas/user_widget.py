from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from typing import Optional, List


class UserWidgetBase(BaseModel):
    visible: bool = True
    config: dict = {}
    model_config = ConfigDict(populate_by_name=True)


class UserWidgetCreate(UserWidgetBase):
    user_id: UUID = Field(alias="userId")
    widget_id: UUID = Field(alias="widgetId")
    model_config = ConfigDict(populate_by_name=True)


class UserWidgetUpdate(BaseModel):
    """Update for a single user widget - widgetId required, userId from path"""
    widget_id: UUID = Field(alias="widgetId")
    visible: Optional[bool] = None
    config: Optional[dict] = None

    model_config = ConfigDict(populate_by_name=True)


class UserWidgetBulkUpdate(BaseModel):
    """Bulk update payload - list of widget updates"""
    widgets: List[UserWidgetUpdate]

    model_config = ConfigDict(populate_by_name=True)


class UserWidgetRead(BaseModel):
    user_id: UUID = Field(alias="userId")
    widget_id: UUID = Field(alias="widgetId")
    target: str
    icon: str
    title: str
    color: str
    default: bool
    allow_iframe: bool
    visible: bool
    config: dict
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
