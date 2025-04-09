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

export interface CurrencyPriceRule {
  id: string;
  name: string;
  description?: string;
  type: 'fixed' | 'percentage' | 'exchange'; // Rule type
  value: number;          // Value to apply (e.g., fixed amount, percentage markup)
  currencyCode: string;   // Target currency
  regionCode?: string;    // Optional region specificity
  priority: number;       // Order of application (higher = applied later)
  minOrderValue?: number; // Minimum order value for rule to apply
  maxOrderValue?: number; // Maximum order value for rule to apply
  startDate?: number;     // Optional start date for time-limited rules
  endDate?: number;       // Optional end date for time-limited rules
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Helper function to format currency amount
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

// Convert amount from one currency to another
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

// Apply price rules to a converted amount
export function applyPriceRules(
  baseAmount: number,
  convertedAmount: number,
  currency: Currency,
  region: string | null,
  rules: CurrencyPriceRule[]
): number {
  let finalAmount = convertedAmount;
  
  // Filter applicable rules
  const applicableRules = rules.filter(rule => {
    // Check currency match
    if (rule.currencyCode !== currency.code) return false;
    
    // Check region match (if specified)
    if (rule.regionCode && rule.regionCode !== region) return false;
    
    // Check if rule is active
    if (!rule.isActive) return false;
    
    // Check date constraints
    const now = Date.now();
    if (rule.startDate && now < rule.startDate) return false;
    if (rule.endDate && now > rule.endDate) return false;
    
    // Check order value constraints
    if (rule.minOrderValue !== undefined && convertedAmount < rule.minOrderValue) return false;
    if (rule.maxOrderValue !== undefined && convertedAmount > rule.maxOrderValue) return false;
    
    return true;
  });
  
  // Sort by priority
  const sortedRules = [...applicableRules].sort((a, b) => a.priority - b.priority);
  
  // Apply rules sequentially
  for (const rule of sortedRules) {
    switch (rule.type) {
      case 'fixed':
        // Add a fixed amount
        finalAmount += rule.value;
        break;
      case 'percentage':
        // Apply percentage markup/discount
        finalAmount *= (1 + rule.value / 100);
        break;
      case 'exchange':
        // Ignore normal exchange rate and use this fixed rate
        finalAmount = baseAmount * rule.value;
        break;
    }
  }
  
  // Round to appropriate decimal places
  return Number(finalAmount.toFixed(currency.decimals));
}
