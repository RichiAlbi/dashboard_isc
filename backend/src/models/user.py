from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
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
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[str | None] = mapped_column(String, nullable=True)  # z.B. "student", "teacher"
    class_name: Mapped[str | None] = mapped_column(String, nullable=True)  # z.B. "eeg24a"
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    from_ldap: Mapped[bool] = mapped_column(Boolean, default=False)
    last_ldap_sync: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    theme: Mapped[str | None] = mapped_column(String, nullable=True)

    # Beziehungen
    widgets: Mapped[List["UserWidget"]] = relationship(
        "UserWidget", back_populates="user", cascade="all, delete-orphan"
    )
