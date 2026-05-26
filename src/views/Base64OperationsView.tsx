import React, { useState, useRef } from 'react';
import { ArrowLeftRight, Copy, Check, FileUp, Loader2, Sparkles, FolderUp, Download, Terminal } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import forge from 'node-forge';

const Base64OperationsView: React.FC = () => {
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [resultText, setResultText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');
  
  // File to Base64 States
  const [encodedFile, setEncodedFile] = useState<{
    name: string;
    size: number;
    type: string;
    base64: string;
    dataUri: string;
  } | null>(null);
  const [includePrefix, setIncludePrefix] = useState(true);
  const [isFileEncoding, setIsFileEncoding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedFileBase64, setCopiedFileBase64] = useState(false);

  // Safely translate modern UTF-8 content to prevent base64 encoding/decoding failures with emojis/Chinese
  const handleEncode = () => {
    if (!inputText.trim()) {
      setError(t.base64Ops.emptyInputError);
      return;
    }
    setError(null);
    setResultText(null);
    try {
      // Robust UTF-8 encoding
      const utf8Bytes = forge.util.encodeUtf8(inputText);
      const b64 = forge.util.encode64(utf8Bytes);
      setResultText(b64);
    } catch (e: any) {
      console.error(e);
      setError("Failed to encode input content. Check for invalid characters.");
    }
  };

  const handleDecode = () => {
    if (!inputText.trim()) {
      setError(t.base64Ops.emptyInputError);
      return;
    }
    setError(null);
    setResultText(null);
    try {
      // Decode Base64 string
      const binaryString = forge.util.decode64(inputText.trim());
      const decodedUtf8 = forge.util.decodeUtf8(binaryString);
      setResultText(decodedUtf8);
    } catch (e: any) {
      console.error(e);
      setError("Failed to decode token. Input is not a valid Base64 string or has invalid character blocks.");
    }
  };

  const swapOrientation = () => {
    setMode(prev => prev === 'ENCODE' ? 'DECODE' : 'ENCODE');
    setInputText(resultText || '');
    setResultText(inputText || null);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileEncoding(true);
    setEncodedFile(null);
    
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const fullDataUri = reader.result as string;
        const base64Content = fullDataUri.split(',')[1] || '';
        setEncodedFile({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          base64: base64Content,
          dataUri: fullDataUri,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsFileEncoding(false);
      }
    };
    reader.onerror = () => {
      setIsFileEncoding(false);
      alert('Failed to read and process this file.');
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = async (text: string, trigger: 'TEXT' | 'FILE') => {
    await navigator.clipboard.writeText(text);
    if (trigger === 'TEXT') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedFileBase64(true);
      setTimeout(() => setCopiedFileBase64(false), 2000);
    }
  };

  const downloadFileBase64Text = () => {
    if (!encodedFile) return;
    const content = includePrefix ? encodedFile.dataUri : encodedFile.base64;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${encodedFile.name}_base64.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
            <ArrowLeftRight className="w-8 h-8 text-amber-400" />
            <span>{t.base64Ops.title}</span>
          </h2>
          <p className="text-slate-400 mt-2 text-sm max-w-2xl">{t.base64Ops.subtitle}</p>
        </div>
        <div className="flex items-center space-x-2 bg-amber-950/40 border border-amber-900/30 px-3 py-1.5 rounded-xl text-amber-400 text-xs font-mono font-bold select-none">
          <Terminal className="w-4 h-4 animate-pulse" />
          <span>RFC 4648 Compliant</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interactive String Converter block */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Interactive Text Converter</span>
              <button
                type="button"
                onClick={swapOrientation}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 hover:bg-slate-850 hover:text-white text-slate-400 transition-colors border border-slate-850 cursor-pointer"
                title="Swap encoding direction"
              >
                <span>{mode === 'ENCODE' ? 'String ➔ Base64' : 'Base64 ➔ String'}</span>
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.base64Ops.inputLabel}</label>
              <textarea
                value={inputText}
                onChange={(e) => { setInputText(e.target.value); setResultText(null); setError(null); }}
                placeholder={mode === 'ENCODE' ? t.base64Ops.inputPlaceholder : 'Paste Base64 data string here...'}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none h-44 transition-all"
              />
            </div>

            <button
              onClick={mode === 'ENCODE' ? handleEncode : handleDecode}
              disabled={!inputText.trim()}
              className={`w-full py-3.5 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer shadow-lg uppercase ${
                !inputText.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-505 hover:to-yellow-400 text-white'
              }`}
            >
              {mode === 'ENCODE' ? t.base64Ops.encodeBtn : t.base64Ops.decodeBtn}
            </button>
          </div>

          {error && (
            <div className="bg-rose-950/20 border border-rose-500/40 p-4 rounded-xl text-rose-300 text-xs font-semibold leading-relaxed animate-fade-in mt-4">
              {error}
            </div>
          )}

          {resultText && (
            <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden mt-6 animate-fade-in flex flex-col">
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-850 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">{t.base64Ops.resultLabel}</span>
                <button
                  onClick={() => copyToClipboard(resultText, 'TEXT')}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.base64Ops.copied : t.base64Ops.copy}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-300 break-all select-all overflow-y-auto max-h-48 whitespace-pre-wrap leading-relaxed bg-slate-955">
                {resultText}
              </pre>
            </div>
          )}
        </div>

        {/* File to Base64 Encoder block */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.base64Ops.binaryConvert}</span>
              <span className="text-[10px] font-mono font-bold bg-slate-800/60 border border-slate-800 px-2 py-0.5 rounded text-slate-500">Fast Local Encoding</span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-slate-700/60 bg-slate-950/50 hover:bg-slate-950/80 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-48"
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {isFileEncoding ? (
                <div className="space-y-3 flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="text-xs text-slate-500 font-semibold">Transforming file buffer to Base64...</p>
                </div>
              ) : encodedFile ? (
                <div className="space-y-2 text-center animate-fade-in">
                  <FolderUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-bold text-xs text-slate-300 truncate max-w-xs">{encodedFile.name}</p>
                  <p className="text-[10px] font-mono font-semibold text-slate-500">{(encodedFile.size / 1024).toFixed(1)} KB • {encodedFile.type}</p>
                </div>
              ) : (
                <div className="space-y-3 flex flex-col items-center">
                  <FileUp className="w-8 h-8 text-slate-600" />
                  <div>
                    <h4 className="font-semibold text-xs text-slate-300">{t.base64Ops.binaryUploadLabel}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">{t.base64Ops.binaryHint}</p>
                  </div>
                </div>
              )}
            </div>

            {encodedFile && (
              <div className="flex items-center justify-between bg-slate-950 border border-slate-850 p-3 rounded-lg">
                <span className="text-xs text-slate-400 font-semibold">Include Data-URI Prefix</span>
                <input
                  type="checkbox"
                  checked={includePrefix}
                  onChange={() => setIncludePrefix(!includePrefix)}
                  className="h-4 w-4 bg-slate-900 border-slate-700 focus:ring-amber-500 rounded text-amber-500"
                />
              </div>
            )}
          </div>

          {encodedFile && (
            <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden mt-6 animate-fade-in">
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-850 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Base64 Output Stream</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => copyToClipboard(includePrefix ? encodedFile.dataUri : encodedFile.base64, 'FILE')}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedFileBase64 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFileBase64 ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={downloadFileBase64Text}
                    className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    title="Download string as txt file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>TXT</span>
                  </button>
                </div>
              </div>
              <div className="p-4 bg-slate-955 max-h-40 overflow-y-auto font-mono text-[9px] text-slate-400 break-all select-all leading-normal">
                {includePrefix ? encodedFile.dataUri : encodedFile.base64}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Base64OperationsView;
