import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import Boolean, ForeignKey
from src.db.session import Base


class UserWidget(Base):
    __tablename__ = "user_widgets"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id"), primary_key=True)
    widget_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("widgets.widget_id"), primary_key=True)
    visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    user = relationship("User", back_populates="widgets")
    widget = relationship("Widget", back_populates="users")
