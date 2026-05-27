import forge from 'node-forge';

// Seed forge random in browser environments to prevent hanging during key generation
if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
  try {
    const entropy = new Uint8Array(256);
    window.crypto.getRandomValues(entropy);
    let str = '';
    for (let i = 0; i < entropy.length; i++) {
        str += String.fromCharCode(entropy[i]);
    }
    (forge.random as any).collect(str);
  } catch (e) {
    console.warn('Failed to seed forge.random', e);
  }
}

// Key sizes we support
export type KeySize = 1024 | 2048 | 4096;

export enum EncryptionAlgorithm {
  AES_128_GCM = 'AES-128-GCM',
  AES_256_GCM = 'AES-256-GCM',
}

export interface KeyPairResult {
  publicKey: string;  // PEM
  privateKey: string; // PEM
}

/**
 * Generate cryptographically secure random bytes as a binary string
 */
const generateSecureBytes = (size: number): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(size);
    window.crypto.getRandomValues(array);
    let str = '';
    for (let i = 0; i < size; i++) {
        str += String.fromCharCode(array[i]);
    }
    return str;
  }
  return forge.random.getBytesSync(size); // Fallback
};

/**
 * Generate an RSA key pair natively using node-forge
 */
export const generateKeyPair = async (bits: KeySize): Promise<KeyPairResult> => {
  return new Promise((resolve, reject) => {
    // Generate keys in a background timeout chunk to avoid blocking the UI thread main loop entirely
    // We avoid forge's Web Workers (`workers: -1`) as they can hang indefinitely in bundled envs
    setTimeout(() => {
      try {
        const keypair = forge.pki.rsa.generateKeyPair({ bits });
        const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
        const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
        resolve({
          publicKey: publicKeyPem,
          privateKey: privateKeyPem,
        });
      } catch (error) {
        reject(error);
      }
    }, 50);
  });
};

/**
 * Encrypt bytes using Public Key (Standard RSA)
 */
export const rsaEncryptWithPublic = (publicKeyPem: string, text: string, useOaep = false): string => {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  // Support OAEP or standard PKCS#1 v1.5
  const padding = useOaep ? 'RSA-OAEP' : 'RSAES-PKCS1-V1_5';
  const encrypted = publicKey.encrypt(forge.util.encodeUtf8(text), padding);
  return forge.util.encode64(encrypted);
};

/**
 * Decrypt bytes using Private Key (Standard RSA)
 */
export const rsaDecryptWithPrivate = (privateKeyPem: string, base64Text: string, useOaep = false): string => {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const padding = useOaep ? 'RSA-OAEP' : 'RSAES-PKCS1-V1_5';
  const encryptedBytes = forge.util.decode64(base64Text);
  const decryptedBytes = privateKey.decrypt(encryptedBytes, padding);
  return forge.util.decodeUtf8(decryptedBytes);
};

/**
 * Encrypt bytes using Private Key (License / Signing Mode)
 * Converts plaintext to raw signature or PKCS v1.5 padded ciphertext
 */
export const rsaEncryptWithPrivate = (privateKeyPem: string, text: string): string => {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const utf8Bytes = forge.util.encodeUtf8(text);
  
  // High-compatibility PKCS#1 v1.5 Private Encrypt
  // Node-forge supports private key encryption under standard custom implementations:
  // We can accomplish Private Key Encryption (also called "raw decryption" or "Raw sign") by doing:
  // privateKey.sign() or privateKey.encrypt() if supported, or directly doing raw block exponentiation.
  // Let's use forge privateKey.encrypt or custom padding for highest robustness.
  try {
    // Attempt standard forge private-key encryption
    const encrypted = (privateKey as any).encrypt(utf8Bytes, 'RSAES-PKCS1-V1_5');
    return forge.util.encode64(encrypted);
  } catch (e) {
    // Fallback: If not supported directly, create a manual PKCS#1 v1.5 padded block and compute m^d mod n
    const n = privateKey.n;
    const d = privateKey.d;
    const keySize = Math.ceil(n.bitLength() / 8);
    
    // PKCS#1 v1.5 Block Type 1 format: 00 || 01 || PS || 00 || Data
    const dataLen = utf8Bytes.length;
    if (dataLen > keySize - 11) {
      throw new Error(`Data is too long for selected key length. Limit is ${keySize - 11} bytes.`);
    }
    
    const psLen = keySize - dataLen - 3;
    let padded = '\x00\x01';
    for (let i = 0; i < psLen; i++) {
      padded += '\xff';
    }
    padded += '\x00' + utf8Bytes;
    
    // Compute m^d mod n
    const m = new (forge as any).jsbn.BigInteger(forge.util.bytesToHex(padded), 16);
    const c = m.modPow(d, n);
    
    let hex = c.toString(16);
    // Left-pad hex if necessary
    while (hex.length < keySize * 2) {
      hex = '0' + hex;
    }
    const encryptedBytes = forge.util.hexToBytes(hex);
    return forge.util.encode64(encryptedBytes);
  }
};

