from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from typing import Optional, TYPE_CHECKING
from db.session import Base

if TYPE_CHECKING:
    from models.user import User


class UserSettings(Base):
    """User-spezifische Einstellungen"""
    __tablename__ = "user_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    locale: Mapped[str] = mapped_column(String(10), nullable=False, default="de-DE")
    start_widget_ids: Mapped[Optional[list[uuid.UUID]]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=True
    )

    # Beziehungen
    user: Mapped["User"] = relationship("User", back_populates="user_settings")
