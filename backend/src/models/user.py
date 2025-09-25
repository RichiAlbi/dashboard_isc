from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Boolean
from src.db.session import Base

class User(Base):
    __tablename__ = "users"

    userID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    mode: Mapped[str] = mapped_column(String(100), nullable=False)
    columnAmount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    weather: Mapped[bool] = mapped_column(Boolean, default=False)
    systemStartup: Mapped[bool] = mapped_column(Boolean, default=False)
