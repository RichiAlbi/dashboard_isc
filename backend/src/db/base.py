# src/db/base.py
"""
Hier werden alle Models importiert, damit Alembic sie für Migrationen findet.
"""

from src.db.session import Base  # Async Declarative Base

from src.models.user import User  # noqa: F401
from src.models.widget import Widget  # noqa: F401
from src.models.user_widget import UserWidget  # noqa: F401
from src.models.news import News  # noqa: F401
