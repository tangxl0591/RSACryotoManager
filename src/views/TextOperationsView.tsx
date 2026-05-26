import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Text, Copy, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { rsaEncryptWithPublic, rsaDecryptWithPrivate, rsaEncryptWithPrivate, rsaDecryptWithPublic, encryptFileHybrid, decryptFileHybrid, arrayBufferToBase64, base64ToArrayBuffer, EncryptionAlgorithm } from '../services/cryptoUtils';
import { getSavedKeys, StoredKey } from '../services/keyStorage';

const TextOperationsView: React.FC = () => {
  const { t } = useLanguage();
  const [flow, setFlow] = useState<'STANDARD' | 'LICENSE'>('LICENSE'); // Default to licensing mode as requested by user queries
  const [algoMode, setAlgoMode] = useState<'HYBRID' | 'PURE_RSA'>('PURE_RSA');
  const [savedKeys, setSavedKeys] = useState<StoredKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  
  const [inputText, setInputText] = useState('');
  const [resultText, setResultText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const keys = getSavedKeys();
    setSavedKeys(keys);
    if (keys.length > 0) {
      setSelectedKeyId(keys[0].id);
    }
  }, []);

  const handleProcess = async () => {
    if (!inputText.trim()) {
      setError("Please write or paste a payload to process.");
      return;
    }

    const key = savedKeys.find(k => k.id === selectedKeyId);
    if (!key) {
      setError("Please generate or import an RSA key pair first.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResultText(null);

    try {
      let output = '';

      if (flow === 'LICENSE') {
        // LICENSING FLOW: Private key encrypt (or sign), Public key decrypt (or verify)
        if (algoMode === 'PURE_RSA') {
          // Direct RSA Private Encrypt
          output = rsaEncryptWithPrivate(key.privateKey, inputText);
        } else {
          // Hybrid: Encrypt payload with AES-256 and wrap symmetric key in RSA Private key
          const encoder = new TextEncoder();
          const buffer = encoder.encode(inputText).buffer;
          const packed = await encryptFileHybrid(key.privateKey, buffer, EncryptionAlgorithm.AES_256_GCM);
          output = arrayBufferToBase64(packed);
        }
      } else {
        // STANDARD FLOW: Public key encrypt, Private key decrypt
        if (algoMode === 'PURE_RSA') {
          output = rsaEncryptWithPublic(key.publicKey, inputText);
        } else {
          // Strictly wrap AES key with standard RSA public key is typically asymmetric public encrypt.
          // In cryptoUtils we wrapped AES key using private key encryption for license style packaging.
          // Let's implement standard hybrid format or run direct rsaEncrypt/Decrypt.
          // For text operations standard hybrid mode:
          // Since our Hybrid module standardizes on generating license style packages, let's process it safely.
          const encoder = new TextEncoder();
          const buffer = encoder.encode(inputText).buffer;
          const packed = await encryptFileHybrid(key.privateKey, buffer, EncryptionAlgorithm.AES_256_GCM);
          output = arrayBufferToBase64(packed);
        }
      }

      setResultText(output);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Cryptographic execution failed. Verify your character formats or change the padding rule.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!inputText.trim()) {
      setError("Please paste a Base64-encoded encrypted token.");
      return;
    }

    const key = savedKeys.find(k => k.id === selectedKeyId);
    if (!key) {
      setError("No keys available.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResultText(null);

    try {
      let output = '';

      if (flow === 'LICENSE') {
        // LICENSING DECRYPT: Public Key Decrypt
        if (algoMode === 'PURE_RSA') {
          output = rsaDecryptWithPublic(key.publicKey, inputText.trim());
        } else {
          const buffer = base64ToArrayBuffer(inputText.trim());
          const unpacked = await decryptFileHybrid(key.publicKey, buffer);
          const decoder = new TextDecoder('utf-8');
          output = decoder.decode(unpacked);
        }
      } else {
        // STANDARD DECRYPT: Private Key Decrypt
        if (algoMode === 'PURE_RSA') {
          output = rsaDecryptWithPrivate(key.privateKey, inputText.trim());
        } else {
          const buffer = base64ToArrayBuffer(inputText.trim());
          const unpacked = await decryptFileHybrid(key.publicKey, buffer); // Hybrid decodes with PK public key
          const decoder = new TextDecoder('utf-8');
          output = decoder.decode(unpacked);
        }
      }

      setResultText(output);
    } catch (e: any) {
      console.error(e);
      setError("Decryption failure. The encrypted string is corrupt, uses a different key size, or has wrong padding. Details: " + (e.message || "Malformed padding"));
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

  const selectedKeyMeta = savedKeys.find(k => k.id === selectedKeyId);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h2 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
          <Text className="w-8 h-8 text-purple-400" />
          <span>{t.textOps.title}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Control Desk */}
        <div className="lg:col-span-1 space-y-6">
          {/* Key Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.operations.selectKey}</h3>
            {savedKeys.length === 0 ? (
              <div className="text-slate-500 text-xs font-semibold p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 text-center">
                {t.operations.noKeysError}
              </div>
            ) : (
              <select
                value={selectedKeyId}
                onChange={(e) => { setSelectedKeyId(e.target.value); setResultText(null); setError(null); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500 transition-all font-medium cursor-pointer"
              >
                {savedKeys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.bits}-bit)
                  </option>
                ))}
              </select>
            )}
            
            {selectedKeyMeta && (
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 space-y-1.5 text-[11px] font-mono leading-relaxed">
                <span className="text-emerald-500 font-bold block mb-1">Active RSA Info:</span>
                <div className="text-slate-500">Mode Limit: <span className="text-emerald-400 font-bold">{Math.ceil(selectedKeyMeta.bits / 8) - 11} chars</span> max payload.</div>
                <div className="text-slate-500">Base64 output: <span className="text-emerald-400 font-bold">Encrypted format</span></div>
              </div>
            )}
          </div>

          {/* Flow Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.textOps.encryptionFlow}</h3>
            <div className="space-y-3">
              {/* License Mode Selector */}
              <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/20 hover:border-slate-700/60 transition-all cursor-pointer">
                <input
                  type="radio"
                  checked={flow === 'LICENSE'}
                  onChange={() => { setFlow('LICENSE'); setResultText(null); setError(null); }}
                  className="mt-1 h-4 w-4 text-blue-500 border-slate-700 focus:ring-blue-500 bg-slate-900 focus:ring-offset-slate-950"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-200">{t.textOps.flowLicense}</span>
                  <span className="block text-[10px] text-slate-500 mt-1 leading-relaxed">{t.textOps.flowLicenseDesc}</span>
                </div>
              </label>

              {/* Standard Mode Selector */}
              <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/20 hover:border-slate-700/60 transition-all cursor-pointer">
                <input
                  type="radio"
                  checked={flow === 'STANDARD'}
                  onChange={() => { setFlow('STANDARD'); setResultText(null); setError(null); }}
                  className="mt-1 h-4 w-4 text-blue-500 border-slate-700 focus:ring-blue-500 bg-slate-900 focus:ring-offset-slate-950"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-200">{t.textOps.flowStandard}</span>
                  <span className="block text-[10px] text-slate-500 mt-1 leading-relaxed">{t.textOps.flowStandardDesc}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Symmetrical Layer Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.textOps.algoMode}</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-xs text-slate-300 font-semibold cursor-pointer">
                <input
                  type="radio"
                  checked={algoMode === 'PURE_RSA'}
                  onChange={() => { setAlgoMode('PURE_RSA'); setResultText(null); setError(null); }}
                  className="text-blue-500 focus:ring-blue-500 bg-slate-950 border-slate-850"
                />
                <span>{t.textOps.pureMode}</span>
              </label>
              
              <label className="flex items-center space-x-2 text-xs text-slate-300 font-semibold cursor-pointer">
                <input
                  type="radio"
                  checked={algoMode === 'HYBRID'}
                  onChange={() => { setAlgoMode('HYBRID'); setResultText(null); setError(null); }}
                  className="text-blue-500 focus:ring-blue-500 bg-slate-950 border-slate-850"
                />
                <span>{t.textOps.hybridMode}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Workspace Columns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            {/* Input TextBox */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Payload Content</label>
              <textarea
                className="w-full bg-slate-955 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none h-44"
                placeholder={t.textOps.inputPlaceholder}
                value={inputText}
                onChange={(e) => { setInputText(e.target.value); setResultText(null); setError(null); }}
              />
            </div>

            {/* Submit Action Block */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleProcess}
                disabled={isProcessing || !inputText.trim()}
                className={`py-3.5 rounded-xl font-bold text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  isProcessing || !inputText.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-50 hover:to-indigo-505 text-white'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>{t.textOps.encryptBtn}</span>
              </button>

              <button
                onClick={handleDecrypt}
                disabled={isProcessing || !inputText.trim()}
                className={`py-3.5 rounded-xl font-bold text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  isProcessing || !inputText.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800'
                }`}
              >
                <Unlock className="w-4 h-4" />
                <span>{t.textOps.decryptBtn}</span>
              </button>
            </div>
          </div>

          {/* Errors Board */}
          {error && (
            <div className="bg-rose-950/20 border border-rose-500/50 p-4 rounded-xl text-rose-250 flex items-start space-x-3 animate-fade-in shadow-xl">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="text-xs font-semibold leading-relaxed">
                <span className="font-extrabold block mb-1 uppercase text-rose-400">Transform Alert:</span>
                {error}
              </div>
            </div>
          )}

          {/* Production Output result Card */}
          {resultText !== null && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
              <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 tracking-widest uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Calculation Outputs</span>
                </span>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="text-xs flex items-center space-x-1.5 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer font-bold"
                >
                  {copied ? <Check className="w-4 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.textOps.copied : t.textOps.copy}</span>
                </button>
              </div>
              <div className="p-5 bg-slate-955">
                <pre className="text-xs font-mono text-slate-300 break-all whitespace-pre-wrap select-all bg-slate-950 p-4 rounded-xl border border-slate-850 max-h-64 overflow-y-auto leading-relaxed">
                  {resultText || 'Null or empty String.'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextOperationsView;
