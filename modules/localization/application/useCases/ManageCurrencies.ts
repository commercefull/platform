import type { CurrencyRepositoryPort } from '../../domain/repositories/LocalizationRepository';

type CreateCurrencyParams = Parameters<CurrencyRepositoryPort['createCurrency']>[0];
type UpdateCurrencyParams = Parameters<CurrencyRepositoryPort['updateCurrency']>[1];

export class ManageCurrenciesUseCase {
  constructor(private readonly currencyRepo: CurrencyRepositoryPort) {}

  async listCurrencies() {
    return this.currencyRepo.listCurrencies();
  }
  async listActiveCurrencyCodes() {
    return this.currencyRepo.listActiveCurrencyCodes();
  }
  async findCurrencyById(id: string) {
    return this.currencyRepo.findCurrencyById(id);
  }
  async createCurrency(params: CreateCurrencyParams) {
    return this.currencyRepo.createCurrency(params);
  }
  async updateCurrency(id: string, updates: UpdateCurrencyParams) {
    return this.currencyRepo.updateCurrency(id, updates);
  }
  async deleteCurrency(id: string) {
    return this.currencyRepo.deleteCurrency(id);
  }
}

