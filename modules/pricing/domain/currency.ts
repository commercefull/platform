/**
 * Currency domain models for the pricing feature
 */

export interface Currency {
  currencyId?: string; // UUID primary key
  code: string; // ISO 4217 currency code (e.g., USD, EUR, GBP)
  name: string; // Display name (e.g., US Dollar)
  symbol: string; // Currency symbol (e.g., $, €, £)
  decimalPlaces: number; // Number of decimal places (typically 2)
  decimals?: number; // Alias for decimalPlaces (for compatibility)
  isDefault: boolean; // Whether this is the default store currency
  isActive: boolean; // Whether this currency is active for customer selection
  symbolPosition: 'before' | 'after'; // Symbol position (before or after amount)
  position?: 'before' | 'after'; // Alias for symbolPosition (for compatibility)
  thousandsSeparator: string; // Character to separate thousands (e.g., ',', ' ', '.')
  decimalSeparator: string; // Character for decimal point (e.g., '.', ',')
  // Legacy fields (not in current schema but kept for compatibility)
  exchangeRate?: number; // Exchange rate relative to the default currency
  lastUpdated?: number; // Timestamp of last exchange rate update
  format?: string; // Format string
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CurrencyRegion {
  currencyRegionId?: string; // UUID primary key
  id?: string; // Alias for currencyRegionId (for compatibility)
  code?: string; // Region code (new schema)
  regionCode?: string; // Alias for code (for compatibility)
  name?: string; // Display name (new schema)
  regionName?: string; // Alias for name (for compatibility)
  currencyCode: string; // Default currency for this region
  countries?: string[]; // Array of country codes
  isActive: boolean; // Whether this region-currency mapping is active
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Helper function to format currency amount
 */
export function formatCurrency(amount: number, currency: Currency): string {
  // Clone amount to avoid mutating the original
  let formattedAmount = amount;
  const decimals = currency.decimalPlaces ?? currency.decimals ?? 2;
  const position = currency.symbolPosition ?? currency.position ?? 'before';

  // Round to the appropriate number of decimals
  formattedAmount = Number(formattedAmount.toFixed(decimals));

  // Format the number with the correct separators
  const parts = formattedAmount.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);

  // Add decimal part if needed
  const formatted = parts.length > 1 ? parts[0] + currency.decimalSeparator + parts[1] : parts[0];

  // Apply the symbol in the correct position
  return position === 'before' ? currency.symbol + formatted : formatted + currency.symbol;
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(amount: number, fromCurrency: Currency, toCurrency: Currency): number {
  // If currencies are the same, no conversion needed
  if (fromCurrency.code === toCurrency.code) return amount;

  const fromRate = fromCurrency.exchangeRate ?? 1;
  const toRate = toCurrency.exchangeRate ?? 1;

  // Convert to the base currency first (if not already), then to target currency
  const amountInBaseCurrency = fromCurrency.isDefault ? amount : amount / fromRate;

  // Convert from base currency to target currency
  return toCurrency.isDefault ? amountInBaseCurrency : amountInBaseCurrency * toRate;
}
