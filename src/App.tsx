import React, { useState, useEffect } from 'react';
import Sidebar, { ViewState } from './components/Sidebar';
import GeneratorView from './views/GeneratorView';
import OperationsView from './views/OperationsView';
import TextOperationsView from './views/TextOperationsView';
import Base64OperationsView from './views/Base64OperationsView';
import { LanguageProvider } from './contexts/LanguageContext';
import { getSavedKeys } from './services/keyStorage';
import { Shield } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('GENERATE');
  const [savedKeysCount, setSavedKeysCount] = useState(0);

  const updateKeysCount = () => {
    setSavedKeysCount(getSavedKeys().length);
  };

  useEffect(() => {
    updateKeysCount();
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans antialiased text-slate-100">
      {/* Sidebar Component */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        savedKeysCount={savedKeysCount}
      />

      {/* Main Container View area */}
      <main className="flex-1 h-full overflow-y-auto bg-[#0a0f1d] relative">
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Dynamic Screens */}
        <div className="relative z-10 w-full min-h-full flex flex-col justify-between">
          <div className="flex-1">
            {currentView === 'GENERATE' && (
              <GeneratorView onKeyChange={updateKeysCount} />
            )}
            {currentView === 'OPERATIONS' && (
              <OperationsView />
            )}
            {currentView === 'TEXT_OPERATIONS' && (
              <TextOperationsView />
            )}
            {currentView === 'BASE64_OPERATIONS' && (
              <Base64OperationsView />
            )}
          </div>

          {/* Persistent subtle platform footer */}
          <footer className="border-t border-slate-900/60 p-5 mt-auto text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-600 font-mono relative z-20 max-w-6xl mx-auto w-full">
            <div className="flex items-center space-x-1.5 justify-center">
              <Shield className="w-4 h-4 text-emerald-500/80" />
              <span>Full-Stack Security Suite • Parity Verified</span>
            </div>
            <span>All operations completed locally on sandbox memory.</span>
          </footer>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
