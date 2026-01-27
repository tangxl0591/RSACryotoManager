import { RSAKeyPair, StoredKeyMetadata, EncryptionAlgorithm } from '../types';

const STORAGE_KEY = 'rsa_manager_keys';

export const saveKeyToStorage = async (keyPair: RSAKeyPair): Promise<void> => {
  if (window.electronAPI) {
    const result = await window.electronAPI.saveKey(keyPair);
    if (!result.success) {
      throw new Error(result.error || "Failed to save key to disk");
    }
    return;
  }

  // Web Fallback
  const existingStr = localStorage.getItem(STORAGE_KEY);
  const existing: RSAKeyPair[] = existingStr ? JSON.parse(existingStr) : [];
  
  if (existing.some(k => k.name === keyPair.name)) {
    throw new Error(`Key with name "${keyPair.name}" already exists.`);
  }

  const updated = [...existing, keyPair];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getKeysMetadata = async (): Promise<StoredKeyMetadata[]> => {
  if (window.electronAPI) {
    return await window.electronAPI.getKeys();
  }

  // Web Fallback
  const existingStr = localStorage.getItem(STORAGE_KEY);
  const existing: RSAKeyPair[] = existingStr ? JSON.parse(existingStr) : [];
  
  return existing.map(k => ({
    id: k.id,
    name: k.name,
    size: k.size,
    algorithm: k.algorithm || EncryptionAlgorithm.AES_256_GCM, // Backwards compatibility default
    createdAt: k.createdAt
  })).sort((a, b) => b.createdAt - a.createdAt);
};

export const getKeyByName = async (name: string): Promise<RSAKeyPair | undefined> => {
  if (window.electronAPI) {
    return await window.electronAPI.getKey(name);
  }

  // Web Fallback
  const existingStr = localStorage.getItem(STORAGE_KEY);
  const existing: RSAKeyPair[] = existingStr ? JSON.parse(existingStr) : [];
  return existing.find(k => k.name === name);
};

export const openKeysFolder = async (): Promise<void> => {
  if (window.electronAPI) {
    await window.electronAPI.openKeysFolder();
  }
};

// Only needed for Web mode
export const downloadKeyFiles = (keyPair: RSAKeyPair) => {
  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  downloadFile(`${keyPair.name}_public.pem`, keyPair.publicKey);
  downloadFile(`${keyPair.name}_private.pem`, keyPair.privateKey);
};