import React, { useState, useEffect } from 'react';
import { Key, ShieldAlert, Cpu, Download, Copy, Trash2, Check, ListFilter, Plus, Info, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { generateKeyPair, KeySize } from '../services/cryptoUtils';
import { saveKeyToStorage, getSavedKeys, deleteKeyFromStorage, StoredKey } from '../services/keyStorage';

interface GeneratorViewProps {
  onKeyChange: () => void;
}

const GeneratorView: React.FC<GeneratorViewProps> = ({ onKeyChange }) => {
  const { t } = useLanguage();
  const [keySize, setKeySize] = useState<KeySize>(2048);
  const [keyName, setKeyName] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedKeys, setSavedKeys] = useState<StoredKey[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<StoredKey | null>(null);

  const [copiedPub, setCopiedPub] = useState(false);
  const [copiedPriv, setCopiedPriv] = useState(false);

  useEffect(() => {
    setSavedKeys(getSavedKeys());
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const pair = await generateKeyPair(keySize);
      
      const customName = keyName.trim() || `RSA-${keySize} Key`;
      const doc = saveKeyToStorage(customName, pair.publicKey, pair.privateKey, keySize, description);
      
      // Update lists
      const updatedList = getSavedKeys();
      setSavedKeys(updatedList);
      setSelectedKey(doc);
      onKeyChange();
      
      // Reset inputs
      setKeyName('');
      setDescription('');
    } catch (e) {
      console.error(e);
      alert('Key generation failed unexpectedly.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this key pair? Unsaved items will be unrecoverable.')) {
      const updated = deleteKeyFromStorage(id);
      setSavedKeys(updated);
      onKeyChange();
      if (selectedKey?.id === id) {
        setSelectedKey(null);
      }
    }
  };

  const handleCopy = async (text: string, type: 'PUB' | 'PRIV') => {
    await navigator.clipboard.writeText(text);
    if (type === 'PUB') {
      setCopiedPub(true);
      setTimeout(() => setCopiedPub(false), 2000);
    } else {
      setCopiedPriv(true);
      setTimeout(() => setCopiedPriv(false), 2000);
    }
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredKeys = savedKeys.filter(k => 
    k.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (k.description && k.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
            <Key className="w-8 h-8 text-emerald-400" />
            <span>{t.generator.title}</span>
          </h2>
          <p className="text-slate-400 mt-2 text-sm max-w-2xl">{t.generator.subtitle}</p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-900/40 px-4 py-2 rounded-xl text-emerald-300 text-xs font-semibold select-none">
          <Cpu className="w-4 h-4 animate-pulse" />
          <span>Hardware Accelerated Computation</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Generation Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
            <h3 className="font-bold text-slate-200 text-base border-b border-slate-800 pb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Configure New Key</span>
            </h3>

            {/* Key Size Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">{t.generator.keySizeLabel}</label>
              <div className="grid grid-cols-3 gap-2">
                {([1024, 2048, 4096] as KeySize[]).map((bits) => (
                  <button
                    key={bits}
                    type="button"
                    onClick={() => setKeySize(bits)}
                    className={`py-2 px-3 rounded-xl border text-sm font-mono font-bold transition-all relative overflow-hidden cursor-pointer ${
                      keySize === bits
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-inner'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {bits}
                    {bits === 4096 && (
                      <span className="absolute top-0 right-0 bg-rose-600 text-[8px] text-white font-sans px-1 rounded-bl leading-none py-0.5 uppercase">Max</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Key Name Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">{t.generator.keyNameLabel}</label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Production Licensing Key"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all font-medium"
              />
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">{t.generator.keyDescLabel}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write optional context or target systems..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all resize-none"
              />
            </div>

            {/* Run Generation */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg flex items-center justify-center space-x-2.5 transition-all cursor-pointer ${
                isGenerating
                  ? 'bg-slate-800 text-slate-500 cursor-wait'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/20 hover:scale-[1.01]'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                  <span>{t.generator.generating}</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>{t.generator.generateBtn}</span>
                </>
              )}
            </button>

            {/* Browser security prompt */}
            <div className="flex items-start space-x-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-slate-500 font-medium">
                Keys remain private to this user profile. We never transmit keys over the cloud. Safe for sandboxed enterprise operations.
              </p>
            </div>
          </div>
        </div>

        {/* Right Active Viewer / Database */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Database List */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-4">
              <h3 className="font-bold text-slate-200 text-base flex items-center gap-2">
                <ListFilter className="w-5 h-5 text-blue-400" />
                <span>{t.generator.savedKeysTitle}</span>
              </h3>
              
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter credentials..."
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-blue-500 transition-all font-medium sm:w-48"
              />
            </div>

            {filteredKeys.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/30 border border-dashed border-slate-800 rounded-xl">
                <Clock className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-xs font-semibold">{t.generator.noSavedKeys}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {filteredKeys.map((key) => {
                  const isSelected = selectedKey?.id === key.id;
                  return (
                    <div
                      key={key.id}
                      onClick={() => setSelectedKey(key)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-blue-600/[0.03] border-blue-500/75 shadow-lg'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors truncate max-w-[80%]">{key.name}</span>
                          <button
                            onClick={(e) => handleDelete(key.id, e)}
                            className="text-slate-600 hover:text-rose-400 p-1 rounded-md transition-colors"
                            title="Delete credential"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-slate-500 text-[11px] truncate mt-1">
                          {key.description || 'No description listed'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/50 mt-3 pt-2">
                        <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold">{key.bits}-bits</span>
                        <span className="text-[9px] font-mono text-slate-600 font-semibold">{new Date(key.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Key Detail View Sheet */}
          {selectedKey && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl animate-fade-in">
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-200">{selectedKey.name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {selectedKey.id}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(`${selectedKey.name.replace(/\s+/g, '_')}_public.pem`, selectedKey.publicKey)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 bg-slate-900 border border-slate-850 hover:bg-slate-850 transition-all cursor-pointer"
                    title="Download Public Key"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(`${selectedKey.name.replace(/\s+/g, '_')}_private.pem`, selectedKey.privateKey)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-850 hover:bg-slate-850 transition-all cursor-pointer"
                    title="Download Private Key"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-800">
                {/* Public PEM Block */}
                <div className="p-6 border-r border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-400" />
                      <span>{t.generator.pubKeyLabel}</span>
                    </span>
                    <button
                      onClick={() => handleCopy(selectedKey.publicKey, 'PUB')}
                      className="text-xs font-semibold flex items-center space-x-1 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {copiedPub ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPub ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="w-full bg-slate-950 p-4 rounded-xl text-[10px] font-mono text-slate-400 overflow-x-auto border border-slate-850/80 max-h-56">
                    {selectedKey.publicKey}
                  </pre>
                </div>

                {/* Private PEM Block */}
                <div className="p-6 space-y-3 bg-rose-950/[0.01]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t.generator.privKeyLabel}</span>
                    </span>
                    <button
                      onClick={() => handleCopy(selectedKey.privateKey, 'PRIV')}
                      className="text-xs font-semibold flex items-center space-x-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      {copiedPriv ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPriv ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="w-full bg-slate-950 p-4 rounded-xl text-[10px] font-mono text-slate-500 overflow-x-auto border border-slate-850/80 max-h-56">
                    {selectedKey.privateKey}
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

export default GeneratorView;
