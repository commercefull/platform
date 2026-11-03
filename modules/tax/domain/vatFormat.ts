/**
 * VAT Number Formatting & Validation
 *
 * Pure format helpers shared between the VAT registration repository and
 * cross-module consumers (checkout quote adapter).
 */

const VAT_PATTERNS: Record<string, RegExp> = {
  AT: /^ATU\d{8}$/,
  BE: /^BE0?\d{9,10}$/,
  BG: /^BG\d{9,10}$/,
  CY: /^CY\d{8}[A-Z]$/,
  CZ: /^CZ\d{8,10}$/,
  DE: /^DE\d{9}$/,
  DK: /^DK\d{8}$/,
  EE: /^EE\d{8}$/,
  EL: /^EL\d{9}$/,
  ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
  FI: /^FI\d{8}$/,
  FR: /^FR[A-Z0-9]{2}\d{9}$/,
  HR: /^HR\d{11}$/,
  HU: /^HU\d{8}$/,
  IE: /^IE\d[A-Z0-9+*]\d{5}[A-Z]{1,2}$/,
  IT: /^IT\d{11}$/,
  LT: /^LT(\d{9}|\d{12})$/,
  LU: /^LU\d{8}$/,
  LV: /^LV\d{11}$/,
  MT: /^MT\d{8}$/,
  NL: /^NL\d{9}B\d{2}$/,
  PL: /^PL\d{10}$/,
  PT: /^PT\d{9}$/,
  RO: /^RO\d{2,10}$/,
  SE: /^SE\d{12}$/,
  SI: /^SI\d{8}$/,
  SK: /^SK\d{10}$/,
  GB: /^GB(\d{9}|\d{12}|(GD|HA)\d{3})$/, // UK VAT
  XI: /^XI(\d{9}|\d{12}|(GD|HA)\d{3})$/, // Northern Ireland
};

export function formatVatNumber(vatNumber: string, countryCode?: string): string {
  // Remove spaces and convert to uppercase
  let formatted = vatNumber.replace(/\s/g, '').toUpperCase();

  // Add country code prefix if not present and country code provided
  if (countryCode && !formatted.startsWith(countryCode)) {
    formatted = countryCode + formatted;
  }

  return formatted;
}

export function validateVatNumberFormat(vatNumber: string, countryCode: string): boolean {
  const formatted = formatVatNumber(vatNumber, countryCode);
  const pattern = VAT_PATTERNS[countryCode];

  if (!pattern) {
    // Unknown country, allow any format
    return formatted.length >= 8;
  }

  return pattern.test(formatted);
}

export function extractCountryFromVat(vatNumber: string): string | null {
  const formatted = vatNumber.replace(/\s/g, '').toUpperCase();
  const countryCode = formatted.substring(0, 2);

  if (VAT_PATTERNS[countryCode]) {
    return countryCode;
  }

  return null;
}
