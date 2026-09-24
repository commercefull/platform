/**
 * Database record types — match the generated libs/db/types schema.
 * Kept in domain so repository ports do not depend on the database layer.
 */

export type LocaleRecord = {
  localeId: string;
  createdAt: Date;
  updatedAt: Date;
  code: string;
  name: string;
  nativeName: string | null;
  language: string;
  countryCode: string | null;
  isActive: boolean;
  isDefault: boolean;
  textDirection: string;
  dateFormat: string;
  timeFormat: string;
  timeZone: string;
  defaultCurrencyId: string | null;
  numberFormat: Record<string, unknown> | null;
  fallbackLocaleId: string | null;
  flagIcon: string | null;
}

export type Country = {
  countryId: string;
  createdAt: Date;
  updatedAt: Date;
  code: string;
  name: string;
  numericCode: number | null;
  alpha3Code: string | null;
  defaultCurrencyId: string | null;
  isActive: boolean;
  flagIcon: string | null;
  region: string | null;
}

export type Currency = {
  currencyId: string;
  createdAt: Date;
  updatedAt: Date;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandsSeparator: string;
  symbolPosition: string;
  isActive: boolean;
  isDefault: boolean;
}

export type Language = {
  languageId: string;
  code: string;
  name: string;
  nativeName: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

