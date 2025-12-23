/**
 * ConvertCurrency Use Case
 */

export interface ConvertCurrencyInput {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

export interface ConvertCurrencyOutput {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  convertedAt: string;
}

export class ConvertCurrencyUseCase {
  constructor(private readonly localizationRepository: any) {}

  async execute(input: ConvertCurrencyInput): Promise<ConvertCurrencyOutput> {
    if (input.amount === undefined || !input.fromCurrency || !input.toCurrency) {
      throw new Error('Amount, fromCurrency, and toCurrency are required');
    }

    if (input.fromCurrency === input.toCurrency) {
      return {
        originalAmount: input.amount,
        originalCurrency: input.fromCurrency,
        convertedAmount: input.amount,
        targetCurrency: input.toCurrency,
        exchangeRate: 1,
        convertedAt: new Date().toISOString(),
      };
    }

    const fromCurrency = await this.localizationRepository.findCurrencyByCode(input.fromCurrency);
    if (!fromCurrency) {
      throw new Error(`Currency not found: ${input.fromCurrency}`);
    }

    const toCurrency = await this.localizationRepository.findCurrencyByCode(input.toCurrency);
    if (!toCurrency) {
      throw new Error(`Currency not found: ${input.toCurrency}`);
    }

    // Convert to base currency then to target
    // If fromCurrency exchange rate is 1.2 (meaning 1 USD = 1.2 FROM)
    // And toCurrency exchange rate is 0.9 (meaning 1 USD = 0.9 TO)
    // Then: amount / fromRate * toRate
    const baseAmount = input.amount / fromCurrency.exchangeRate;
    const convertedAmount = baseAmount * toCurrency.exchangeRate;
    const effectiveRate = toCurrency.exchangeRate / fromCurrency.exchangeRate;

    return {
      originalAmount: input.amount,
      originalCurrency: input.fromCurrency,
      convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
      targetCurrency: input.toCurrency,
      exchangeRate: Math.round(effectiveRate * 10000) / 10000, // 4 decimal places for rate
      convertedAt: new Date().toISOString(),
    };
  }
}