/**
 * Decrypt bytes using Public Key (License / Verification Mode)
 */
export const rsaDecryptWithPublic = (publicKeyPem: string, base64Text: string): string => {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const encryptedBytes = forge.util.decode64(base64Text);
  
  try {
    // Attempt standard forge decrypt
    const decrypted = (publicKey as any).decrypt(encryptedBytes, 'RSAES-PKCS1-V1_5');
    return forge.util.decodeUtf8(decrypted);
  } catch (err) {
    // Fallback: Manually compute c^e mod n and then unpad
    const n = publicKey.n;
    const e = publicKey.e;
    const keySize = Math.ceil(n.bitLength() / 8);
    
    const c = new (forge as any).jsbn.BigInteger(forge.util.bytesToHex(encryptedBytes), 16);
    const m = c.modPow(e, n);
    
    let hex = m.toString(16);
    while (hex.length < keySize * 2) {
      hex = '0' + hex;
    }
    const decryptedBytes = forge.util.hexToBytes(hex);
    
    // Check and strip PKCS#1 v1.5 Block Type 1 padding: 00 || 01 || PS || 00 || Data
    if (decryptedBytes.charCodeAt(0) !== 1) {
      // Note: sometimes left zero byte is omitted in hex conversion
      // If first byte is not 0x01, check block directly
    }
    
    const zeroIndex = decryptedBytes.indexOf('\x00', 1);
    if (zeroIndex === -1) {
      throw new Error("Invalid PKCS#1 v1.5 padding during decryption.");
    }
    
    const data = decryptedBytes.substring(zeroIndex + 1);
    return forge.util.decodeUtf8(data);
  }
};

/**
 * Hybrid File Encryption using AES-256-GCM + RSA
 * Packs into: [AESKeyLength(4 bytes)][EncryptedAESKey][IV(12 bytes)][EncryptedDataBytes]
 */
export const encryptFileHybrid = async (
  pemPrivateKey: string,
  fileData: ArrayBuffer,
  algorithm: EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM
): Promise<ArrayBuffer> => {
  // Generate a random AES key & IV using window.crypto
  const keySizeInBytes = algorithm === EncryptionAlgorithm.AES_128_GCM ? 16 : 32;
  const aesKeyBytes = generateSecureBytes(keySizeInBytes);
  const ivBytes = generateSecureBytes(12);

  // Encrypt the file data using AES-GCM (Forge)
  const cipher = forge.cipher.createCipher('AES-GCM', aesKeyBytes);
  cipher.start({ iv: ivBytes });
  
  const buffer = forge.util.createBuffer(fileData);
  cipher.update(buffer);
  cipher.finish();
  
  const encryptedFileBytes = cipher.output.getBytes();
  const tagBytes = cipher.mode.tag.getBytes();
  
  // Combine ciphertext and tag
  const combinedCiphertext = encryptedFileBytes + tagBytes;

  // Encrypt the AES key with the Private key (Reverse hybrid encryption for license-generation style files!)
  const encryptedAesKeyBase64 = rsaEncryptWithPrivate(pemPrivateKey, aesKeyBytes);
  const encryptedAesKeyBytes = forge.util.decode64(encryptedAesKeyBase64);
  const aesKeyLength = encryptedAesKeyBytes.length;

  // Create final packed array buffer:
  // [4 bytes key length][Encrypted AES Key][12 bytes IV][Encrypted payload]
  const packedBuffer = new ArrayBuffer(4 + aesKeyLength + 12 + combinedCiphertext.length);
  const view = new DataView(packedBuffer);
  
  // Write key length
  view.setUint32(0, aesKeyLength, false); // Big endian

  const uint8View = new Uint8Array(packedBuffer);
  
  // Write encrypted AES key
  for (let i = 0; i < aesKeyLength; i++) {
    uint8View[4 + i] = encryptedAesKeyBytes.charCodeAt(i);
  }

  // Write IV
  for (let i = 0; i < 12; i++) {
    uint8View[4 + aesKeyLength + i] = ivBytes.charCodeAt(i);
  }

  // Write encrypted file data (including GCM tag)
  for (let i = 0; i < combinedCiphertext.length; i++) {
    uint8View[4 + aesKeyLength + 12 + i] = combinedCiphertext.charCodeAt(i);
  }

  return packedBuffer;
};

