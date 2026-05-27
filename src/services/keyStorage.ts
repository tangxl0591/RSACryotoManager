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

// Dynamically use Node.js modules if running in Electron environment
const getFs = () => typeof window !== 'undefined' && (window as any).require ? (window as any).require('fs') : null;
const getPath = () => typeof window !== 'undefined' && (window as any).require ? (window as any).require('path') : null;
const getProcess = () => typeof window !== 'undefined' && (window as any).process ? (window as any).process : null;

// Determine local RSA-Keys folder
export const getKeysDirectory = () => {
  const path = getPath();
  const proc = getProcess();
  if (path && proc) {
    return path.join(proc.cwd(), 'RSA-Keys');
  }
  return null;
};

// Ensure the folder exists
const ensureKeysDir = () => {
  const fs = getFs();
  const dir = getKeysDirectory();
  if (fs && dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

export const saveKeyToStorage = (name: string, publicKey: string, privateKey: string, bits: number, description?: string): StoredKey => {
  const savedKeys = getSavedKeys();
  const newName = name.trim() || `RSA-${bits}`;
  
  const newKey: StoredKey = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
    name: newName,
    publicKey,
    privateKey,
    bits,
    description,
    createdAt: new Date().toISOString()
  };
  
  savedKeys.push(newKey);
  
  // Save to locale storage as web fallback
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedKeys));

  // Save to local file system if Electron
  const fs = getFs();
  const path = getPath();
  const dir = ensureKeysDir();
  
  if (fs && path && dir) {
    try {
      // Create safe filename
      const safeName = newName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'default_key';
      
      // Attempt to save keys as direct files for users to access locally
      fs.writeFileSync(path.join(dir, `${safeName}_public.pem`), publicKey, 'utf8');
      fs.writeFileSync(path.join(dir, `${safeName}_private.pem`), privateKey, 'utf8');
      
      // Save manifest too
      fs.writeFileSync(path.join(dir, 'keys.json'), JSON.stringify(savedKeys, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write keys to file system', e);
    }
  }

  return newKey;
};

export const getSavedKeys = (): StoredKey[] => {
  let keys: StoredKey[] = [];
  
  const fs = getFs();
  const path = getPath();
  const dir = getKeysDirectory();

  // Load from local directory if Electron
  if (fs && path && dir && fs.existsSync(dir)) {
    try {
      // 1. First, check manifest for metadata (descriptions, exact bits, etc)
      const manifestPath = path.join(dir, 'keys.json');
      let manifestKeys: StoredKey[] = [];
      if (fs.existsSync(manifestPath)) {
        try {
          manifestKeys = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch (e) {}
      }

      // 2. Read explicit key files dropped in the folder or subfolders
      const pemMap = new Map<string, Partial<StoredKey>>();

      const readPemFilesRecursive = (currentDir: string) => {
        try {
          const items = fs.readdirSync(currentDir);
          items.forEach((item: string) => {
            const fullPath = path.join(currentDir, item);
            try {
              const stat = fs.statSync(fullPath);
              if (stat.isDirectory()) {
                readPemFilesRecursive(fullPath);
              } else if (stat.isFile() && stat.size < 1024 * 100) { // Max 100KB for keys
                if (item.endsWith('.json')) return; // skip manifest
                const content = fs.readFileSync(fullPath, 'utf8');
                let isKey = false;
                let isPub = false;
                let isPriv = false;
                if (content.includes('PUBLIC KEY')) { isKey = true; isPub = true; }
                if (content.includes('PRIVATE KEY')) { isKey = true; isPriv = true; }

                if (isKey) {
                  let keyName = item.replace(/(_public|_private| public| private|\.pem|\.key|\.pub|\.txt)$/ig, '').trim();
                  if (item.toLowerCase().endsWith('public.pem') || item.toLowerCase().endsWith('pub.pem')) {
                    keyName = item.replace(/(_?public|_?pub)\.pem$/i, '').trim();
                  }

                  if (!pemMap.has(keyName)) {
                     pemMap.set(keyName, {
                        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                        name: keyName,
                        createdAt: new Date().toISOString(),
                        bits: 2048 // Fallback
                     });
                  }
                  
                  const entry = pemMap.get(keyName)!;
                  if (isPub && !entry.publicKey) {
                    entry.publicKey = content;
                  }
                  if (isPriv && !entry.privateKey) {
                    entry.privateKey = content;
                  }
                }
              }
            } catch (err) {}
          });
        } catch (err) {}
      };

      readPemFilesRecursive(dir);

      // 3. Combine manifest with whatever pem files exist
      pemMap.forEach((entry, name) => {
         // See if it exists in manifest
         const existing = manifestKeys.find(mk => mk.name.toLowerCase() === name.toLowerCase());
         if (existing) {
             // Let explicit PEM files override manifest if they disagree, 
             // but keep manifest descriptions/IDs
             if (entry.publicKey) existing.publicKey = entry.publicKey;
             if (entry.privateKey) existing.privateKey = entry.privateKey;
             keys.push(existing);
         } else if (entry.publicKey || entry.privateKey) {
             // Missing from manifest, create new StoredKey
             keys.push(entry as StoredKey);
         }
      });
      
      // Add any keys that were in the manifest but whose PEM files didn't exist strictly
      // (maybe they deleted the PEM files? We'll skip them if they don't have publicKey or privateKey)
      // Actually we just return what we assembled + any from manifest not matched
      manifestKeys.forEach(mk => {
         if (!keys.find(k => k.id === mk.id) && (mk.publicKey || mk.privateKey)) {
             keys.push(mk);
         }
      });
      
      if (keys.length > 0) {
          // Sync localStorage for web view
          localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
          return keys; 
      }
    } catch (e) {
      console.error('Failed to parse RSA-Keys dir', e);
    }
  }

  // Fallback to local storage
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      keys = JSON.parse(data);
      // Synchronize to disk if folder allows it now
      if (fs && keys.length > 0) {
          const sysDir = ensureKeysDir();
          if (sysDir) {
             fs.writeFileSync(path.join(sysDir, 'keys.json'), JSON.stringify(keys, null, 2), 'utf8');
             keys.forEach(k => {
                const safeName = k.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'key';
                if (k.publicKey) fs.writeFileSync(path.join(sysDir, `${safeName}_public.pem`), k.publicKey, 'utf8');
                if (k.privateKey) fs.writeFileSync(path.join(sysDir, `${safeName}_private.pem`), k.privateKey, 'utf8');
             });
          }
      }
    }
  } catch (e) {
    console.error('Failed to read keys from storage', e);
  }

  return keys;
};

export const deleteKeyFromStorage = (id: string): StoredKey[] => {
  const savedKeys = getSavedKeys().filter(k => k.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedKeys));
  
  const fs = getFs();
  const path = getPath();
  const dir = getKeysDirectory();
  
  if (fs && path && dir && fs.existsSync(dir)) {
    try {
      fs.writeFileSync(path.join(dir, 'keys.json'), JSON.stringify(savedKeys, null, 2), 'utf8');
    } catch(e) {
      console.error('Failed to delete key record from keys.json', e);
    }
  }
  
  return savedKeys;
};
