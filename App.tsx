import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import GeneratorView from './views/GeneratorView';
import OperationsView from './views/OperationsView';
import { LanguageProvider } from './contexts/LanguageContext';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'GENERATE' | 'OPERATIONS'>('GENERATE');

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden text-slate-200">
      {/* Sidebar Navigation */}
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto bg-gradient-to-br from-slate-950 to-slate-900 relative">
        <div className="absolute top-0 right-0 p-4 opacity-50 pointer-events-none">
          <div className="w-96 h-96 bg-blue-500/10 rounded-full blur-3xl filter mix-blend-screen"></div>
        </div>
        
        {currentView === 'GENERATE' && <GeneratorView />}
        {currentView === 'OPERATIONS' && <OperationsView />}
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