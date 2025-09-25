# src/db/base.py
"""
Hier werden alle Models importiert, damit Alembic sie für Migrationen findet.
"""

from src.db.session import Base  # Basis-Klasse für alle Models

# Importiere alle Models, die du in der DB haben möchtest
from src.models.user import User  # noqa: F401
