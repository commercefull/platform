import { createTaxRateRepository } from '../../tests/testUtils';
import { CreateTaxRateUseCase } from './CreateTaxRate';
import { InvalidTaxRateError, TaxValidationError } from '../../domain/errors/TaxErrors';

describe('CreateTaxRateUseCase', () => {
  let useCase: CreateTaxRateUseCase;
  let taxRepository: ReturnType<typeof createTaxRateRepository>;

  beforeEach(() => {
    taxRepository = createTaxRateRepository();
    taxRepository.createTaxRate.mockResolvedValue({
      taxRateId: 'txr-1',
      name: 'US Federal',
      rate: 0.07,
      country: 'US',
      isActive: true,
      createdAt: new Date(),
    });
    useCase = new CreateTaxRateUseCase(taxRepository);
  });

  it('should persist and return the tax rate when the input is valid', async () => {
    const result = await useCase.execute({ name: 'US Federal', rate: 0.07, type: 'percentage', country: 'US' });

    expect(result).toEqual({
      taxRateId: 'txr-1',
      name: 'US Federal',
      rate: 0.07,
      country: 'US',
      isActive: true,
      createdAt: expect.any(String),
    });
    expect(taxRepository.createTaxRate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'US Federal',
        rate: 0.07,
        type: 'percentage',
        country: 'US',
        isCompound: false,
        includesShipping: false,
        priority: 0,
        isActive: true,
      }),
    );
  });

  it('should throw TaxValidationError when required fields are missing', async () => {
    await expect(useCase.execute({ name: '', rate: 0.1, type: 'percentage', country: 'US' })).rejects.toThrow(
      TaxValidationError,
    );
    await expect(useCase.execute({ name: 'Test', rate: 0.1, type: 'percentage', country: '' })).rejects.toThrow(
      TaxValidationError,
    );
    expect(taxRepository.createTaxRate).not.toHaveBeenCalled();
  });

  it.each([-0.1, 1.5])('should throw InvalidTaxRateError when the rate is %s', async rate => {
    await expect(useCase.execute({ name: 'Test', rate, type: 'percentage', country: 'US' })).rejects.toThrow(
      InvalidTaxRateError,
    );
    expect(taxRepository.createTaxRate).not.toHaveBeenCalled();
  });
});
