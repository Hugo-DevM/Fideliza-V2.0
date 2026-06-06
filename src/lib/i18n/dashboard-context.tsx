'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { dashboardEs, type DashboardDictionary } from './dashboard/es';
import { dashboardEn } from './dashboard/en';
import type { Locale } from './index';

const LOCALE_KEY    = 'dashboard-locale';
const DEFAULT_LOCALE: Locale = 'es';
const DEFAULT_TZ    = 'America/Mexico_City';

const dictionaries: Record<Locale, DashboardDictionary> = {
  es: dashboardEs,
  en: dashboardEn,
};

interface DashboardI18nContextValue {
  locale:   Locale;
  setLocale: (locale: Locale) => void;
  timezone: string;
  t: DashboardDictionary;
}

const DashboardI18nContext = createContext<DashboardI18nContextValue>({
  locale:   DEFAULT_LOCALE,
  setLocale: () => {},
  timezone: DEFAULT_TZ,
  t: dashboardEs,
});

interface ProviderProps {
  children:        ReactNode;
  defaultTimezone: string;
}

export function DashboardI18nProvider({ children, defaultTimezone }: ProviderProps) {
  const [locale,   setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [timezone, setTimezone]    = useState<string>(defaultTimezone);

  // Hydrate locale from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === 'en' || stored === 'es') setLocaleState(stored);
  }, []);

  // Sync timezone when the server re-renders with new settings
  useEffect(() => {
    setTimezone(defaultTimezone);
  }, [defaultTimezone]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    localStorage.setItem(LOCALE_KEY, next);
  }

  return (
    <DashboardI18nContext.Provider
      value={{ locale, setLocale, timezone, t: dictionaries[locale] }}
    >
      {children}
    </DashboardI18nContext.Provider>
  );
}

export function useDashboardI18n() {
  return useContext(DashboardI18nContext);
}
