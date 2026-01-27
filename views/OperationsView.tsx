import React, { useState, useEffect, useRef } from 'react';
import { StoredKeyMetadata, CryptoOperation, EncryptionAlgorithm } from '../types';
import { getKeysMetadata, getKeyByName } from '../services/keyStorage';
import { encryptData, decryptData, arrayBufferToBase64 } from '../services/cryptoUtils';
import { FileUp, Lock, Unlock, Loader2, AlertCircle, FileCheck, Copy, Check, Settings2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const OperationsView: React.FC = () => {
  const { t } = useLanguage();
  const [availableKeys, setAvailableKeys] = useState<StoredKeyMetadata[]>([]);
  const [selectedKeyName, setSelectedKeyName] = useState<string>('');
  const [operation, setOperation] = useState<CryptoOperation>(CryptoOperation.ENCRYPT);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<{ blob: Blob; filename: string } | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load keys from storage (Async now)
    const loadKeys = async () => {
      try {
        const keys = await getKeysMetadata();
        setAvailableKeys(keys);
      } catch (e) {
        console.error("Failed to load keys", e);
      }
    };
    loadKeys();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setResultBlob(null);
      setResultText(null);
      setError(null);
    }
  };

  const isText = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    // Check first 1000 bytes for null chars which usually indicate binary
    for (let i = 0; i < Math.min(bytes.length, 1000); i++) {
      if (bytes[i] === 0) return false;
    }
    return true;
  };

  const processFile = async () => {
    if (!selectedKeyName || !selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setResultText(null);

    try {
      const fullKey = await getKeyByName(selectedKeyName);
      if (!fullKey) throw new Error("Key not found in storage. It may have been deleted.");

      const fileBuffer = await selectedFile.arrayBuffer();
      let processedBuffer: ArrayBuffer;
      let outputFilename: string;

      if (operation === CryptoOperation.ENCRYPT) {
        // Use the algorithm stored with the key, default to AES-256 if undefined
        const algo = fullKey.algorithm || EncryptionAlgorithm.AES_256_GCM;
        processedBuffer = await encryptData(fullKey.publicKey, fileBuffer, algo);
        outputFilename = `${selectedFile.name}.enc`;
        // Encryption result is always binary, display as Base64 (first 200 chars for preview)
        const preview = arrayBufferToBase64(processedBuffer).substring(0, 500) + "...";
        setResultText(preview);
      } else {
        processedBuffer = await decryptData(fullKey.privateKey, fileBuffer);
        // Attempt to remove .enc extension if present, otherwise prepend decrypted_
        outputFilename = selectedFile.name.endsWith('.enc') 
          ? selectedFile.name.slice(0, -4) 
          : `decrypted_${selectedFile.name}`;
        
        // Check if result seems like text
        if (isText(processedBuffer)) {
            const decoder = new TextDecoder('utf-8');
            setResultText(decoder.decode(processedBuffer));
        } else {
            setResultText(arrayBufferToBase64(processedBuffer).substring(0, 500) + "...");
        }
      }

      const blob = new Blob([processedBuffer], { type: 'application/octet-stream' });
      setResultBlob({ blob, filename: outputFilename });

    } catch (err: any) {
      console.error(err);
      setError(`Operation failed: ${err.message}. Ensure you are using the correct key and file.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultBlob.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (resultText) {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Find currently selected key metadata to display algo
  const selectedKeyMeta = availableKeys.find(k => k.name === selectedKeyName);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{t.operations.title}</h2>
        <p className="text-slate-400">{t.operations.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <label className="block text-sm font-medium text-slate-300 mb-3">{t.operations.mode}</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg">
              <button
                onClick={() => { setOperation(CryptoOperation.ENCRYPT); setResultBlob(null); setResultText(null); }}
                className={`flex justify-center items-center space-x-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  operation === CryptoOperation.ENCRYPT 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>{t.operations.encrypt}</span>
              </button>
              <button
                onClick={() => { setOperation(CryptoOperation.DECRYPT); setResultBlob(null); setResultText(null); }}
                className={`flex justify-center items-center space-x-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  operation === CryptoOperation.DECRYPT 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Unlock className="w-4 h-4" />
                <span>{t.operations.decrypt}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <label className="block text-sm font-medium text-slate-300 mb-3">{t.operations.selectKey}</label>
            {availableKeys.length === 0 ? (
              <div className="text-amber-500 text-sm flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>{t.operations.noKeys}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedKeyName}
                  onChange={(e) => { setSelectedKeyName(e.target.value); setResultBlob(null); setResultText(null); }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">{t.operations.chooseKey}</option>
                  {availableKeys.map(k => (
                    <option key={k.id} value={k.name}>
                      {k.name} ({k.size} bit)
                    </option>
                  ))}
                </select>
                {selectedKeyMeta && (
                  <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded">
                    <Settings2 className="w-3 h-3" />
                    <span>{t.operations.usingAlgo} <span className="text-blue-400">{selectedKeyMeta.algorithm || EncryptionAlgorithm.AES_256_GCM}</span></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-lg flex flex-col items-center justify-center min-h-[300px]">
            {!selectedFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex flex-col items-center text-slate-400 hover:text-blue-400 transition-colors"
              >
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-600 hover:border-blue-500 transition-colors">
                  <FileUp className="w-10 h-10" />
                </div>
                <p className="text-lg font-medium">{t.operations.clickSelect}</p>
                <p className="text-sm opacity-60">{t.operations.anyType}</p>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex items-center justify-between bg-slate-900 p-4 rounded-lg border border-slate-600 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-800 rounded">
                      <FileCheck className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedFile(null); setResultBlob(null); setResultText(null); }}
                    className="text-slate-400 hover:text-red-400 text-sm underline"
                  >
                    {t.operations.change}
                  </button>
                </div>

                <button
                  onClick={processFile}
                  disabled={isProcessing || !selectedKeyName}
                  className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center space-x-2 transition-all ${
                    isProcessing || !selectedKeyName
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : operation === CryptoOperation.ENCRYPT
                        ? 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-900/20 text-white'
                        : 'bg-purple-600 hover:bg-purple-500 hover:shadow-purple-900/20 text-white'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>{t.operations.processing}</span>
                    </>
                  ) : (
                    <>
                      {operation === CryptoOperation.ENCRYPT ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                      <span>{operation === CryptoOperation.ENCRYPT ? `${t.operations.encryptBtn} (${selectedKeyMeta?.algorithm?.replace('AES-', '') || '256-GCM'})` : t.operations.decryptBtn}</span>
                    </>
                  )}
                </button>
                
                {!selectedKeyName && (
                  <p className="text-center text-amber-500 text-sm mt-3">{t.operations.selectKeyPrompt}</p>
                )}
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
          </div>

          {/* Output Area */}
          {error && (
             <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-200 flex items-start space-x-3">
               <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <p>{error}</p>
             </div>
          )}

          {resultBlob && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-green-900/20 border border-green-500/50 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <h4 className="text-green-400 font-semibold mb-1">{t.operations.success}</h4>
                  <p className="text-slate-300 text-sm">{t.operations.output} <span className="font-mono text-green-300">{resultBlob.filename}</span></p>
                </div>
                <button
                  onClick={downloadResult}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium shadow-lg transition-colors"
                >
                  {t.operations.download}
                </button>
              </div>

              {resultText && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
                    <span className="text-sm font-medium text-slate-400">
                      {operation === CryptoOperation.ENCRYPT ? t.operations.base64Output : t.operations.decryptedContent}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className="text-xs flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? t.operations.copied : t.operations.copy}</span>
                    </button>
                  </div>
                  <div className="p-4 max-h-60 overflow-y-auto">
                    <pre className="text-xs font-mono text-slate-300 break-all whitespace-pre-wrap">
                      {resultText}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationsView;