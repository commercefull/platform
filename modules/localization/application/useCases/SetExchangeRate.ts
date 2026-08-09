/**
 * SetExchangeRate Use Case
 */

export interface SetExchangeRateInput {
  currencyCode: string;
  exchangeRate: number;
  effectiveDate?: Date;
  source?: string;
}

export interface SetExchangeRateOutput {
  currencyCode: string;
  previousRate: number;
  newRate: number;
  effectiveDate: string;
  updatedAt: string;
}

export interface CurrencyForExchangeRate {
  currencyId: string;
  exchangeRate: number;
}

export interface SetExchangeRateRepository {
  findCurrencyByCode(code: string): Promise<CurrencyForExchangeRate | null>;
  updateCurrency(currencyId: string, data: { exchangeRate: number; lastRateUpdate: Date }): Promise<void>;
  createExchangeRateHistory(data: {
    currencyCode: string;
    rate: number;
    previousRate: number;
    effectiveDate: Date;
    source: string;
  }): Promise<void>;
}

export class SetExchangeRateUseCase {
  constructor(private readonly localizationRepository: SetExchangeRateRepository) {}

  async execute(input: SetExchangeRateInput): Promise<SetExchangeRateOutput> {
    if (!input.currencyCode || input.exchangeRate === undefined) {
      throw new Error('Currency code and exchange rate are required');
    }

    if (input.exchangeRate <= 0) {
      throw new Error('Exchange rate must be positive');
    }

    const currency = await this.localizationRepository.findCurrencyByCode(input.currencyCode);
    if (!currency) {
      throw new Error(`Currency not found: ${input.currencyCode}`);
    }

    const previousRate = currency.exchangeRate;
    const effectiveDate = input.effectiveDate || new Date();

    // Update currency with new rate
    await this.localizationRepository.updateCurrency(currency.currencyId, {
      exchangeRate: input.exchangeRate,
      lastRateUpdate: effectiveDate,
    });

    // Store rate history
    await this.localizationRepository.createExchangeRateHistory({
      currencyCode: input.currencyCode,
      rate: input.exchangeRate,
      previousRate,
      effectiveDate,
      source: input.source || 'manual',
    });

    return {
      currencyCode: input.currencyCode,
      previousRate,
      newRate: input.exchangeRate,
      effectiveDate: effectiveDate.toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
