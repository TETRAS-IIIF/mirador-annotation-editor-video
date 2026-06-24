import '@testing-library/jest-dom'; // add this import to make toBeInTheDocument work
import { vi } from 'vitest';

// Provide a minimal in-memory localStorage polyfill for Node environments
// (Node's built-in localStorage requires the --localstorage-file flag).
if (typeof globalThis.localStorage === 'undefined' || globalThis.localStorage === null) {
  let _store = Object.create(null);
  globalThis.localStorage = {
    getItem: (key) => (_store[key] === undefined ? null : _store[key]),
    setItem: (key, value) => { _store[key] = String(value); },
    removeItem: (key) => { delete _store[key]; },
    clear: () => { _store = Object.create(null); },
  };
}

// tests/test-i18n-setup.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Minimal resources; keys render as-is if not found.
await i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  lng: 'en',
  react: {
    // Prevent adding tReady/t to DOM by internal HOCs
    useSuspense: false,
  },
  resources: {
    en: { translation: {} },
  },
});

export { i18n };
