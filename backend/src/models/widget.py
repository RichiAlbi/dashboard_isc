import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import String, Boolean
from db.session import Base

if TYPE_CHECKING:
    from models.user_widget import UserWidget


class Widget(Base):
    __tablename__ = "widgets"

    widget_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target: Mapped[str] = mapped_column(String, nullable=False)
    icon: Mapped[str] = mapped_column(String, nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False)
    default: Mapped[bool] = mapped_column(Boolean, nullable=False)

    users: Mapped[List["UserWidget"]] = relationship(
        "UserWidget", back_populates="widget", cascade="all, delete-orphan"
    )
