export interface StoredKey {
  id: string;
  name: string;
  publicKey: string;
  privateKey: string;
  bits: number;
  description?: string;
  createdAt: string;
}

const STORAGE_KEY = 'rsa_crypto_suite_saved_keys';

export const saveKeyToStorage = (name: string, publicKey: string, privateKey: string, bits: number, description?: string): StoredKey => {
  const savedKeys = getSavedKeys();
  const newKey: StoredKey = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
    name: name.trim() || `RSA-${bits} (${new Date().toLocaleDateString()})`,
    publicKey,
    privateKey,
    bits,
    description,
    createdAt: new Date().toISOString()
  };
  
  savedKeys.push(newKey);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedKeys));
  return newKey;
};

export const getSavedKeys = (): StoredKey[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read keys from storage', e);
    return [];
  }
};

export const deleteKeyFromStorage = (id: string): StoredKey[] => {
  const savedKeys = getSavedKeys().filter(k => k.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedKeys));
  return savedKeys;
};
