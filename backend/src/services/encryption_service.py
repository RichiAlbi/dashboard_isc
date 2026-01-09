"""
Encryption Service für Passwort-Übertragung
Verwendet einfache XOR-Verschlüsselung mit Base64
"""
import base64
import logging
from typing import Optional

from core.config import settings

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    Service für XOR-Verschlüsselung/Entschlüsselung.
    
    Das Frontend verschlüsselt das Passwort mit XOR + Base64,
    das Backend entschlüsselt es wieder.
    
    Format der verschlüsselten Daten: ENC:<base64(xor_encrypted)>
    """
    
    ENCRYPTED_PREFIX = "ENC:"
    
    def __init__(self):
        self.enabled = False
        self.key = ""
        
        if not settings.encryption_key:
            logger.warning("ENCRYPTION_KEY nicht gesetzt - Passwort-Verschlüsselung deaktiviert!")
            return
        
        self.key = settings.encryption_key
        self.enabled = True
        logger.info("Passwort-Verschlüsselung aktiviert (XOR)")
    
    def _xor_decrypt(self, encrypted: str) -> str:
        """XOR-Entschlüsselung mit dem Key"""
        result = []
        for i, char in enumerate(encrypted):
            key_char = self.key[i % len(self.key)]
            result.append(chr(ord(char) ^ ord(key_char)))
        return ''.join(result)
    
    def is_encrypted(self, data: str) -> bool:
        """Prüft ob die Daten verschlüsselt sind (beginnen mit ENC:)"""
        return data.startswith(self.ENCRYPTED_PREFIX)
    
    def decrypt_password(self, encrypted_data: str) -> Optional[str]:
        """
        Entschlüsselt ein vom Frontend verschlüsseltes Passwort.
        
        Args:
            encrypted_data: "ENC:<base64>" oder Klartext-Passwort
            
        Returns:
            Das entschlüsselte Passwort oder None bei Fehler
        """
        # Wenn nicht verschlüsselt, gib unverändert zurück
        if not self.is_encrypted(encrypted_data):
            return encrypted_data
        
        if not self.enabled:
            logger.warning("Verschlüsselung nicht aktiviert - kann nicht entschlüsseln")
            return None
        
        try:
            # Prefix entfernen und Base64 dekodieren
            base64_data = encrypted_data[len(self.ENCRYPTED_PREFIX):]
            decoded = base64.b64decode(base64_data).decode('latin-1')
            
            # XOR-Entschlüsselung
            password = self._xor_decrypt(decoded)
            
            return password
            
        except Exception as e:
            logger.error(f"Fehler bei Passwort-Entschlüsselung: {e}")
            return None


# Singleton-Instanz
encryption_service = EncryptionService()
