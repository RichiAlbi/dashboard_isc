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
 * Generiert einen zufälligen Salt-String
 */
function generateSalt(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < length; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

/**
 * XOR-Verschlüsselung eines Strings mit einem kombinierten Key (key + salt)
 */
function xorEncrypt(text: string, key: string, salt: string): string {
  const combinedKey = key + salt;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ combinedKey.charCodeAt(i % combinedKey.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

/**
 * Verschlüsselt ein Passwort mit XOR + Salt + Base64
 * 
 * Format: ENC:<salt>:<base64-encoded-xor-result>
 * - Salt wird bei jeder Verschlüsselung zufällig generiert
 * - Dadurch ist das Ergebnis jedes Mal anders
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
    // Zufälligen Salt generieren
    const salt = generateSalt(16);
    
    // XOR mit Key + Salt
    const encrypted = xorEncrypt(password, ENCRYPTION_KEY, salt);
    
    // Format: ENC:<salt>:<base64(encrypted)>
    return 'ENC:' + salt + ':' + btoa(encrypted);
    
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
