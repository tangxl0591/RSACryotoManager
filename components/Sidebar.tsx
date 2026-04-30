import React from 'react';
import { Key, Lock, ShieldCheck, FileText, Code2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export type ViewState = 'GENERATE' | 'OPERATIONS' | 'TEXT_OPERATIONS' | 'BASE64_OPERATIONS';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
        <ShieldCheck className="w-8 h-8 text-blue-500" />
        <h1 className="text-xl font-bold text-white tracking-tight">{t.sidebar.title}</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => onNavigate('GENERATE')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
            currentView === 'GENERATE'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Key className="w-5 h-5" />
          <span className="font-medium">{t.sidebar.genKey}</span>
        </button>

        <button
          onClick={() => onNavigate('OPERATIONS')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
            currentView === 'OPERATIONS'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Lock className="w-5 h-5" />
          <span className="font-medium">{t.sidebar.ops}</span>
        </button>

        <button
          onClick={() => onNavigate('TEXT_OPERATIONS')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
            currentView === 'TEXT_OPERATIONS'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="font-medium">{t.sidebar.textOps}</span>
        </button>

        <button
          onClick={() => onNavigate('BASE64_OPERATIONS')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
            currentView === 'BASE64_OPERATIONS'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-5 h-5" />
          <span className="font-medium">{t.sidebar.base64Ops}</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between bg-slate-800 rounded p-1 mb-4">
          <button 
            onClick={() => setLanguage('en')}
            className={`flex-1 text-xs py-1 rounded transition-colors ${language === 'en' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLanguage('zh')}
            className={`flex-1 text-xs py-1 rounded transition-colors ${language === 'zh' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
          >
            中文
          </button>
        </div>
        <div className="text-xs text-slate-500">
          <p>{t.sidebar.build}</p>
          <p>v1.1.0 (Hybrid AES-256)</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;