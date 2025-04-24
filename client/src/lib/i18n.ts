import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Available languages for the application
export const LANGUAGES = {
  en: { nativeName: 'English' },
  es: { nativeName: 'Español' },
  fr: { nativeName: 'Français' },
  de: { nativeName: 'Deutsch' },
  zh: { nativeName: '中文' },
  ja: { nativeName: '日本語' },
  ko: { nativeName: '한국어' },
  ru: { nativeName: 'Русский' }
};

// Translation resources - hardcoded for simplicity
const resources = {
  en: {
    translation: {
      "app": {
        "title": "AI-Powered Shopify Chatbot",
        "loading": "Loading...",
        "welcome": "Welcome to your AI-Powered Shopify Chatbot"
      },
      "navigation": {
        "dashboard": "Dashboard",
        "conversations": "Conversations",
        "products": "Products",
        "faqs": "FAQs",
        "settings": "Settings",
        "logout": "Logout"
      },
      "auth": {
        "login": "Login",
        "register": "Register"
      },
      "settings": {
        "language": {
          "title": "Language Settings",
          "description": "Configure language preferences for your chatbot",
          "defaultLanguage": "Default Language",
          "defaultDescription": "This language will be used as the default for all chatbot conversations",
          "currentLanguage": "Current UI Language",
          "supportedLanguages": "Supported Languages"
        },
        "saving": "Saving...",
        "saveSettings": "Save Settings"
      },
      "common": {
        "save": "Save",
        "loading": "Loading..."
      }
    }
  },
  es: {
    translation: {
      "app": {
        "title": "Chatbot de Shopify con IA",
        "loading": "Cargando...",
        "welcome": "Bienvenido a tu Chatbot de Shopify con IA"
      },
      "navigation": {
        "dashboard": "Panel de Control",
        "conversations": "Conversaciones",
        "products": "Productos",
        "faqs": "Preguntas Frecuentes",
        "settings": "Configuración",
        "logout": "Cerrar Sesión"
      },
      "auth": {
        "login": "Iniciar Sesión",
        "register": "Registrarse"
      },
      "settings": {
        "language": {
          "title": "Configuración de Idioma",
          "description": "Configura las preferencias de idioma para tu chatbot",
          "defaultLanguage": "Idioma Predeterminado",
          "defaultDescription": "Este idioma se utilizará como predeterminado para todas las conversaciones del chatbot",
          "currentLanguage": "Idioma Actual de la Interfaz",
          "supportedLanguages": "Idiomas Soportados"
        },
        "saving": "Guardando...",
        "saveSettings": "Guardar Configuración"
      },
      "common": {
        "save": "Guardar",
        "loading": "Cargando..."
      }
    }
  }
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV === 'development',
    // Fallback language if translation not found
    fallbackLng: 'en',
    // Supported languages
    supportedLngs: [...Object.keys(LANGUAGES), 'cimode'],
    // Default namespace
    defaultNS: 'translation',
    // Resources with translations
    resources,
    // React i18next special options
    react: {
      useSuspense: true,
    },
    // Default format for dates, numbers etc.
    interpolation: {
      escapeValue: false, // not needed for React
    }
  });

export default i18n;