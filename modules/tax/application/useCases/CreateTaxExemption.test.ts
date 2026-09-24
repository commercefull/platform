/**
 * Unit Tests for CreateTaxExemption Use Case
 */

import { createExemptionCreatePort, createCustomerTaxExemption } from '../../tests/testUtils';
import { CreateTaxExemptionUseCase } from './CreateTaxExemption';

describe('CreateTaxExemptionUseCase', () => {
  let useCase: CreateTaxExemptionUseCase;
  let commandRepo: ReturnType<typeof createExemptionCreatePort>;

  beforeEach(() => {
    commandRepo = createExemptionCreatePort();
    useCase = new CreateTaxExemptionUseCase(commandRepo);
  });

  it('should persist a pending unverified exemption with the scope fields', async () => {
    const saved = createCustomerTaxExemption({ status: 'pending' });
    commandRepo.createTaxExemption.mockResolvedValue(saved);

    const result = await useCase.execute({
      customerId: 'cust-1',
      type: 'resale',
      name: 'Resale Certificate',
      exemptionNumber: 'EX123',
      applicableTaxCategoryIds: ['digital-goods'],
      minOrderAmountCents: 100,
      maxOrderAmountCents: 5000,
      exemptionPercent: 100,
    });

    expect(result).toBe(saved);
    expect(commandRepo.createTaxExemption).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cust-1',
        type: 'resale',
        status: 'pending',
        applicableTaxCategoryIds: ['digital-goods'],
        minOrderAmountCents: 100,
        maxOrderAmountCents: 5000,
        exemptionPercent: 100,
        isVerified: false,
      }),
    );
  });

  it('should default exemptionPercent to 100 when not provided', async () => {
    commandRepo.createTaxExemption.mockResolvedValue(createCustomerTaxExemption());

    await useCase.execute({
      customerId: 'cust-1',
      type: 'nonprofit',
      name: 'Nonprofit',
      exemptionNumber: 'EX456',
    });

    expect(commandRepo.createTaxExemption).toHaveBeenCalledWith(expect.objectContaining({ exemptionPercent: 100 }));
  });

  it('should default the scope bounds to null when not provided', async () => {
    commandRepo.createTaxExemption.mockResolvedValue(createCustomerTaxExemption());

    await useCase.execute({
      customerId: 'cust-1',
      type: 'government',
      name: 'Government',
      exemptionNumber: 'EX789',
    });

    expect(commandRepo.createTaxExemption).toHaveBeenCalledWith(
      expect.objectContaining({
        applicableTaxCategoryIds: null,
        minOrderAmountCents: null,
        maxOrderAmountCents: null,
      }),
    );
  });
});
