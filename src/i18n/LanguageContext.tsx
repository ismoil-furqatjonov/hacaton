import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Language, LanguageContextType } from './types';
import { uz } from './translations/uz';
import { ru } from './translations/ru';
import { en } from './translations/en';

const translations: Record<Language, any> = {
  uz,
  ru,
  en,
};

const STORAGE_KEY = 'donor_language';

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'uz' || saved === 'ru' || saved === 'en') {
      return saved;
    }
    return 'uz';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.setAttribute('lang', lang);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let current: any = translations[language];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to uz
        let fallback: any = translations.uz;
        for (const fbK of keys) {
          if (fallback && typeof fallback === 'object' && fbK in fallback) {
            fallback = fallback[fbK];
          } else {
            fallback = null;
            break;
          }
        }
        current = fallback || key;
        break;
      }
    }

    let text = typeof current === 'string' ? current : key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramVal));
      });
    }

    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
