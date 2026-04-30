import React, { useState, useEffect } from 'react';
import { StoredKeyMetadata, CryptoOperation, EncryptionAlgorithm } from '../types';
import { getKeysMetadata, getKeyByName } from '../services/keyStorage';
import { encryptData, decryptData, arrayBufferToBase64, base64ToArrayBuffer } from '../services/cryptoUtils';
import { Lock, Unlock, Loader2, AlertCircle, Copy, Check, Settings2, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const TextOperationsView: React.FC = () => {
  const { t } = useLanguage();
  const [availableKeys, setAvailableKeys] = useState<StoredKeyMetadata[]>([]);
  const [selectedKeyName, setSelectedKeyName] = useState<string>('');
  const [operation, setOperation] = useState<CryptoOperation>(CryptoOperation.ENCRYPT);
  const [algoMode, setAlgoMode] = useState<'HYBRID' | 'PURE_RSA'>('PURE_RSA');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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

  const processText = async () => {
    if (!selectedKeyName) return;
    if (!inputText.trim()) {
      setError(t.textOperations.emptyInputError);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResultText(null);

    try {
      const fullKey = await getKeyByName(selectedKeyName);
      if (!fullKey) throw new Error("Key not found in storage.");

      let processedText: string;

      if (operation === CryptoOperation.ENCRYPT) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(inputText).buffer;
        
        let processedBuffer: ArrayBuffer;
        if (algoMode === 'HYBRID') {
          const algo = fullKey.algorithm || EncryptionAlgorithm.AES_256_GCM;
          processedBuffer = await encryptData(fullKey.privateKey, dataBuffer, algo);
        } else {
          if (!window.electronAPI) throw new Error("Electron API is not available.");
          processedBuffer = await window.electronAPI.rsaPrivateEncrypt(fullKey.privateKey, dataBuffer);
        }
        processedText = arrayBufferToBase64(processedBuffer);
      } else {
        const dataBuffer = base64ToArrayBuffer(inputText.trim());
        
        let processedBuffer: ArrayBuffer;
        if (algoMode === 'HYBRID') {
          processedBuffer = await decryptData(fullKey.publicKey, dataBuffer);
        } else {
          if (!window.electronAPI) throw new Error("Electron API is not available.");
          processedBuffer = await window.electronAPI.rsaPublicDecrypt(fullKey.publicKey, dataBuffer);
        }
        
        const decoder = new TextDecoder('utf-8');
        processedText = decoder.decode(processedBuffer);
      }

      setResultText(processedText);
    } catch (err: any) {
      console.error(err);
      setError(`Operation failed: ${err.message}. Ensure you are using the correct key and valid format.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    if (resultText) {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedKeyMeta = availableKeys.find(k => k.name === selectedKeyName);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{t.textOperations.title}</h2>
        <p className="text-slate-400">{t.textOperations.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <label className="block text-sm font-medium text-slate-300 mb-3">{t.operations.mode}</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg">
              <button
                onClick={() => { setOperation(CryptoOperation.ENCRYPT); setResultText(null); }}
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
                onClick={() => { setOperation(CryptoOperation.DECRYPT); setResultText(null); }}
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
            {/* Helper Text */}
            <div className="mt-3 text-xs text-slate-500 bg-slate-900/50 p-2 rounded border border-slate-700/50">
              {operation === CryptoOperation.ENCRYPT 
                ? t.operations.privateKeyHint 
                : t.operations.publicKeyHint}
            </div>

            <label className="block text-sm font-medium text-slate-300 mt-6 mb-3">{t.textOperations.algoMode}</label>
            <div className="flex flex-col space-y-2">
              <label className="flex items-center space-x-3 text-sm text-slate-300 cursor-pointer">
                <input 
                  type="radio" 
                  checked={algoMode === 'PURE_RSA'} 
                  onChange={() => { setAlgoMode('PURE_RSA'); setResultText(null); }}
                  className="text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-700" 
                />
                <span>{t.textOperations.pureMode}</span>
              </label>
              <label className="flex items-center space-x-3 text-sm text-slate-300 cursor-pointer">
                <input 
                  type="radio" 
                  checked={algoMode === 'HYBRID'} 
                  onChange={() => { setAlgoMode('HYBRID'); setResultText(null); }}
                  className="text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-700" 
                />
                <span>{t.textOperations.hybridMode}</span>
              </label>
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
                  onChange={(e) => { setSelectedKeyName(e.target.value); setResultText(null); }}
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
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col min-h-[300px]">
            <label className="block text-sm font-medium text-slate-300 mb-2">{t.textOperations.inputLabel}</label>
            <textarea
              className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm mb-6"
              placeholder={t.textOperations.inputPlaceholder}
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); setResultText(null); setError(null); }}
            />

            <button
              onClick={processText}
              disabled={isProcessing || !selectedKeyName || !inputText.trim()}
              className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center space-x-2 transition-all ${
                isProcessing || !selectedKeyName || !inputText.trim()
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
                  <span>{operation === CryptoOperation.ENCRYPT ? `${t.textOperations.encryptBtn} (${algoMode === 'PURE_RSA' ? 'RSA' : selectedKeyMeta?.algorithm?.replace('AES-', '') || '256-GCM'})` : t.textOperations.decryptBtn}</span>
                </>
              )}
            </button>
            
            {!selectedKeyName && (
              <p className="text-center text-amber-500 text-sm mt-3">{t.operations.selectKeyPrompt}</p>
            )}
          </div>

          {/* Output Area */}
          {error && (
             <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-200 flex items-start space-x-3">
               <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <p>{error}</p>
             </div>
          )}

          {resultText && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-xl flex items-center">
                 <Check className="w-5 h-5 text-green-400 mr-2" />
                 <span className="text-green-400 font-medium">{t.operations.success}</span>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
                  <span className="text-sm font-medium text-slate-400">
                    {t.textOperations.resultLabel}
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
                  <pre className="text-sm font-mono text-slate-300 break-all whitespace-pre-wrap">
                    {resultText}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextOperationsView;
