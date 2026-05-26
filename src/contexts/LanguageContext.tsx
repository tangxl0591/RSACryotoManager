import React, { createContext, useContext, useState } from 'react';
import { translations, AppTranslations } from '../locales';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  t: AppTranslations;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('rsa_suite_lang');
    if (saved === 'en' || saved === 'zh') return saved;
    // Auto detect language
    return navigator.language.startsWith('zh') ? 'zh' : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('rsa_suite_lang', lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
