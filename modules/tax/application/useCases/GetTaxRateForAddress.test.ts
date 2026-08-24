import { GetTaxRateForAddressUseCase} from './GetTaxRateForAddress';

describe('GetTaxRateForAddressUseCase', () => {
  let useCase: GetTaxRateForAddressUseCase;
  let mockTaxRepo: Record<string, jest.Mock>;
  let mockCustomerRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockTaxRepo = { findRatesForAddress: jest.fn().mockResolvedValue([]) };
    mockCustomerRepo = { getTaxExemption: jest.fn().mockResolvedValue(null) };
    useCase = new GetTaxRateForAddressUseCase(mockTaxRepo as never, mockCustomerRepo as never);
  });

  it('should return combined rate for address (happy path)', async () => {
    mockTaxRepo.findRatesForAddress.mockResolvedValue([
      { taxRateId: 'r1', name: 'State', rate: 0.05, isCompound: false, includesShipping: true, priority: 1 },
      { taxRateId: 'r2', name: 'County', rate: 0.02, isCompound: false, includesShipping: false, priority: 2 },
    ]);

    const result = await useCase.execute({ address: { country: 'US', state: 'CA' } });

    expect(result.combinedRate).toBe(0.07);
    expect(result.rates).toHaveLength(2);
    expect(result.isExempt).toBe(false);
  });

  it('should handle compound taxes correctly', async () => {
    mockTaxRepo.findRatesForAddress.mockResolvedValue([
      { taxRateId: 'r1', name: 'State', rate: 0.05, isCompound: false, includesShipping: true, priority: 1 },
      { taxRateId: 'r2', name: 'Compound', rate: 0.02, isCompound: true, includesShipping: false, priority: 2 },
    ]);

    const result = await useCase.execute({ address: { country: 'US', state: 'CA' } });

    expect(result.combinedRate).toBeCloseTo(0.071, 3);
  });

  it('should return exempt for customer with active exemption', async () => {
    mockCustomerRepo.getTaxExemption.mockResolvedValue({ isActive: true, reason: 'Resale certificate' });

    const result = await useCase.execute({ address: { country: 'US' }, customerId: 'c1' });

    expect(result.isExempt).toBe(true);
    expect(result.exemptionReason).toBe('Resale certificate');
    expect(result.combinedRate).toBe(0);
  });

  it('should return zero rate when no rates found', async () => {
    const result = await useCase.execute({ address: { country: 'XX' } });

    expect(result.combinedRate).toBe(0);
    expect(result.rates).toHaveLength(0);
    expect(result.isExempt).toBe(false);
  });
});
