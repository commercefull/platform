/**
 * CreateCurrency Use Case
 */

export interface CreateCurrencyInput {
  code: string;
  name: string;
  symbol: string;
  symbolPosition?: 'before' | 'after';
  decimalPlaces?: number;
  decimalSeparator?: string;
  thousandsSeparator?: string;
  exchangeRate?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CreateCurrencyOutput {
  currencyId: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
  createdAt: string;
}

export class CreateCurrencyUseCase {
  constructor(private readonly localizationRepository: any) {}

  async execute(input: CreateCurrencyInput): Promise<CreateCurrencyOutput> {
    if (!input.code || !input.name || !input.symbol) {
      throw new Error('Currency code, name, and symbol are required');
    }

    // Check for duplicate code
    const existing = await this.localizationRepository.findCurrencyByCode(input.code);
    if (existing) {
      throw new Error(`Currency with code '${input.code}' already exists`);
    }

    const currencyId = `cur_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    const currency = await this.localizationRepository.createCurrency({
      currencyId,
      code: input.code.toUpperCase(),
      name: input.name,
      symbol: input.symbol,
      symbolPosition: input.symbolPosition || 'before',
      decimalPlaces: input.decimalPlaces ?? 2,
      decimalSeparator: input.decimalSeparator || '.',
      thousandsSeparator: input.thousandsSeparator || ',',
      exchangeRate: input.exchangeRate || 1,
      isDefault: input.isDefault ?? false,
      isActive: input.isActive ?? true,
    });

    return {
      currencyId: currency.currencyId,
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate,
      isDefault: currency.isDefault,
      createdAt: currency.createdAt.toISOString(),
    };
  }
}
