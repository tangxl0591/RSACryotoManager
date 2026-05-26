import React from 'react';
import { Key, FileDigit, FileText, Code2, Globe, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export type ViewState = 'GENERATE' | 'OPERATIONS' | 'TEXT_OPERATIONS' | 'BASE64_OPERATIONS';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  savedKeysCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, savedKeysCount }) => {
  const { language, t, setLanguage } = useLanguage();

  const menuItems = [
    { id: 'GENERATE' as ViewState, icon: Key, label: t.sidebar.genKey, color: 'text-emerald-400' },
    { id: 'OPERATIONS' as ViewState, icon: FileDigit, label: t.sidebar.ops, color: 'text-blue-400' },
    { id: 'TEXT_OPERATIONS' as ViewState, icon: FileText, label: t.sidebar.textOps, color: 'text-purple-400' },
    { id: 'BASE64_OPERATIONS' as ViewState, icon: Code2, label: t.sidebar.base64Ops, color: 'text-amber-400' },
  ];

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-y-auto select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-xl shadow-lg ring-4 ring-blue-500/10">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-100 tracking-wide">{t.sidebar.title}</h1>
          <span className="text-xs font-mono text-blue-400 bg-blue-950/50 border border-blue-900/30 px-2 py-0.5 rounded">v1.2.0-secure</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <nav className="flex-1 p-4 space-y-2.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 outline-none group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-950/80 to-slate-900 border border-blue-500/30 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 duration-200 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="font-medium text-[14.5px] leading-none">{item.label}</span>
              </div>
              
              {item.id === 'GENERATE' && savedKeysCount > 0 && (
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-blue-950 text-blue-300 ring-1 ring-blue-400/20' : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-700/80'
                }`}>
                  {savedKeysCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Language / Translation Toggle Footer */}
      <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium tracking-wide prose uppercase">Workspace Language</span>
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600 transition-all cursor-pointer font-mono"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'en' ? '简体中文' : 'English'}</span>
          </button>
        </div>
        
        <div className="text-[11px] text-slate-600 font-mono text-center">
          Entirely Private • Client-Side Only
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
