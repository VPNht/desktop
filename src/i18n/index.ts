import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';

// Import all language files
import en from './locales/en.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import bg from './locales/bg.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ru from './locales/ru.json';
import ar from './locales/ar.json';
import he from './locales/he.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  de: { translation: de },
  es: { translation: es },
  pt: { translation: pt },
  bg: { translation: bg },
  zh: { translation: zh },
  ja: { translation: ja },
  ru: { translation: ru },
  ar: { translation: ar },
  he: { translation: he },
};

// RTL languages
export const RTL_LANGUAGES = ['ar', 'he'];

// Language names for display
export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  bg: 'Български',
  zh: '中文',
  ja: '日本語',
  ru: 'Русский',
  ar: 'العربية',
  he: 'עברית',
};

// Supported languages
export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_NAMES);

// Default language
export const DEFAULT_LANGUAGE = 'en';

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
      lookupLocalStorage: 'vpnht-language',
    },
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: false,
    },
  });

// Helper to check if language is RTL
export function isRTL(language: string): boolean {
  return RTL_LANGUAGES.includes(language);
}

// Helper to get current language direction
export function getTextDirection(language: string = i18n.language): 'ltr' | 'rtl' {
  return isRTL(language) ? 'rtl' : 'ltr';
}

// Helper to change language
export function setLanguage(language: string): void {
  i18n.changeLanguage(language);
}

export default i18n;