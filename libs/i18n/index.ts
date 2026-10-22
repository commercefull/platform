/**
 * `libs/i18n` — CLDR locale primitives below the commerce layer.
 *
 * Shared kernel: no dependencies on `modules/*` or `web/*`, no I/O.
 */

export { createLocaleContext, languageOf, measurementSystemOf, textDirectionOf } from './localeContext';
export type { LocaleContext, MeasurementSystem, TextDirection } from './localeContext';
export { createCollator, formatDate, formatDateTime, formatNumber, formatPercent, formatUnit, sortLocalized } from './formatters';
