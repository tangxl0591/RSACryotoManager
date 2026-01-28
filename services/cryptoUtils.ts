import { KeySize, EncryptionAlgorithm } from '../types';

// Helper to convert ArrayBuffer to Base64
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Helper to convert Base64 to ArrayBuffer
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Convert exported key to PEM format
const exportKeyToPEM = (keyData: ArrayBuffer, type: 'PUBLIC' | 'PRIVATE'): string => {
  const base64 = arrayBufferToBase64(keyData);
  const typeStr = type === 'PUBLIC' ? 'PUBLIC KEY' : 'PRIVATE KEY';
  
  let pem = `-----BEGIN ${typeStr}-----\n`;
  let offset = 0;
  while (offset < base64.length) {
    pem += base64.substring(offset, offset + 64) + '\n';
    offset += 64;
  }
  pem += `-----END ${typeStr}-----\n`;
  return pem;
};

export const generateRSAKeyPair = async (size: KeySize): Promise<{ publicKey: string; privateKey: string }> => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: size,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exportedPublic = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const exportedPrivate = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: exportKeyToPEM(exportedPublic, 'PUBLIC'),
    privateKey: exportKeyToPEM(exportedPrivate, 'PRIVATE'),
  };
};

// HYBRID ENCRYPTION: AES-GCM + RSA (Private Encrypt Mode)
// 1. Generate AES key (128 or 256 bit)
// 2. Encrypt Data with AES-GCM
// 3. Encrypt AES Key with RSA PRIVATE Key (via Electron IPC)
// 4. Pack: [KeyLength(4)][EncryptedKey][IV(12)][EncryptedData]
export const encryptData = async (pemKey: string, data: ArrayBuffer, algorithm: EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM): Promise<ArrayBuffer> => {
  // Determine key length bits based on algorithm enum
  const aesKeyLength = algorithm === EncryptionAlgorithm.AES_128_GCM ? 128 : 256;

  // 1. Generate AES Key
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: aesKeyLength },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Encrypt Data with AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    data
  );

  // 3. Export AES Key
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  // 4. Wrap AES Key with RSA PRIVATE Key
  // Note: Web Crypto API RSA-OAEP does NOT support encrypting with Private Key.
  // We must use the Electron IPC bridge to Node.js crypto for this operation.
  if (!window.electronAPI) {
    throw new Error("Private Key Encryption is only supported in the Electron desktop app.");
  }

  // pemKey passed here should be the PRIVATE KEY
  const encryptedAesKey = await window.electronAPI.rsaPrivateEncrypt(pemKey, rawAesKey);

  // 5. Pack everything
  const keyLen = encryptedAesKey.byteLength;
  const totalLength = 4 + keyLen + iv.byteLength + encryptedData.byteLength;
  const resultBuffer = new Uint8Array(totalLength);
  const view = new DataView(resultBuffer.buffer);

  let offset = 0;
  // Write Key Length (4 bytes)
  view.setUint32(offset, keyLen, true); // Little endian
  offset += 4;
  
  // Write Encrypted AES Key
  resultBuffer.set(new Uint8Array(encryptedAesKey), offset);
  offset += keyLen;

  // Write IV
  resultBuffer.set(iv, offset);
  offset += iv.byteLength;

  // Write Encrypted Data
  resultBuffer.set(new Uint8Array(encryptedData), offset);

  return resultBuffer.buffer;
};

export const decryptData = async (pemKey: string, data: ArrayBuffer): Promise<ArrayBuffer> => {
  const view = new DataView(data);
  let offset = 0;

  // 1. Read Key Length
  if (data.byteLength < 4) throw new Error("Invalid file format");
  const keyLen = view.getUint32(offset, true);
  offset += 4;

  // 2. Extract Encrypted AES Key
  if (data.byteLength < offset + keyLen) throw new Error("Invalid file format");
  const encryptedAesKey = data.slice(offset, offset + keyLen);
  offset += keyLen;

  // 3. Extract IV
  const ivLen = 12;
  if (data.byteLength < offset + ivLen) throw new Error("Invalid file format");
  const iv = data.slice(offset, offset + ivLen);
  offset += ivLen;

  // 4. Extract Encrypted Data
  const encryptedData = data.slice(offset);

  // 5. Decrypt AES Key using RSA PUBLIC Key (Reverse operation)
  if (!window.electronAPI) {
      throw new Error("Public Key Decryption is only supported in the Electron desktop app.");
  }
  
  // pemKey passed here should be the PUBLIC KEY
  const rawAesKey = await window.electronAPI.rsaPublicDecrypt(pemKey, encryptedAesKey);

  // 6. Import AES Key (Length is inferred from raw key data)
  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    rawAesKey,
    "AES-GCM",
    false,
    ["decrypt"]
  );

  // 7. Decrypt Data
  return await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    aesKey,
    encryptedData
  );
};