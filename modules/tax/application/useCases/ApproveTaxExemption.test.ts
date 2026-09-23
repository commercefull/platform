/**
 * Unit Tests for ApproveTaxExemption Use Case
 */

import { createExemptionUpdatePort, createCustomerTaxExemption } from '../../tests/testUtils';
import { ApproveTaxExemptionUseCase } from './ApproveTaxExemption';

describe('ApproveTaxExemptionUseCase', () => {
  let useCase: ApproveTaxExemptionUseCase;
  let commandRepo: ReturnType<typeof createExemptionUpdatePort>;

  beforeEach(() => {
    commandRepo = createExemptionUpdatePort();
    useCase = new ApproveTaxExemptionUseCase(commandRepo);
  });

  it('should approve the exemption and record the verifier', async () => {
    const approved = createCustomerTaxExemption({ status: 'approved', isVerified: true, verifiedBy: 'admin-1' });
    commandRepo.updateTaxExemption.mockResolvedValue(approved);

    const result = await useCase.execute('ex-1', 'admin-1');

    expect(result).toBe(approved);
    expect(commandRepo.updateTaxExemption).toHaveBeenCalledWith('ex-1', {
      status: 'approved',
      isVerified: true,
      verifiedBy: 'admin-1',
      verifiedAt: expect.any(Number),
    });
  });

  it('should propagate repository errors when the update fails', async () => {
    commandRepo.updateTaxExemption.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute('ex-1', 'admin-1')).rejects.toThrow('DB error');
  });
});
