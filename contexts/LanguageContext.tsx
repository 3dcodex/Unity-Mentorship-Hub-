import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.mentorship': 'Mentorship',
    'nav.career': 'Career Tools',
    'nav.resources': 'Resources',
    'footer.subscribe': 'Subscribe',
    'footer.stayUpdated': 'Stay Updated',
    'footer.subscribeDesc': 'Subscribe to get the latest mentorship tips and career resources.',
    'footer.emailPlaceholder': 'your@email.com',
    'footer.copyright': 'All rights reserved. Empowering student success everywhere.',
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.dashboard': 'Tableau de bord',
    'nav.mentorship': 'Mentorat',
    'nav.career': 'Outils de carrière',
    'nav.resources': 'Ressources',
    'footer.subscribe': 'S\'abonner',
    'footer.stayUpdated': 'Restez informé',
    'footer.subscribeDesc': 'Abonnez-vous pour recevoir les derniers conseils de mentorat et ressources de carrière.',
    'footer.emailPlaceholder': 'votre@email.com',
    'footer.copyright': 'Tous droits réservés. Autonomiser la réussite des étudiants partout.',
  },
  es: {
    'nav.home': 'Inicio',
    'nav.dashboard': 'Panel',
    'nav.mentorship': 'Mentoría',
    'nav.career': 'Herramientas de carrera',
    'nav.resources': 'Recursos',
    'footer.subscribe': 'Suscribirse',
    'footer.stayUpdated': 'Mantente actualizado',
    'footer.subscribeDesc': 'Suscríbete para recibir los últimos consejos de mentoría y recursos profesionales.',
    'footer.emailPlaceholder': 'tu@email.com',
    'footer.copyright': 'Todos los derechos reservados. Empoderando el éxito estudiantil en todas partes.',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
