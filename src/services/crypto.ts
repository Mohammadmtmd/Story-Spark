/**
 * Client-Side Hardware Encryption using Web Crypto API (AES-GCM 256-bit)
 * Safely encrypts and decrypts API keys before storing in localStorage / IndexedDB.
 */

const KEY_DB_NAME = 'storyspark_crypto_db';
const KEY_STORE_NAME = 'crypto_keys';
const MASTER_KEY_ID = 'device_master_key';

// Helper to open IndexedDB for key storage
function openKeyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(KEY_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
        db.createObjectStore(KEY_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Retrieve or generate non-exportable hardware CryptoKey
async function getDeviceMasterKey(): Promise<CryptoKey> {
  const db = await openKeyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE_NAME, 'readonly');
    const store = tx.objectStore(KEY_STORE_NAME);
    const getReq = store.get(MASTER_KEY_ID);

    getReq.onsuccess = async () => {
      if (getReq.result) {
        resolve(getReq.result as CryptoKey);
      } else {
        // Generate new AES-GCM 256-bit key
        try {
          const newKey = await window.crypto.subtle.generateKey(
            {
              name: 'AES-GCM',
              length: 256,
            },
            false, // non-extractable for security
            ['encrypt', 'decrypt']
          );

          const writeTx = db.transaction(KEY_STORE_NAME, 'readwrite');
          writeTx.objectStore(KEY_STORE_NAME).put(newKey, MASTER_KEY_ID);
          writeTx.oncomplete = () => resolve(newKey);
          writeTx.onerror = () => reject(writeTx.error);
        } catch (err) {
          reject(err);
        }
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Encrypt plaintext string to AES-GCM base64 format with 96-bit initialization vector
 */
export async function encryptApiKey(plainText: string): Promise<string> {
  if (!plainText) return '';
  try {
    const key = await getDeviceMasterKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      data
    );

    // Pack IV + ciphertext into combined Uint8Array
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Convert to binary string then base64
    let binary = '';
    const len = combined.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error('Encryption failed:', err);
    return plainText; // Fallback to raw if crypto fails
  }
}

/**
 * Decrypt AES-GCM base64 string using device master key
 */
export async function decryptApiKey(encryptedBase64: string): Promise<string> {
  if (!encryptedBase64) return '';
  try {
    const key = await getDeviceMasterKey();
    const binary = atob(encryptedBase64);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    // Extract 12-byte IV and ciphertext
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (err) {
    console.error('Decryption failed, might be unencrypted string:', err);
    return encryptedBase64;
  }
}