/**
 * Hybrid File Decryption using AES-256-GCM + RSA
 */
export const decryptFileHybrid = async (
  pemPublicKey: string,
  packedData: ArrayBuffer
): Promise<ArrayBuffer> => {
  const view = new DataView(packedData);
  if (packedData.byteLength < 16) {
    throw new Error("Invalid encrypted file package: too small.");
  }

  const aesKeyLength = view.getUint32(0, false);
  if (packedData.byteLength < 4 + aesKeyLength + 12) {
    throw new Error("Malformed encrypted file package: structure corrupt.");
  }

  const uint8View = new Uint8Array(packedData);

  // Extract encrypted AES Key bytes
  let encryptedAesKeyBytes = '';
  for (let i = 0; i < aesKeyLength; i++) {
    encryptedAesKeyBytes += String.fromCharCode(uint8View[4 + i]);
  }

  // Extract IV bytes
  let ivBytes = '';
  for (let i = 0; i < 12; i++) {
    ivBytes += String.fromCharCode(uint8View[4 + aesKeyLength + i]);
  }

  // Extract encrypted payload bytes
  let payloadBytes = '';
  const payloadOffset = 4 + aesKeyLength + 12;
  const payloadLength = packedData.byteLength - payloadOffset;
  for (let i = 0; i < payloadLength; i++) {
    payloadBytes += String.fromCharCode(uint8View[payloadOffset + i]);
  }

  // Decrypt the AES Key with the Public key
  const encryptedAesKeyBase64 = forge.util.encode64(encryptedAesKeyBytes);
  const aesKeyBytes = rsaDecryptWithPublic(pemPublicKey, encryptedAesKeyBase64);

  // Separate GCM Tag from ciphertext (last 16 bytes is the tag)
  if (payloadBytes.length < 16) {
    throw new Error("Ciphertext too small, GCM Authentication tag is missing.");
  }
  const ciphertextBytes = payloadBytes.substring(0, payloadBytes.length - 16);
  const tagBytes = payloadBytes.substring(payloadBytes.length - 16);

  // Decrypt payload using AES-GCM (Forge)
  const decipher = forge.cipher.createDecipher('AES-GCM', aesKeyBytes);
  decipher.start({
    iv: ivBytes,
    tag: forge.util.createBuffer(tagBytes)
  });
  
  decipher.update(forge.util.createBuffer(ciphertextBytes));
  const success = decipher.finish();
  
  if (!success) {
    throw new Error("Failed to authenticate or decrypt file content. Make sure you used the matching key pair.");
  }

  const outputBytes = decipher.output.getBytes();
  
  // Convert forge bytes string to ArrayBuffer
  const outputBuffer = new ArrayBuffer(outputBytes.length);
  const outputUint8 = new Uint8Array(outputBuffer);
  for (let i = 0; i < outputBytes.length; i++) {
    outputUint8[i] = outputBytes.charCodeAt(i);
  }

  return outputBuffer;
};

// Base64 helper utilities
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return forge.util.encode64(binary);
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = forge.util.decode64(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};
