"""
Encryption Service für Passwort-Übertragung
Verwendet XOR-Verschlüsselung + Base64
"""
import base64
import logging
from typing import Optional

from core.config import settings

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    Service für XOR-Verschlüsselung/Entschlüsselung.
    
    Das Frontend verschlüsselt das Passwort mit XOR (Key) + Base64,
    das Backend entschlüsselt es wieder.
    """
    
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
        """XOR-Entschlüsselung mit Key"""
        result = []
        for i, char in enumerate(encrypted):
            key_char = self.key[i % len(self.key)]
            result.append(chr(ord(char) ^ ord(key_char)))
        return ''.join(result)
    
    def decrypt_password(self, encrypted_data: str) -> Optional[str]:
        """
        Entschlüsselt ein vom Frontend verschlüsseltes Passwort.
        
        Args:
            encrypted_data: Base64-kodierte XOR-verschlüsselte Daten
            
        Returns:
            Das entschlüsselte Passwort oder None bei Fehler
        """
        if not self.enabled:
            logger.warning("Verschlüsselung nicht aktiviert - gebe unverändert zurück")
            return encrypted_data
        
        try:
            # Base64 dekodieren
            decoded = base64.b64decode(encrypted_data).decode('latin-1')
            
            # XOR-Entschlüsselung mit Key
            password = self._xor_decrypt(decoded)
            
            return password
            
        except Exception as e:
            logger.error(f"Fehler bei Passwort-Entschlüsselung: {e}")
            return None


# Singleton-Instanz
encryption_service = EncryptionService()
