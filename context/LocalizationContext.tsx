// context/LocalizationContext.tsx - DEFINITIVE CORRECTED VERSION

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import * as Localization from 'expo-localization';
import { I18n, Scope, TranslateOptions } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your translation files
import en from '../localization/en';
import tr from '../localization/tr';

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  tr: 'Türkçe',
};

const i18n = new I18n({ en, tr });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

type LocalizationContextType = {
  t: (key: Scope, options?: TranslateOptions) => string;
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  isRTL: boolean;
  locales: typeof SUPPORTED_LANGUAGES;
};

export const LocalizationContext = createContext<LocalizationContextType>(
  {} as LocalizationContextType,
);

export function LocalizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const getInitialLocale = () => {
    const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
    return Object.keys(SUPPORTED_LANGUAGES).includes(deviceLocale)
      ? deviceLocale
      : 'en';
  };

  const [locale, setLocaleState] = useState(getInitialLocale());

  // This useEffect ensures the i18n instance is always in sync with our React state
  useEffect(() => {
    i18n.locale = locale;
  }, [locale]);

  // Load saved locale only once on app start
  useEffect(() => {
    const loadSavedLocale = async () => {
      try {
        const savedLocale = await AsyncStorage.getItem('user_locale');
        if (
          savedLocale &&
          Object.keys(SUPPORTED_LANGUAGES).includes(savedLocale)
        ) {
          setLocaleState(savedLocale);
        }
      } catch (error) {
        console.error('Failed to load saved locale:', error);
      }
    };
    loadSavedLocale();
  }, []);

  const isRTL = useMemo(() => Localization.isRTL, [locale]);

  const setLocale = useCallback(async (newLocale: string) => {
    try {
      if (Object.keys(SUPPORTED_LANGUAGES).includes(newLocale)) {
        await AsyncStorage.setItem('user_locale', newLocale);
        setLocaleState(newLocale);
      }
    } catch (error) {
      console.error('Failed to set locale:', error);
    }
  }, []);

  // --- THE FIX: A ROBUST AND SIMPLE 't' FUNCTION ---
  // We remove all manual '.split()' logic and rely on the i18n-js library,
  // which is designed to handle nested keys, fallbacks, and interpolation safely.
  const t = useCallback(
    (key: Scope, options?: TranslateOptions): string => {
      // If the key is somehow invalid, return it as-is to prevent a crash.
      if (!key) {
        return String(key);
      }
      // The i18n.t function already handles nested keys like 'home.welcome'.
      // We provide the key as a defaultValue to avoid showing "missing translation" messages.
      return i18n.t(key, { defaultValue: String(key), ...options });
    },
    [locale],
  ); // This function only updates when the locale changes.

  const contextValue = useMemo(
    () => ({
      t,
      locale,
      setLocale,
      isRTL,
      locales: SUPPORTED_LANGUAGES,
    }),
    [locale, isRTL, setLocale, t],
  );

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error(
      'useLocalization must be used within a LocalizationProvider',
    );
  }
  return context;
}
