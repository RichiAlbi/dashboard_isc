from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from typing import Optional


class WidgetBase(BaseModel):
    target: str
    icon: str
    title: str
    color: str
    default: bool = False


class WidgetCreate(WidgetBase):
    pass


class WidgetUpdate(BaseModel):
    widget_id: UUID = Field(alias="widgetId")
    target: Optional[str] = None
    icon: Optional[str] = None
    title: Optional[str] = None
    color: Optional[str] = None
    default: Optional[bool] = None


class WidgetBulkUpdate(BaseModel):
    widgets: list[WidgetUpdate]


class WidgetRead(WidgetBase):
    widget_id: UUID = Field(alias="widgetId")
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
