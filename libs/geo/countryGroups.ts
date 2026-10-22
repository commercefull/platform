/**
 * Country Groups — Shared Kernel
 *
 * Jurisdictional country-group membership data (ISO 3166-1 alpha-2) used by
 * tax, compliance, shipping, and market logic. Replaces hardcoded member
 * lists embedded in use cases.
 *
 * Admission criteria (mirrors `libs/money.ts`):
 * - No dependencies, no I/O, no module-specific business rules.
 * - Data-only sets + membership helpers.
 */

/** EU member states (ISO-2) — intra-EU VAT/reverse-charge, GDPR scope. */
export const EU_MEMBER_STATES: ReadonlySet<string> = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
]);

/** EEA member states — EU + Iceland, Liechtenstein, Norway. */
export const EEA_MEMBER_STATES: ReadonlySet<string> = new Set([...EU_MEMBER_STATES, 'IS', 'LI', 'NO']);

/**
 * Countries inside the EU VAT area for intra-EU trade rules. Currently the
 * EU member states (Northern Ireland is handled via GB country code + the
 * XI VAT prefix at the provider layer, not here).
 */
export const EU_VAT_AREA: ReadonlySet<string> = EU_MEMBER_STATES;

/** Countries whose primary privacy regime is GDPR-class consent. */
export const GDPR_REGIONS: ReadonlySet<string> = new Set([...EEA_MEMBER_STATES, 'GB', 'CH']);

/** Normalize a country input (alpha-2, case-insensitive). */
function normalize(countryCode: string | undefined | null): string {
  return (countryCode ?? '').trim().toUpperCase();
}

export function isEuMember(countryCode: string | undefined | null): boolean {
  return EU_MEMBER_STATES.has(normalize(countryCode));
}

export function isEeaMember(countryCode: string | undefined | null): boolean {
  return EEA_MEMBER_STATES.has(normalize(countryCode));
}

export function isInEuVatArea(countryCode: string | undefined | null): boolean {
  return EU_VAT_AREA.has(normalize(countryCode));
}

export function isGdprRegion(countryCode: string | undefined | null): boolean {
  return GDPR_REGIONS.has(normalize(countryCode));
}
