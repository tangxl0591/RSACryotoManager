import React, { useState } from 'react';
import { ArrowRightLeft, Loader2, AlertCircle, Check, Copy } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Base64OperationsView: React.FC = () => {
  const { t } = useLanguage();
  const [operation, setOperation] = useState<'ENCODE' | 'DECODE'>('ENCODE');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const processText = () => {
    if (!inputText.trim()) {
      setError(t.base64Ops.emptyInputError);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResultText(null);

    try {
      let processedText: string;
      if (operation === 'ENCODE') {
        processedText = btoa(unescape(encodeURIComponent(inputText)));
      } else {
        processedText = decodeURIComponent(escape(atob(inputText.trim())));
      }
      setResultText(processedText);
    } catch (err: any) {
      console.error(err);
      setError(`Operation failed: Invalid input format.`);
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

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{t.base64Ops.title}</h2>
        <p className="text-slate-400">{t.base64Ops.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <label className="block text-sm font-medium text-slate-300 mb-3">{t.operations.mode}</label>
            <div className="flex flex-col space-y-2 bg-slate-900 p-1 rounded-lg">
              <button
                onClick={() => { setOperation('ENCODE'); setResultText(null); setError(null); }}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors text-center ${
                  operation === 'ENCODE' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.base64Ops.encodeBtn}
              </button>
              <button
                onClick={() => { setOperation('DECODE'); setResultText(null); setError(null); }}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors text-center ${
                  operation === 'DECODE' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.base64Ops.decodeBtn}
              </button>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col min-h-[300px]">
            <label className="block text-sm font-medium text-slate-300 mb-2">{t.base64Ops.inputLabel}</label>
            <textarea
              className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm mb-6"
              placeholder={t.base64Ops.inputPlaceholder}
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); setResultText(null); setError(null); }}
            />

            <button
              onClick={processText}
              disabled={isProcessing || !inputText.trim()}
              className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center space-x-2 transition-all ${
                isProcessing || !inputText.trim()
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : operation === 'ENCODE'
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
                  <ArrowRightLeft className="w-5 h-5" />
                  <span>{operation === 'ENCODE' ? t.base64Ops.encodeBtn : t.base64Ops.decodeBtn}</span>
                </>
              )}
            </button>
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
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
                  <span className="text-sm font-medium text-slate-400">
                    {t.base64Ops.resultLabel}
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

export default Base64OperationsView;
