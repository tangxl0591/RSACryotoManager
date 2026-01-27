import React, { useState } from 'react';
import { KeySize, RSAKeyPair, EncryptionAlgorithm } from '../types';
import { generateRSAKeyPair } from '../services/cryptoUtils';
import { saveKeyToStorage, downloadKeyFiles, openKeysFolder } from '../services/keyStorage';
import { Download, Loader2, Save, FolderOpen, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const GeneratorView: React.FC = () => {
  const { t } = useLanguage();
  const [keyName, setKeyName] = useState('');
  const [keySize, setKeySize] = useState<KeySize>(KeySize.BITS_2048);
  const [algorithm, setAlgorithm] = useState<EncryptionAlgorithm>(EncryptionAlgorithm.AES_256_GCM);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<RSAKeyPair | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const isElectron = !!window.electronAPI;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      setError(t.generator.errorName);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedKey(null);

    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const { publicKey, privateKey } = await generateRSAKeyPair(keySize);
      
      const newKey: RSAKeyPair = {
        id: crypto.randomUUID(),
        name: keyName.trim(),
        size: keySize,
        algorithm: algorithm,
        publicKey,
        privateKey,
        createdAt: Date.now(),
      };

      await saveKeyToStorage(newKey);
      setGeneratedKey(newKey);
      
      // Only download automatically if not in Electron (Web mode)
      if (!isElectron) {
        downloadKeyFiles(newKey);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate key pair");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{t.generator.title}</h2>
        <p className="text-slate-400">
          {t.generator.subtitle} 
          {isElectron ? t.generator.saveLocally : t.generator.saveBrowser}
        </p>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="keyName" className="block text-sm font-medium text-slate-300">
                {t.generator.labelName}
              </label>
              <input
                id="keyName"
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder={t.generator.placeholderName}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="keySize" className="block text-sm font-medium text-slate-300">
                {t.generator.labelSpec}
              </label>
              <select
                id="keySize"
                value={keySize}
                onChange={(e) => setKeySize(Number(e.target.value) as KeySize)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value={KeySize.BITS_2048}>{t.generator.stdSecurity}</option>
                <option value={KeySize.BITS_4096}>{t.generator.highSecurity}</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="algorithm" className="block text-sm font-medium text-slate-300">
                {t.generator.labelAlgo}
              </label>
              <select
                id="algorithm"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as EncryptionAlgorithm)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value={EncryptionAlgorithm.AES_256_GCM}>AES-256-GCM (Recommended)</option>
                <option value={EncryptionAlgorithm.AES_128_GCM}>AES-128-GCM (Faster)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                isGenerating
                  ? 'bg-blue-800 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-95'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.generator.btnGenerating}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{t.generator.btnGenerate}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {generatedKey && (
        <div className="mt-8 bg-slate-800/50 border border-green-900 rounded-xl p-6 animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 text-green-400 mb-4">
              <FolderOpen className="w-6 h-6" />
              <h3 className="text-xl font-semibold">{t.generator.successTitle}</h3>
            </div>
            <div className="flex space-x-3">
              {isElectron ? (
                <button 
                  onClick={openKeysFolder}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{t.generator.openFolder}</span>
                </button>
              ) : (
                <button 
                  onClick={() => downloadKeyFiles(generatedKey)}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.generator.download}</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-black/40 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre">
            <div className="text-slate-500 mb-2">
              # {t.generator.savedTo} {isElectron ? './RSA-Keys/' : './'}{generatedKey.name}/
            </div>
            {generatedKey.publicKey}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratorView;