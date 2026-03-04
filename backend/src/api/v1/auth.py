"""
Authentication API - LDAP Credential Verification
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging
from core.config import settings

from api.v1.deps import get_db
from services.ldap_service import ldap_service
from services.encryption_service import encryption_service
from crud import user as crud_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


class VerifyRequest(BaseModel):
    """Request body für Login-Verifizierung"""
    username: str
    password: str  # Kann verschlüsselt oder unverschlüsselt sein


class VerifyResponse(BaseModel):
    """Response für Login-Verifizierung"""
    success: bool
    message: str
    user: Optional[dict] = None


@router.get("/encryption-status")
async def get_encryption_status():
    """
    Gibt zurück ob Passwort-Verschlüsselung aktiviert ist.
    Das Frontend kann dies nutzen um zu entscheiden ob es verschlüsseln soll.
    """
    return {
        "encryptionEnabled": encryption_service.enabled,
        "algorithm": "AES-256-GCM" if encryption_service.enabled else None
    }


@router.post("/verify", response_model=VerifyResponse)
async def verify_credentials(
    request: VerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verifiziert Benutzer-Credentials gegen LDAP.
    
    Das Passwort kann verschlüsselt (AES-256-GCM, Base64) oder 
    unverschlüsselt übertragen werden. Bei aktivierter Verschlüsselung
    wird automatisch entschlüsselt.
    
    Gibt bei Erfolg die Benutzerdaten zurück, bei Fehler eine Fehlermeldung.
    """
    username = request.username
    password = request.password
    
    logger.info(f"Login-Versuch für Benutzer: {username}")
    
    # Prüfe ob LDAP aktiviert ist
    if not ldap_service.enabled:
        logger.warning("LDAP ist deaktiviert - Authentifizierung nicht möglich")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentifizierung nicht verfügbar (LDAP deaktiviert)"
        )
    
    # Passwort entschlüsseln falls Verschlüsselung aktiviert
    if encryption_service.enabled:
        logger.debug("Verschlüsseltes Passwort - entschlüssele...")
        decrypted_password = encryption_service.decrypt_password(password)
        
        if decrypted_password is None:
            logger.warning(f"Passwort-Entschlüsselung fehlgeschlagen für: {username}")
            return VerifyResponse(
                success=False,
                message="Fehler bei der Passwort-Verarbeitung"
            )
        
        password = decrypted_password
        logger.debug("Passwort erfolgreich entschlüsselt")
    
    # Verifiziere Credentials gegen LDAP
    is_valid = ldap_service.verify_credentials(username, password)
    
    if not is_valid:
        logger.warning(f"Login fehlgeschlagen für Benutzer: {username}")
        return VerifyResponse(
            success=False,
            message="Ungültige Anmeldedaten"
        )
    
    logger.info(f"Login erfolgreich für Benutzer: {username}")
    
    # Hole Benutzerdaten aus der Datenbank
    db_user = await crud_user.get_by_username(db, username)
    
    if db_user:
        user_data = {
            "userId": str(db_user.user_id),
            "username": db_user.username,
            "email": db_user.email,
            "firstName": db_user.first_name,
            "lastName": db_user.last_name,
            "isActive": db_user.is_active,
            "settings": db_user.settings,
            "isAdmin": db_user.is_admin,
        }
    else:
        # Benutzer existiert in LDAP aber nicht in DB - hole Daten aus LDAP
        ldap_user = ldap_service.get_user_by_username(username)
        user_data = {
            "userId": None,
            "username": username,
            "email": ldap_user.get("email") if ldap_user else None,
            "firstName": ldap_user.get("first_name") if ldap_user else None,
            "lastName": ldap_user.get("last_name") if ldap_user else None,
            "isActive": True,
            "settings": {},
            "isAdmin": False,
        }
    
    return VerifyResponse(
        success=True,
        message="Anmeldung erfolgreich",
        user=user_data
    )
