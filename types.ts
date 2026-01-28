export enum KeySize {
  BITS_2048 = 2048,
  BITS_4096 = 4096,
}

export enum EncryptionAlgorithm {
  AES_256_GCM = 'AES-256-GCM',
  AES_128_GCM = 'AES-128-GCM',
}

export interface RSAKeyPair {
  id: string;
  name: string;
  size: KeySize;
  algorithm: EncryptionAlgorithm;
  publicKey: string; // PEM format
  privateKey: string; // PEM format
  createdAt: number;
}

export enum CryptoOperation {
  ENCRYPT = 'ENCRYPT',
  DECRYPT = 'DECRYPT',
}

export interface StoredKeyMetadata {
  id: string;
  name: string;
  size: KeySize;
  algorithm: EncryptionAlgorithm;
  createdAt: number;
}

export interface ElectronAPI {
  saveKey: (key: RSAKeyPair) => Promise<{ success: boolean; path?: string; error?: string }>;
  getKeys: () => Promise<StoredKeyMetadata[]>;
  getKey: (name: string) => Promise<RSAKeyPair | undefined>;
  openKeysFolder: () => Promise<void>;
  // New methods for Private Encrypt / Public Decrypt
  rsaPrivateEncrypt: (pemKey: string, data: ArrayBuffer) => Promise<ArrayBuffer>;
  rsaPublicDecrypt: (pemKey: string, data: ArrayBuffer) => Promise<ArrayBuffer>;
}

export type Language = 'en' | 'zh';

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}