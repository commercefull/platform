/**
 * LocaleContext — Shared Kernel
 *
 * Country-neutral locale context carried through request resolution and
 * passed to CLDR formatters. Separates *how the customer reads* (language,
 * script, direction, timezone, measurement system) from *where they buy*
 * (market) and *where goods ship* (destination country).
 *
 * Admission criteria (mirrors `libs/money.ts`):
 * - No dependencies on `modules/*` or `web/*`, no I/O.
 * - Pure data + derivation helpers.
 */

/** BCP 47 text direction for rendered HTML (`dir` attribute). */
export type TextDirection = 'ltr' | 'rtl';

/** Measurement system preference for weight/dimension units. */
export type MeasurementSystem = 'metric' | 'imperial' | 'us';

export interface LocaleContext {
  /** Full BCP 47 locale, e.g. 'en-GB', 'de-DE', 'ja-JP', 'ar-AE'. */
  locale: string;
  /** ISO 639-1 language subtag, e.g. 'en', 'de', 'ja', 'ar'. */
  language: string;
  /** Text direction derived from the locale script. */
  textDirection: TextDirection;
  /** IANA timezone for customer-facing date rendering, e.g. 'Europe/Paris'. */
  timeZone?: string;
  /** Preferred measurement system (metric for most of the world). */
  measurementSystem: MeasurementSystem;
}

/** Scripts/languages rendered right-to-left. */
const RTL_LANGUAGES = new Set(['ar', 'arc', 'dv', 'fa', 'ha', 'he', 'khw', 'ks', 'ku', 'ps', 'ur', 'yi']);

/** Countries whose conventional measurement system is non-metric. */
const IMPERIAL_COUNTRIES = new Set(['US', 'LR', 'MM']);

/** Parse the language subtag out of a BCP 47 locale string. */
export function languageOf(locale: string): string {
  return locale.split(/[-_]/)[0]?.toLowerCase() ?? 'en';
}

/** Derive text direction from a BCP 47 locale. */
export function textDirectionOf(locale: string): TextDirection {
  return RTL_LANGUAGES.has(languageOf(locale)) ? 'rtl' : 'ltr';
}

/**
 * Derive a measurement system from a locale's region subtag.
 * 'en-US' → 'us'; 'en-GB' → 'imperial' (UK conventionally mixes);
 * everything else → 'metric'.
 */
export function measurementSystemOf(locale: string): MeasurementSystem {
  const region = locale.split(/[-_]/)[1]?.toUpperCase();
  if (region === 'US') return 'us';
  if (region && IMPERIAL_COUNTRIES.has(region)) return 'imperial';
  if (region === 'GB') return 'imperial';
  return 'metric';
}

/** Build a `LocaleContext` from a BCP 47 locale string. */
export function createLocaleContext(locale: string, timeZone?: string): LocaleContext {
  return {
    locale,
    language: languageOf(locale),
    textDirection: textDirectionOf(locale),
    timeZone,
    measurementSystem: measurementSystemOf(locale),
  };
}
