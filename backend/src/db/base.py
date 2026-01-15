# src/db/base.py
"""
Hier werden alle Models importiert, damit Alembic sie für Migrationen findet.
"""

from db.session import Base  # Async Declarative Base

from models.user import User  # noqa: F401
from models.widget import Widget  # noqa: F401
from models.user_widget import UserWidget  # noqa: F401
from models.news import News  # noqa: F401
