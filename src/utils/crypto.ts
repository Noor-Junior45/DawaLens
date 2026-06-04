/**
 * DawaLens Cryptographic Engine
 * Provides native client-side End-to-End Encryption (E2EE) using AES-GCM 256-bit.
 * Decryption key remains isolated in the user's localized device storage.
 */

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates a high-entropy 256-bit symmetric AES-GCM key.
 */
export async function generateMasterE2EEKey(): Promise<string> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await window.crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

/**
 * Imports a raw Base64 key string into a CryptoKey object.
 */
export async function importMasterKey(rawBase64: string): Promise<CryptoKey> {
  const rawBuffer = base64ToArrayBuffer(rawBase64);
  return await window.crypto.subtle.importKey(
    'raw',
    rawBuffer,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string using AES-GCM with a user-bound CryptoKey.
 */
export async function encryptField(plainText: string, cryptoKey: CryptoKey): Promise<{ cypherText: string; iv: string }> {
  if (!plainText) return { cypherText: '', iv: '' };
  
  const enc = new TextEncoder();
  const encodedText = enc.encode(plainText);
  
  // Initialization Vector: 12-byte random salt for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    cryptoKey,
    encodedText
  );

  return {
    cypherText: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypts a string of ciphertext using AES-GCM and initialization vector.
 */
export async function decryptField(cypherText: string, ivBase64: string, cryptoKey: CryptoKey): Promise<string> {
  if (!cypherText || !ivBase64) return '';
  
  try {
    const cypherBuffer = base64ToArrayBuffer(cypherText);
    const ivBuffer = base64ToArrayBuffer(ivBase64);
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuffer),
      },
      cryptoKey,
      cypherBuffer
    );
    
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    console.error('Failed to decrypt field (invalid key or tampered data):', error);
    return '[Decryption Failed: Device Key Mismatch]';
  }
}
