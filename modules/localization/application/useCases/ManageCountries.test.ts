import {
  createCountryRepository,
  createCountry,
} from '../../tests/testUtils';
import { ManageCountriesUseCase } from './ManageCountries';

describe('ManageCountriesUseCase', () => {
  it('should list all countries when asked', async () => {
    const repository = createCountryRepository();
    repository.findAll.mockResolvedValue([createCountry(), createCountry({ countryId: 'country-2', code: 'DE' })]);

    const result = await new ManageCountriesUseCase(repository).findAll();

    expect(result).toHaveLength(2);
  });
});
