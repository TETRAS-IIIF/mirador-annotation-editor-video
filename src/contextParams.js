/**
 * Utility file to set config via URL search params
 * or Mirador config (under `annotation`).
 * URL params take precedence over config values.
 *
 * Types:
 *   - boolean:  "true" / "false"
 *   - string:   any string value
 *   - number:   numeric value
 *   - array:    comma-separated strings
 */
import { useMemo } from 'react';

// Available parameters: extend this object to add new context parameters
const PARAM_DEFINITIONS = {
  editMode: { default: false, type: 'boolean' },
};

const parsers = {
  array: (value) => (value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []),
  boolean: (value) => value === 'true',
  number: (value) => { const n = Number(value); return Number.isNaN(n) ? null : n; },
  string: (value) => value || null,
};

let urlParams = null;

/**
 * URL param parsed on page load
 * @returns {object} { paramName: paramValue }
 */
function getUrlParams() {
  if (!urlParams) {
    const searchParams = new URLSearchParams(window.location.search);
    urlParams = {};
    Object.entries(PARAM_DEFINITIONS).forEach(([key, def]) => {
      const raw = searchParams.get(key);
      if (raw !== null) {
        urlParams[key] = parsers[def.type](raw);
      }
    });
  }
  return urlParams;
}

/**
 * Resolve context parameters by merging (in priority order):
 *   1. URL search params
 *   2. config.annotation (from Mirador config)
 *   3. PARAM_DEFINITIONS defaults
 *
 * @param {object} config - Mirador config object (or subset containing `annotation`).
 * @returns {object} Resolved parameters keyed by name.
 */
export function getContextParams(config) {
  const url = getUrlParams();
  const result = {};

  Object.entries(PARAM_DEFINITIONS).forEach(([key, def]) => {
    if (key in url) {
      result[key] = url[key];
    } else if (config?.annotation?.[key] !== undefined) {
      result[key] = config.annotation[key];
    } else {
      result[key] = def.default;
    }
  });

  return result;
}

/**
 * React hook
 * @param {object} config - Mirador config object.
 * @returns {object} Resolved parameters (stable reference while config is unchanged).
 */
export function useContextParams(config) {
  return useMemo(() => getContextParams(config), [config]);
}
