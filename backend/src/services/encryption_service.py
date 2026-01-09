"""
Encryption Service für sichere Passwort-Übertragung
Verwendet AES-256-GCM für symmetrische Verschlüsselung
"""
import base64
import logging
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from core.config import settings

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    Service für AES-256-GCM Verschlüsselung/Entschlüsselung.
    
    Das Frontend verschlüsselt das Passwort mit dem Shared Key,
    das Backend entschlüsselt es wieder.
    
    Format der verschlüsselten Daten: base64(nonce + ciphertext + tag)
    - nonce: 12 bytes (zufällig generiert vom Frontend)
    - ciphertext: verschlüsseltes Passwort
    - tag: 16 bytes (GCM authentication tag, automatisch angehängt)
    """
    
    def __init__(self):
        self.enabled = False
        self.aesgcm: Optional[AESGCM] = None
        
        if not settings.encryption_key:
            logger.warning("ENCRYPTION_KEY nicht gesetzt - Passwort-Verschlüsselung deaktiviert!")
            return
        
        try:
            # Key aus Base64 dekodieren
            key_bytes = base64.b64decode(settings.encryption_key)
            
            if len(key_bytes) != 32:
                logger.error(f"ENCRYPTION_KEY muss 32 Bytes sein (AES-256), ist aber {len(key_bytes)} Bytes")
                return
            
            self.aesgcm = AESGCM(key_bytes)
            self.enabled = True
            logger.info("Passwort-Verschlüsselung aktiviert (AES-256-GCM)")
            
        except Exception as e:
            logger.error(f"Fehler beim Initialisieren der Verschlüsselung: {e}")
    
    def decrypt_password(self, encrypted_data: str) -> Optional[str]:
        """
        Entschlüsselt ein vom Frontend verschlüsseltes Passwort.
        
        Args:
            encrypted_data: Base64-kodierte Daten (nonce + ciphertext + tag)
            
        Returns:
            Das entschlüsselte Passwort oder None bei Fehler
        """
        if not self.enabled or not self.aesgcm:
            logger.warning("Verschlüsselung nicht aktiviert - gebe Daten unverändert zurück")
            return encrypted_data
        
        try:
            # Base64 dekodieren
            data = base64.b64decode(encrypted_data)
            
            # Nonce extrahieren (erste 12 Bytes)
            if len(data) < 12:
                logger.error("Verschlüsselte Daten zu kurz")
                return None
            
            nonce = data[:12]
            ciphertext_with_tag = data[12:]
            
            # Entschlüsseln
            plaintext = self.aesgcm.decrypt(nonce, ciphertext_with_tag, None)
            
            return plaintext.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Fehler beim Entschlüsseln: {e}")
            return None
    
    def is_encrypted(self, data: str) -> bool:
        """
        Prüft ob die Daten verschlüsselt aussehen (Base64 mit Mindestlänge).
        """
        if not data:
            return False
        
        try:
            decoded = base64.b64decode(data)
            # Mindestens 12 (nonce) + 16 (tag) + 1 (min ciphertext) = 29 bytes
            return len(decoded) >= 29
        except Exception:
            return False


# Singleton-Instanz
encryption_service = EncryptionService()
