import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your translation files
import en from '../localization/en';
import tr from '../localization/tr';

// Define supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  tr: 'Türkçe',
};

// Set up i18n instance
const i18n = new I18n({
  en,
  tr,
});

// Default to device locale if available and supported
i18n.locale = Object.keys(SUPPORTED_LANGUAGES).includes(
  Localization.locale.split('-')[0],
)
  ? Localization.locale.split('-')[0]
  : 'en';

// Enable fallbacks to prevent missing translation errors
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Define Localization Context type
type LocalizationContextType = {
  t: (key: string, options?: Record<string, any>) => string;
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  isRTL: boolean;
  locales: typeof SUPPORTED_LANGUAGES;
};

// Create context with default values
export const LocalizationContext = createContext<LocalizationContextType>({
  t: (key) => key,
  locale: 'en',
  setLocale: async () => {},
  isRTL: false,
  locales: SUPPORTED_LANGUAGES,
});

// Provider component
export function LocalizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState(i18n.locale);

  // Check if the current locale is RTL
  const isRTL = React.useMemo(() => {
    return ['ar', 'he', 'fa', 'ur'].includes(locale);
  }, [locale]);

  // Initialize localization
  useEffect(() => {
    const loadSavedLocale = async () => {
      try {
        const savedLocale = await AsyncStorage.getItem('user_locale');

        if (
          savedLocale &&
          Object.keys(SUPPORTED_LANGUAGES).includes(savedLocale)
        ) {
          i18n.locale = savedLocale;
          setLocaleState(savedLocale);
        }
      } catch (error) {
        console.error('Failed to load saved locale:', error);
      }
    };

    loadSavedLocale();
  }, []);

  // Update locale and save to storage
  const setLocale = async (newLocale: string) => {
    try {
      if (Object.keys(SUPPORTED_LANGUAGES).includes(newLocale)) {
        i18n.locale = newLocale;
        setLocaleState(newLocale);
        await AsyncStorage.setItem('user_locale', newLocale);
      }
    } catch (error) {
      console.error('Failed to set locale:', error);
    }
  };

  // Translation function that handles nested paths like 'home.welcome'
  const t = (key: string, options?: Record<string, any>): string => {
    // Handle nested paths
    const keyParts = key.split('.');

    if (keyParts.length === 1) {
      return i18n.t(key, options);
    }

    try {
      let translation = i18n.translations[i18n.locale];

      for (const part of keyParts) {
        if (
          translation &&
          typeof translation === 'object' &&
          part in translation
        ) {
          translation = translation[part];
        } else {
          // If the nested path doesn't exist, try falling back to the full key
          return i18n.t(key, options) || key;
        }
      }

      if (typeof translation === 'string') {
        return translation;
      }

      // Fallback to the key itself if translation is not a string
      return key;
    } catch (error) {
      console.error(`Translation error for key "${key}":`, error);
      return key;
    }
  };

  return (
    <LocalizationContext.Provider
      value={{
        t,
        locale,
        setLocale,
        isRTL,
        locales: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

// Custom hook to use the localization context
export function useLocalization() {
  const context = useContext(LocalizationContext);

  if (!context) {
    throw new Error(
      'useLocalization must be used within a LocalizationProvider',
    );
  }

  return context;
}
