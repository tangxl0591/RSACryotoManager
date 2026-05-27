import React, { useState, useEffect, useRef } from 'react';
import { FileDigit, Upload, ShieldCheck, Download, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { encryptFileHybrid, decryptFileHybrid, rsaEncryptWithPrivate, rsaDecryptWithPublic, EncryptionAlgorithm } from '../services/cryptoUtils';
import { getSavedKeys, StoredKey } from '../services/keyStorage';

const OperationsView: React.FC = () => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'ENCRYPT' | 'DECRYPT'>('ENCRYPT');
  const [strategy, setStrategy] = useState<'HYBRID' | 'PURE_RSA'>('HYBRID');
  const [savedKeys, setSavedKeys] = useState<StoredKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [resultBuffer, setResultBuffer] = useState<ArrayBuffer | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const keys = getSavedKeys();
    setSavedKeys(keys);
    if (keys.length > 0) {
      setSelectedKeyId(keys[0].id);
    }
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    setResultBuffer(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResultBuffer(null);
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const executeCrypt = async () => {
    if (!uploadedFile) return;
    
    const key = savedKeys.find(k => k.id === selectedKeyId);
    if (!key) {
      setError(t.operations.noKeysError);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResultBuffer(null);

    try {
      // Read the file as ArrayBuffer
      const fileBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result instanceof ArrayBuffer) {
            resolve(e.target.result);
          } else {
            reject(new Error("Failed to read file buffer"));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(uploadedFile);
      });

      let outputBuffer: ArrayBuffer;

      if (mode === 'ENCRYPT') {
        if (strategy === 'PURE_RSA') {
          // Strictly limit payload content
          const maxPayloadBytes = Math.ceil(key.bits / 8) - 11;
          if (fileBuffer.byteLength > maxPayloadBytes) {
            throw new Error(`Pure RSA asymmetric encryption is limited to small payloads. For a ${key.bits}-bit key, files must be less than ${maxPayloadBytes} bytes. For larger datasets, please switch to the Hybrid mode.`);
          }

          // We represent small files as strings to rsaEncryptWithPrivate, then output as Base64/buffer
          const decoder = new TextDecoder('binary');
          const fileBinaryStr = decoder.decode(fileBuffer);
          const base64Enc = rsaEncryptWithPrivate(key.privateKey, fileBinaryStr);
          
          // Re-pack into ArrayBuffer
          const encoder = new TextEncoder();
          outputBuffer = encoder.encode(base64Enc).buffer;
        } else {
          // Hybrid GCM with RSA key wrapping
          const algoToUse = (key.defaultAlgo as EncryptionAlgorithm) || EncryptionAlgorithm.AES_256_GCM;
          outputBuffer = await encryptFileHybrid(key.privateKey, fileBuffer, algoToUse);
        }
      } else {
        // Decryption mode
        if (strategy === 'PURE_RSA') {
          // Try to decode Base64 output back
          const decoder = new TextDecoder('utf-8');
          const base64Cipher = decoder.decode(fileBuffer).trim();
          const recoveredBinaryStr = rsaDecryptWithPublic(key.publicKey, base64Cipher);
          
          // Convert back to raw byte buffer
          const len = recoveredBinaryStr.length;
          const u8 = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            u8[i] = recoveredBinaryStr.charCodeAt(i);
          }
          outputBuffer = u8.buffer;
        } else {
          // Hybrid file decrypt
          outputBuffer = await decryptFileHybrid(key.publicKey, fileBuffer);
        }
      }

      setResultBuffer(outputBuffer);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An error occurred executing file cryptography operations. Ensure you chose the correct key pair and strategic mode.");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerDownload = () => {
    if (!resultBuffer || !uploadedFile) return;

    let downloadName = uploadedFile.name;
    if (mode === 'ENCRYPT') {
      if (!downloadName.endsWith('.enc')) {
        downloadName = downloadName + '.enc';
      }
    } else {
      if (downloadName.endsWith('.enc')) {
        downloadName = downloadName.slice(0, -4);
      } else {
        downloadName = 'decrypted_' + downloadName;
      }
    }

    const blob = new Blob([resultBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectKeyMeta = savedKeys.find(k => k.id === selectedKeyId);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h2 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
          <FileDigit className="w-8 h-8 text-blue-400" />
          <span>{t.operations.title}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side Settings Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mode Selection Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.operations.mode}</h3>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => { setMode('ENCRYPT'); setResultBuffer(null); setError(null); }}
                className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'ENCRYPT'
                    ? 'bg-blue-600 shadow-md text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.operations.encrypt}
              </button>
              <button
                onClick={() => { setMode('DECRYPT'); setResultBuffer(null); setError(null); }}
                className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'DECRYPT'
                    ? 'bg-blue-600 shadow-md text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.operations.decrypt}
              </button>
            </div>
          </div>

          {/* Key Selection Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.operations.selectKey}</h3>
            {savedKeys.length === 0 ? (
              <div className="text-slate-500 text-xs font-semibold p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 text-center">
                {t.operations.noKeysError}
              </div>
            ) : (
              <select
                value={selectedKeyId}
                onChange={(e) => { setSelectedKeyId(e.target.value); setResultBuffer(null); setError(null); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500 transition-all font-medium cursor-pointer"
              >
                {savedKeys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.bits}-bit)
                  </option>
                ))}
              </select>
            )}

            {selectKeyMeta && (
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 space-y-1 text-[11px] font-medium leading-relaxed font-mono">
                <span className="text-blue-400 font-bold block">Active Identity Config:</span>
                <div className="text-slate-500">Bits: <span className="text-slate-300 font-semibold">{selectKeyMeta.bits}-bit</span></div>
                <div className="text-slate-500 line-clamp-2">Desc: <span className="text-slate-400 font-semibold italic">"{selectKeyMeta.description || 'none'}"</span></div>
              </div>
            )}
          </div>

          {/* Strategy Selection Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.operations.algorithm}</h3>
            
            <div className="space-y-3">
              {/* Hybrid Selector */}
              <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/20 hover:border-slate-700/60 transition-all cursor-pointer">
                <input
                  type="radio"
                  checked={strategy === 'HYBRID'}
                  onChange={() => { setStrategy('HYBRID'); setResultBuffer(null); setError(null); }}
                  className="mt-1 h-4 w-4 text-blue-500 border-slate-700 focus:ring-blue-500 bg-slate-900 focus:ring-offset-slate-950"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-200">{t.operations.hybridModeLabel}</span>
                  <span className="block text-[10px] text-slate-500 mt-1 leading-relaxed">{t.operations.hybridModeDesc}</span>
                </div>
              </label>

              {/* Pure RSA Selector */}
              <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/20 hover:border-slate-700/60 transition-all cursor-pointer">
                <input
                  type="radio"
                  checked={strategy === 'PURE_RSA'}
                  onChange={() => { setStrategy('PURE_RSA'); setResultBuffer(null); setError(null); }}
                  className="mt-1 h-4 w-4 text-blue-500 border-slate-700 focus:ring-blue-500 bg-slate-900 focus:ring-offset-slate-950"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-200">{t.operations.pureModeLabel}</span>
                  <span className="block text-[10px] text-slate-500 mt-1 leading-relaxed">{t.operations.pureModeDesc}</span>
                </div>
              </label>

              {strategy === 'HYBRID' && selectKeyMeta && (
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2">
                   <div className="w-4 h-4 text-blue-500 flex-shrink-0">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-4m0 0V5m0 12l-4-4m4 4l4-4" />
                     </svg>
                   </div>
                   <span className="text-xs font-mono text-slate-400">算法: <span className="bg-blue-600 font-bold px-1.5 py-0.5 rounded text-white">{selectKeyMeta.defaultAlgo || 'AES-256-GCM'}</span></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Drag Drop area and action trigger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Upload Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-64 ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/[0.02]'
                  : uploadedFile
                    ? 'border-emerald-500/50 bg-emerald-500/[0.01]'
                    : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />

              {uploadedFile ? (
                <div className="space-y-4 animate-fade-in flex flex-col items-center">
                  <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-full text-blue-400">
                    <FileDigit className="w-10 h-10 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100 max-w-sm truncate mx-auto select-all">{uploadedFile.name}</h4>
                    <p className="text-xs text-slate-500 font-semibold font-mono mt-1">
                      Size: {(uploadedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setResultBuffer(null); setError(null); }}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-400 bg-slate-950 hover:bg-rose-950/20 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="bg-slate-950 p-4 rounded-full border border-slate-850 text-slate-500">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-200">{t.operations.uploadArea}</h4>
                    <p className="text-slate-500 text-[11px] font-medium leading-relaxed max-w-xs">{t.operations.uploadHint}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Compute Button Trigger */}
            {uploadedFile && (
              <button
                onClick={executeCrypt}
                disabled={isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg flex items-center justify-center space-x-2.5 transition-all cursor-pointer ${
                  isProcessing
                    ? 'bg-slate-800 text-slate-500 cursor-wait'
                    : mode === 'ENCRYPT'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-blue-900/10'
                      : 'bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white shadow-purple-900/10'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                    <span>{t.operations.processing}</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>{mode === 'ENCRYPT' ? t.operations.encryptBtn : t.operations.decryptBtn}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Feedback Area / Errors */}
          {error && (
            <div className="bg-rose-950/20 border border-rose-500/50 p-4 rounded-2xl text-rose-200 flex items-start space-x-3 animate-fade-in shadow-xl">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="text-xs font-semibold leading-relaxed">
                <span className="font-extrabold block mb-1 uppercase">Cryptographic Error:</span>
                {error}
              </div>
            </div>
          )}

          {/* Result Block / Trigger Download */}
          {resultBuffer && (
            <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-400/20 text-indigo-400">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">{t.operations.successFile}</h4>
                  <p className="text-[11px] font-mono font-semibold text-slate-500 mt-0.5">Payload format finalized: Base64/octet-stream</p>
                </div>
              </div>
              
              <button
                onClick={triggerDownload}
                className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs tracking-wide shadow-lg shadow-indigo-950/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{t.operations.downloadBtn}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationsView;
