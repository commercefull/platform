/**
 * Unit Tests for CreateTaxExemption Use Case
 */

jest.mock('../../infrastructure/repositories/taxCommandRepo', () => ({
  __esModule: true,
  default: {
    createTaxExemption: jest.fn(),
  },
}));

import { CreateTaxExemptionUseCase } from './CreateTaxExemption';
import taxCommandRepo from '../../infrastructure/repositories/taxCommandRepo';

describe('CreateTaxExemptionUseCase', () => {
  let useCase: CreateTaxExemptionUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateTaxExemptionUseCase();
  });

  it('should create a pending exemption with scope fields', async () => {
    const mockResult = { id: 'ex1', status: 'pending', customerId: 'cust-1' };
    jest.mocked(taxCommandRepo.createTaxExemption).mockResolvedValue(mockResult as never);

    const result = await useCase.execute({
      customerId: 'cust-1',
      type: 'resale',
      name: 'Resale Certificate',
      exemptionNumber: 'EX123',
      applicableTaxCategoryIds: ['digital-goods'],
      minOrderAmount: 100,
      maxOrderAmount: 5000,
      exemptionPercent: 100,
    });

    expect(result).toEqual(mockResult);
    expect(taxCommandRepo.createTaxExemption).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cust-1',
        type: 'resale',
        status: 'pending',
        applicableTaxCategoryIds: ['digital-goods'],
        minOrderAmount: 100,
        maxOrderAmount: 5000,
        exemptionPercent: 100,
        isVerified: false,
      }),
    );
  });

  it('should default exemptionPercent to 100 when not provided', async () => {
    jest.mocked(taxCommandRepo.createTaxExemption).mockResolvedValue({ id: 'ex1' } as never);

    await useCase.execute({
      customerId: 'cust-1',
      type: 'nonprofit',
      name: 'Nonprofit',
      exemptionNumber: 'EX456',
    });

    expect(taxCommandRepo.createTaxExemption).toHaveBeenCalledWith(
      expect.objectContaining({
        exemptionPercent: 100,
      }),
    );
  });

  it('should default applicableTaxCategoryIds to null when not provided', async () => {
    jest.mocked(taxCommandRepo.createTaxExemption).mockResolvedValue({ id: 'ex1' } as never);

    await useCase.execute({
      customerId: 'cust-1',
      type: 'government',
      name: 'Government',
      exemptionNumber: 'EX789',
    });

    expect(taxCommandRepo.createTaxExemption).toHaveBeenCalledWith(
      expect.objectContaining({
        applicableTaxCategoryIds: null,
      }),
    );
  });
});
