import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

interface RTLContextValue {
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  getTextAlign: (defaultAlign?: 'left' | 'center' | 'right') => 'left' | 'center' | 'right';
  getFlexDirection: (defaultDirection?: 'row' | 'column') => 'row' | 'row-reverse' | 'column';
  getMarginStart: (value: number) => { marginLeft?: number; marginRight?: number };
  getMarginEnd: (value: number) => { marginLeft?: number; marginRight?: number };
  getPaddingStart: (value: number) => { paddingLeft?: number; paddingRight?: number };
  getPaddingEnd: (value: number) => { paddingLeft?: number; paddingRight?: number };
}

const RTLContext = createContext<RTLContextValue | undefined>(undefined);

const LANGUAGE_KEY = '@app_language';

interface RTLProviderProps {
  children: React.ReactNode;
}

export const RTLProvider: React.FC<RTLProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('he');
  const [isInitialized, setIsInitialized] = useState(false);

  const isRTL = language === 'he';
  const direction: 'ltr' | 'rtl' = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage) {
          setLanguageState(savedLanguage);
        } else {
          // Default to Hebrew for Israeli market
          await AsyncStorage.setItem(LANGUAGE_KEY, 'he');
          setLanguageState('he');
        }
      } catch (error) {
        console.error('Failed to load language:', error);
        setLanguageState('he');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeLanguage();
  }, []);

  const setLanguage = async (lang: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const getTextAlign = (defaultAlign: 'left' | 'center' | 'right' = 'left'): 'left' | 'center' | 'right' => {
    if (defaultAlign === 'center') return 'center';
    if (isRTL) {
      return defaultAlign === 'left' ? 'right' : 'left';
    }
    return defaultAlign;
  };

  const getFlexDirection = (defaultDirection: 'row' | 'column' = 'row'): 'row' | 'row-reverse' | 'column' => {
    if (defaultDirection === 'column') return 'column';
    return isRTL ? 'row-reverse' : 'row';
  };

  const getMarginStart = (value: number) => {
    return isRTL ? { marginRight: value } : { marginLeft: value };
  };

  const getMarginEnd = (value: number) => {
    return isRTL ? { marginLeft: value } : { marginRight: value };
  };

  const getPaddingStart = (value: number) => {
    return isRTL ? { paddingRight: value } : { paddingLeft: value };
  };

  const getPaddingEnd = (value: number) => {
    return isRTL ? { paddingLeft: value } : { paddingRight: value };
  };

  const value: RTLContextValue = {
    isRTL,
    direction,
    language,
    setLanguage,
    getTextAlign,
    getFlexDirection,
    getMarginStart,
    getMarginEnd,
    getPaddingStart,
    getPaddingEnd,
  };

  // Provide safe defaults during initialization
  const defaultValue: RTLContextValue = {
    isRTL: true, // Default to Hebrew RTL
    direction: 'rtl',
    language: 'he',
    setLanguage,
    getTextAlign,
    getFlexDirection,
    getMarginStart,
    getMarginEnd,
    getPaddingStart,
    getPaddingEnd,
  };

  return <RTLContext.Provider value={isInitialized ? value : defaultValue}>{children}</RTLContext.Provider>;
};

export const useRTL = (): RTLContextValue => {
  const context = useContext(RTLContext);
  if (context === undefined) {
    throw new Error('useRTL must be used within an RTLProvider');
  }
  return context;
};