from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid
from typing import List, TYPE_CHECKING
from src.db.session import Base

if TYPE_CHECKING:
    from models.user_widget import UserWidget


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    theme: Mapped[str | None] = mapped_column(String, nullable=True)

    # Beziehungen
    widgets: Mapped[List["UserWidget"]] = relationship(
        "UserWidget", back_populates="user", cascade="all, delete-orphan"
    )
