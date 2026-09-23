import type { CountryRepositoryPort } from '../../domain/repositories/LocalizationRepository';

export class ManageCountriesUseCase {
  constructor(private readonly countryRepo: CountryRepositoryPort) {}

  async findAll() {
    return this.countryRepo.findAll();
  }
}
