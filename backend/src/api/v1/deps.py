from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from db.session import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Async Dependency für DB-Session.
    """
    async with AsyncSessionLocal() as session:
        yield session

# TODO: Auth-Dependency für künftige LDAP/SSO-Integration
# from fastapi import Depends, HTTPException, status
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
#
# security = HTTPBearer()
#
# def get_current_user(
#     credentials: HTTPAuthorizationCredentials = Depends(security),
#     db: Session = Depends(get_db)
# ):
#     """
#     Placeholder für zukünftige Authentifizierung.
#     Validiert Bearer Token und gibt aktuellen User zurück.
#     """
#     # TODO: Token-Validierung gegen LDAP/SSO
#     raise HTTPException(
#         status_code=status.HTTP_501_NOT_IMPLEMENTED,
#         detail="Authentication not yet implemented"
#     )
