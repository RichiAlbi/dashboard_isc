from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from typing import List, TYPE_CHECKING
from datetime import datetime
from db.session import Base

if TYPE_CHECKING:
    from models.user_widget import UserWidget


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str | None] = mapped_column(String, nullable=True, unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    first_name: Mapped[str | None] = mapped_column(String, nullable=True)
    last_name: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    from_ldap: Mapped[bool] = mapped_column(Boolean, default=False)
    last_ldap_sync: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    # Beziehungen
    widgets: Mapped[List["UserWidget"]] = relationship(
        "UserWidget", back_populates="user", cascade="all, delete-orphan"
    )
