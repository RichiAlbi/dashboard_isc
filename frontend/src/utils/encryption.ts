/**
 * AES-256-GCM Verschlüsselung für Passwort-Übertragung
 * 
 * Nutzt die native Web Crypto API für sichere Verschlüsselung.
 * Der Schlüssel wird als Base64-kodierter 32-Byte Key erwartet.
 */

// Encryption Key aus Environment Variable
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || '';

/**
 * Prüft ob Verschlüsselung aktiviert ist
 */
export function isEncryptionEnabled(): boolean {
  return ENCRYPTION_KEY.length > 0;
}

/**
 * Konvertiert Base64 String zu Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Konvertiert Uint8Array zu Base64 String
 */
function bytesToBase64(bytes: Uint8Array): Uint8Array {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return new TextEncoder().encode(btoa(binary));
}

/**
 * Generiert eine zufällige 12-Byte Nonce für AES-GCM
 */
function generateNonce(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Importiert den AES-256 Schlüssel für die Verschlüsselung
 */
async function importKey(keyBase64: string): Promise<CryptoKey> {
  const keyBytes = base64ToBytes(keyBase64);
  
  if (keyBytes.length !== 32) {
    throw new Error(`Ungültige Schlüssellänge: ${keyBytes.length} bytes (erwartet: 32)`);
  }
  
  return await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
}

/**
 * Verschlüsselt ein Passwort mit AES-256-GCM
 * 
 * Format des Outputs: Base64(nonce + ciphertext + authTag)
 * - nonce: 12 bytes
 * - ciphertext: variable Länge
 * - authTag: 16 bytes (wird von Web Crypto an ciphertext angehängt)
 * 
 * @param password - Das zu verschlüsselnde Passwort
 * @returns Base64-kodierter verschlüsselter String oder das originale Passwort bei Fehler
 */
export async function encryptPassword(password: string): Promise<string> {
  // Wenn keine Verschlüsselung konfiguriert, gib Passwort unverschlüsselt zurück
  if (!isEncryptionEnabled()) {
    console.warn('Verschlüsselung nicht aktiviert - Passwort wird unverschlüsselt übertragen');
    return password;
  }
  
  try {
    // Key importieren
    const key = await importKey(ENCRYPTION_KEY);
    
    // Zufällige Nonce generieren
    const nonce = generateNonce();
    
    // Passwort zu Bytes konvertieren
    const passwordBytes = new TextEncoder().encode(password);
    
    // Mit AES-GCM verschlüsseln
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce.buffer as ArrayBuffer,
        tagLength: 128, // 16 bytes auth tag
      },
      key,
      passwordBytes
    );
    
    // Nonce + Ciphertext (inkl. AuthTag) zusammenfügen
    const ciphertextArray = new Uint8Array(ciphertext);
    const result = new Uint8Array(nonce.length + ciphertextArray.length);
    result.set(nonce, 0);
    result.set(ciphertextArray, nonce.length);
    
    // Zu Base64 konvertieren
    let binary = '';
    for (let i = 0; i < result.length; i++) {
      binary += String.fromCharCode(result[i]);
    }
    return btoa(binary);
    
  } catch (error) {
    console.error('Fehler bei Passwort-Verschlüsselung:', error);
    // Im Fehlerfall gib das Passwort unverschlüsselt zurück
    // Das Backend kann dann entscheiden wie es damit umgeht
    return password;
  }
}

/**
 * Hilfsfunktion: Prüft beim Backend ob Verschlüsselung erwartet wird
 * 
 * @param apiBaseUrl - Die Basis-URL der API
 * @returns Objekt mit encryptionEnabled und algorithm
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
