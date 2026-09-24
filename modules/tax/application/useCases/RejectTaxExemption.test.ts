/**
 * Unit Tests for RejectTaxExemption Use Case
 */

import { createExemptionUpdatePort, createCustomerTaxExemption } from '../../tests/testUtils';
import { RejectTaxExemptionUseCase } from './RejectTaxExemption';

describe('RejectTaxExemptionUseCase', () => {
  let useCase: RejectTaxExemptionUseCase;
  let commandRepo: ReturnType<typeof createExemptionUpdatePort>;

  beforeEach(() => {
    commandRepo = createExemptionUpdatePort();
    useCase = new RejectTaxExemptionUseCase(commandRepo);
  });

  it('should reject the exemption and record the reason', async () => {
    const rejected = createCustomerTaxExemption({ status: 'rejected', notes: 'Invalid certificate' });
    commandRepo.updateTaxExemption.mockResolvedValue(rejected);

    const result = await useCase.execute('ex-1', 'Invalid certificate');

    expect(result).toBe(rejected);
    expect(commandRepo.updateTaxExemption).toHaveBeenCalledWith('ex-1', {
      status: 'rejected',
      notes: 'Invalid certificate',
    });
  });

  it('should reject the exemption without a reason when none is given', async () => {
    commandRepo.updateTaxExemption.mockResolvedValue(createCustomerTaxExemption({ status: 'rejected' }));

    await useCase.execute('ex-1');

    expect(commandRepo.updateTaxExemption).toHaveBeenCalledWith('ex-1', {
      status: 'rejected',
      notes: undefined,
    });
  });
});
