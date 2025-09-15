
import { useState, useEffect } from 'react';
import { I18nService, t } from '@/lib/i18n';

export const useI18n = () => {
  const [currentLanguage, setCurrentLanguage] = useState(I18nService.getLanguage());

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail);
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  const changeLanguage = (lang: string) => {
    I18nService.setLanguage(lang);
  };

  return {
    currentLanguage,
    changeLanguage,
    t: (key: string) => t(key, currentLanguage),
  };
};
