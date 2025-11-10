import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

interface RTLContextValue {
  isRTL: boolean;
  direction: 'rtl' | 'ltr';
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  getTextAlign: (defaultAlign?: 'left' | 'center' | 'right') => 'left' | 'center' | 'right';
  getFlexDirection: (defaultDirection?: 'row' | 'column' | 'row-reverse') => 'row' | 'column' | 'row-reverse';
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
  const direction: 'rtl' | 'ltr' = isRTL ? 'rtl' : 'ltr';

  const applySystemDirection = async (targetLanguage?: string | null) => {
    const shouldBeRTL = (targetLanguage ?? language) === 'he';
    // Disable automatic swapping – we handle layout manually
    if (I18nManager.swapLeftAndRightInRTL !== undefined) {
      I18nManager.swapLeftAndRightInRTL(false);
    }
    if (I18nManager.allowRTL !== undefined) {
      I18nManager.allowRTL(shouldBeRTL);
    }
    if (I18nManager.forceRTL !== undefined && I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
    }
  };

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
        await applySystemDirection(savedLanguage);
      } catch (error) {
        console.error('Failed to load language:', error);
        setLanguageState('he');
        await applySystemDirection('he');
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
      await applySystemDirection(lang);
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

  const getFlexDirection = (
    defaultDirection: 'row' | 'column' | 'row-reverse' = 'row'
  ): 'row' | 'column' | 'row-reverse' => {
    if (defaultDirection === 'column') {
      return 'column';
    }

    if (defaultDirection === 'row-reverse') {
      return isRTL ? 'row' : 'row-reverse';
    }

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