'use client';

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
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

const LOCALE_CHANGE_EVENT = 'dashboard-locale-change';

function subscribeToLocale(callback: () => void) {
  window.addEventListener(LOCALE_CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(LOCALE_CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function getLocaleSnapshot(): Locale {
  const stored = localStorage.getItem(LOCALE_KEY);
  return stored === 'en' || stored === 'es' ? stored : DEFAULT_LOCALE;
}

function getServerLocaleSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export function DashboardI18nProvider({ children, defaultTimezone }: ProviderProps) {
  // Locale is persisted in localStorage; useSyncExternalStore hydrates it
  // safely (server snapshot avoids SSR mismatch) and stays in sync.
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );

  const [timezone, setTimezone] = useState<string>(defaultTimezone);

  // Sync timezone when the server re-renders with new settings
  // (state adjusted during render — see react.dev "You Might Not Need an Effect")
  const [prevDefaultTimezone, setPrevDefaultTimezone] = useState(defaultTimezone);
  if (prevDefaultTimezone !== defaultTimezone) {
    setPrevDefaultTimezone(defaultTimezone);
    setTimezone(defaultTimezone);
  }

  function setLocale(next: Locale) {
    localStorage.setItem(LOCALE_KEY, next);
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
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
