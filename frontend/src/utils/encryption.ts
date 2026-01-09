/**
 * Einfache XOR-Verschlüsselung für Passwort-Übertragung
 * 
 * Funktioniert ohne Web Crypto API (auch über HTTP).
 * Der Schlüssel wird als Base64-kodierter String erwartet.
 * 
 * HINWEIS: Dies ist KEINE sichere Verschlüsselung! 
 * Für echte Sicherheit sollte HTTPS verwendet werden.
 */

// Encryption Key aus Runtime Config (Docker) oder Environment Variable (dev)
const getEncryptionKey = (): string => {
  // Check for runtime config (injected by Docker at container start)
  if (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__?.VITE_ENCRYPTION_KEY) {
    return (window as any).__RUNTIME_CONFIG__.VITE_ENCRYPTION_KEY;
  }
  // Fallback to Vite env variable (for local development)
  return import.meta.env.VITE_ENCRYPTION_KEY || '';
};

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Prüft ob Verschlüsselung aktiviert ist
 */
export function isEncryptionEnabled(): boolean {
  return ENCRYPTION_KEY.length > 0;
}

/**
 * XOR-Verschlüsselung eines Strings mit einem Key
 */
function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

/**
 * Verschlüsselt ein Passwort mit XOR + Base64
 * 
 * Format: ENC:<base64-encoded-xor-result>
 * 
 * @param password - Das zu verschlüsselnde Passwort
 * @returns Verschlüsselter String oder das originale Passwort wenn Verschlüsselung deaktiviert
 */
export function encryptPassword(password: string): string {
  // Wenn keine Verschlüsselung konfiguriert, gib Passwort unverschlüsselt zurück
  if (!isEncryptionEnabled()) {
    console.warn('Verschlüsselung nicht aktiviert - Passwort wird unverschlüsselt übertragen');
    return password;
  }
  
  try {
    // XOR mit dem Key
    const encrypted = xorEncrypt(password, ENCRYPTION_KEY);
    
    // Base64 kodieren und Prefix hinzufügen
    return 'ENC:' + btoa(encrypted);
    
  } catch (error) {
    console.error('Fehler bei Passwort-Verschlüsselung:', error);
    return password;
  }
}

/**
 * Hilfsfunktion: Prüft beim Backend ob Verschlüsselung erwartet wird
 */
export async function checkServerEncryption(apiBaseUrl: string): Promise<{
  encryptionEnabled: boolean;
  algorithm: string | null;
}> {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/encryption-status`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Konnte Verschlüsselungs-Status nicht abrufen:', error);
  }
  
  return { encryptionEnabled: false, algorithm: null };
}
