/**
 * Currency domain models for the pricing feature
 */

export interface Currency {
  code: string;         // ISO 4217 currency code (e.g., USD, EUR, GBP)
  name: string;         // Display name (e.g., US Dollar)
  symbol: string;       // Currency symbol (e.g., $, €, £)
  decimals: number;     // Number of decimal places (typically 2)
  isDefault: boolean;   // Whether this is the default store currency
  isActive: boolean;    // Whether this currency is active for customer selection
  exchangeRate: number; // Exchange rate relative to the default currency (default currency = 1)
  lastUpdated: number;  // Timestamp of last exchange rate update
  format: string;       // Format string (e.g., "$#,##0.00", "# ###,00 €")
  position: 'before' | 'after'; // Symbol position (before or after amount)
  thousandsSeparator: string;   // Character to separate thousands (e.g., ',', ' ', '.')
  decimalSeparator: string;     // Character for decimal point (e.g., '.', ',')
}

export interface CurrencyRegion {
  id: string;
  regionCode: string;     // ISO country code or custom region code
  regionName: string;     // Display name for region
  currencyCode: string;   // Default currency for this region
  isActive: boolean;      // Whether this region-currency mapping is active
  createdAt: number;
  updatedAt: number;
}

/**
 * Helper function to format currency amount
 */
export function formatCurrency(amount: number, currency: Currency): string {
  // Clone amount to avoid mutating the original
  let formattedAmount = amount;
  
  // Round to the appropriate number of decimals
  formattedAmount = Number(formattedAmount.toFixed(currency.decimals));
  
  // Format the number with the correct separators
  const parts = formattedAmount.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
  
  // Add decimal part if needed
  const formatted = parts.length > 1 
    ? parts[0] + currency.decimalSeparator + parts[1] 
    : parts[0];
  
  // Apply the symbol in the correct position
  return currency.position === 'before' 
    ? currency.symbol + formatted 
    : formatted + currency.symbol;
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number, 
  fromCurrency: Currency, 
  toCurrency: Currency
): number {
  // If currencies are the same, no conversion needed
  if (fromCurrency.code === toCurrency.code) return amount;
  
  // Convert to the base currency first (if not already), then to target currency
  const amountInBaseCurrency = fromCurrency.isDefault 
    ? amount 
    : amount / fromCurrency.exchangeRate;
  
  // Convert from base currency to target currency
  return toCurrency.isDefault 
    ? amountInBaseCurrency 
    : amountInBaseCurrency * toCurrency.exchangeRate;
}
