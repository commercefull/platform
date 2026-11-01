/**
 * CLDR Formatters — Shared Kernel
 *
 * Thin, locale-aware wrappers over `Intl` for dates, numbers, units, and
 * collation. All commerce-domain rendering of customer-facing values should
 * route through these so locale behaviour stays below the commerce layer.
 *
 * Admission criteria (mirrors `libs/money.ts`):
 * - No dependencies on `modules/*` or `web/*`, no I/O.
 * - Pure `Intl` wrappers; `LocaleContext` from `libs/i18n/localeContext`.
 */

import type { LocaleContext } from './localeContext';

const FALLBACK_LOCALE = 'en-US';

function localeTag(ctx: LocaleContext | undefined): string {
  return ctx?.locale ?? FALLBACK_LOCALE;
}

function timeZoneOf(ctx: LocaleContext | undefined): string | undefined {
  return ctx?.timeZone;
}

/** Format a date for display (no time component). */
export function formatDate(date: Date | string | number, ctx?: LocaleContext): string {
  return new Intl.DateTimeFormat(localeTag(ctx), {
    dateStyle: 'medium',
    timeZone: timeZoneOf(ctx),
  }).format(new Date(date));
}

/** Format a date + time for display. */
export function formatDateTime(date: Date | string | number, ctx?: LocaleContext): string {
  return new Intl.DateTimeFormat(localeTag(ctx), {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timeZoneOf(ctx),
  }).format(new Date(date));
}

/** Format a plain number with locale grouping/decimals. */
export function formatNumber(value: number, ctx?: LocaleContext, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(localeTag(ctx), options).format(value);
}

/**
 * Format a measurement with a unit, e.g. `formatUnit(2.5, 'kilogram')` →
 * '2.5 kg' (en-GB) / '2,5 kg' (de-DE). Unit names are the standard
 * `Intl.NumberFormat` unit identifiers ('kilogram', 'pound', 'centimeter'…).
 */
export function formatUnit(value: number, unit: string, ctx?: LocaleContext, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(localeTag(ctx), {
    style: 'unit',
    unit,
    ...options,
  }).format(value);
}

/** Format a percentage, e.g. `formatPercent(0.2)` → '20%'. */
export function formatPercent(value: number, ctx?: LocaleContext): string {
  return new Intl.NumberFormat(localeTag(ctx), {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(value);
}

/** Create a locale-aware string comparator for sorting. */
export function createCollator(ctx?: LocaleContext, options?: Intl.CollatorOptions): Intl.Collator {
  return new Intl.Collator(localeTag(ctx), options);
}

/** Sort strings with locale collation (e.g. umlauts, accents, CJK). */
export function sortLocalized(values: string[], ctx?: LocaleContext, options?: Intl.CollatorOptions): string[] {
  const collator = createCollator(ctx, options);
  return [...values].sort(collator.compare);
}
