from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    display_name: Optional[str] = Field(None, alias="displayName")
    role: Optional[str] = None  # student, teacher, etc.
    class_name: Optional[str] = Field(None, alias="className")  # z.B. eeg24a
    is_active: Optional[bool] = Field(True, alias="isActive")
    theme: Optional[str] = None  # light|dark|system


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    display_name: Optional[str] = Field(None, alias="displayName")
    role: Optional[str] = None
    class_name: Optional[str] = Field(None, alias="className")
    is_active: Optional[bool] = Field(None, alias="isActive")
    theme: Optional[str] = None


class UserRead(UserBase):
    user_id: UUID = Field(alias="userId")
    from_ldap: bool = Field(False, alias="fromLdap")
    last_ldap_sync: Optional[datetime] = Field(None, alias="lastLdapSync")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class UserSearchQuery(BaseModel):
    q: Optional[str] = None
    limit: int = Field(50, ge=1, le=100)
    offset: int = Field(0, ge=0)
