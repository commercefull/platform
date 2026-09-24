import { createRatesForAddressRepository, createCustomerTaxRepository } from '../../tests/testUtils';
import { GetTaxRateForAddressUseCase } from './GetTaxRateForAddress';

describe('GetTaxRateForAddressUseCase', () => {
  let useCase: GetTaxRateForAddressUseCase;
  let taxRepository: ReturnType<typeof createRatesForAddressRepository>;
  let customerRepository: ReturnType<typeof createCustomerTaxRepository>;

  beforeEach(() => {
    taxRepository = createRatesForAddressRepository();
    customerRepository = createCustomerTaxRepository();
    useCase = new GetTaxRateForAddressUseCase(taxRepository, customerRepository);
  });

  it('should return the combined rate when multiple rates apply', async () => {
    taxRepository.findRatesForAddress.mockResolvedValue([
      { taxRateId: 'r1', name: 'State', rate: 0.05, isCompound: false, includesShipping: true, priority: 1 },
      { taxRateId: 'r2', name: 'County', rate: 0.02, isCompound: false, includesShipping: false, priority: 2 },
    ]);

    const result = await useCase.execute({ address: { country: 'US', state: 'CA' } });

    expect(result.combinedRate).toBe(0.07);
    expect(result.rates).toHaveLength(2);
    expect(result.isExempt).toBe(false);
    expect(taxRepository.findRatesForAddress).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'US', state: 'CA' }),
    );
  });

  it('should compound taxes on top of prior rates when a rate is compound', async () => {
    taxRepository.findRatesForAddress.mockResolvedValue([
      { taxRateId: 'r1', name: 'State', rate: 0.05, isCompound: false, includesShipping: true, priority: 1 },
      { taxRateId: 'r2', name: 'Compound', rate: 0.02, isCompound: true, includesShipping: false, priority: 2 },
    ]);

    const result = await useCase.execute({ address: { country: 'US', state: 'CA' } });

    expect(result.combinedRate).toBeCloseTo(0.071, 3);
  });

  it('should return exempt without querying rates when the customer has an active exemption', async () => {
    customerRepository.getTaxExemption.mockResolvedValue({ isActive: true, reason: 'Resale certificate' });

    const result = await useCase.execute({ address: { country: 'US' }, customerId: 'c1' });

    expect(result.isExempt).toBe(true);
    expect(result.exemptionReason).toBe('Resale certificate');
    expect(result.combinedRate).toBe(0);
    expect(taxRepository.findRatesForAddress).not.toHaveBeenCalled();
  });

  it('should query rates when the customer exemption is inactive', async () => {
    customerRepository.getTaxExemption.mockResolvedValue({ isActive: false });

    const result = await useCase.execute({ address: { country: 'US' }, customerId: 'c1' });

    expect(result.isExempt).toBe(false);
    expect(taxRepository.findRatesForAddress).toHaveBeenCalled();
  });

  it('should return zero rate when no rates apply to the address', async () => {
    const result = await useCase.execute({ address: { country: 'XX' } });

    expect(result.combinedRate).toBe(0);
    expect(result.rates).toHaveLength(0);
    expect(result.isExempt).toBe(false);
  });
});
