/**
 * i18n Context and Hook for Baltha Studio
 * 
 * Provides language context and hook for accessing translations throughout the app.
 * The selected language is stored in localStorage for persistence across sessions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LanguageCode, TranslationKeys, getTranslations } from './translations';

// Storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = 'baltha-studio-language';

// Default language
const DEFAULT_LANGUAGE: LanguageCode = 'EN';

// Context type
interface I18nContextType {
    language: LanguageCode;
    setLanguage: (code: LanguageCode) => void;
    t: TranslationKeys;
}

// Create context with default values
const I18nContext = createContext<I18nContextType>({
    language: DEFAULT_LANGUAGE,
    setLanguage: () => { },
    t: getTranslations(DEFAULT_LANGUAGE)
});

// Provider props
interface I18nProviderProps {
    children: ReactNode;
}

// Supported language codes for validation
const SUPPORTED_LANGUAGES: LanguageCode[] = ['EN', 'PT', 'ES', 'DE', 'FR', 'ZH'];

/**
 * Detect language from browser/OS settings
 * Maps browser language codes to our supported languages
 */
function detectBrowserLanguage(): LanguageCode {
    if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;

    // Get browser language (e.g., "en-US", "pt-BR", "zh-CN")
    const browserLang = navigator.language || (navigator as any).userLanguage || '';
    const langCode = browserLang.split('-')[0].toLowerCase();

    // Map common language codes to our supported languages
    const langMap: Record<string, LanguageCode> = {
        'en': 'EN',
        'pt': 'PT',
        'es': 'ES',
        'de': 'DE',
        'fr': 'FR',
        'zh': 'ZH',
        // Additional mappings for related languages
        'ca': 'ES', // Catalan → Spanish
        'gl': 'PT', // Galician → Portuguese
    };

    return langMap[langCode] || DEFAULT_LANGUAGE;
}

/**
 * I18nProvider - Wrap your app with this to enable translations
 */
export function I18nProvider({ children }: I18nProviderProps) {
    // Initialize from localStorage, then browser detection, then default
    const [language, setLanguageState] = useState<LanguageCode>(() => {
        if (typeof window !== 'undefined') {
            // First: check localStorage for user's explicit preference
            const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (stored && SUPPORTED_LANGUAGES.includes(stored as LanguageCode)) {
                return stored as LanguageCode;
            }
            // Second: detect from browser/OS language
            return detectBrowserLanguage();
        }
        return DEFAULT_LANGUAGE;
    });

    // Get translations for current language
    const t = getTranslations(language);

    // Set language and persist to localStorage
    const setLanguage = useCallback((code: LanguageCode) => {
        setLanguageState(code);
        if (typeof window !== 'undefined') {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
        }
    }, []);

    // Update document lang attribute when language changes
    useEffect(() => {
        if (typeof document !== 'undefined') {
            // Map our codes to HTML lang codes
            const langMap: Record<LanguageCode, string> = {
                EN: 'en',
                PT: 'pt',
                ES: 'es',
                DE: 'de',
                FR: 'fr',
                ZH: 'zh'
            };
            document.documentElement.lang = langMap[language];
        }
    }, [language]);

    const value: I18nContextType = {
        language,
        setLanguage,
        t
    };

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

/**
 * useI18n - Hook to access translations and language functions
 * 
 * Usage:
 * const { t, language, setLanguage } = useI18n();
 * <p>{t.header.welcomeText}</p>
 */
export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}

// Re-export types for convenience
export type { LanguageCode, TranslationKeys };
