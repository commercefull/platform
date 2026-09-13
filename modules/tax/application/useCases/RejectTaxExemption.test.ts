/**
 * Unit Tests for RejectTaxExemption Use Case
 */

jest.mock('../../infrastructure/repositories/taxCommandRepo', () => ({
  __esModule: true,
  default: {
    updateTaxExemption: jest.fn(),
  },
}));

import { RejectTaxExemptionUseCase } from './RejectTaxExemption';
import taxCommandRepo from '../../infrastructure/repositories/taxCommandRepo';

describe('RejectTaxExemptionUseCase', () => {
  let useCase: RejectTaxExemptionUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RejectTaxExemptionUseCase();
  });

  it('should reject an exemption with a reason', async () => {
    const mockResult = { id: 'ex1', status: 'rejected' };
    jest.mocked(taxCommandRepo.updateTaxExemption).mockResolvedValue(mockResult as never);

    const result = await useCase.execute('ex1', 'Invalid certificate');

    expect(result).toEqual(mockResult);
    expect(taxCommandRepo.updateTaxExemption).toHaveBeenCalledWith('ex1', {
      status: 'rejected',
      notes: 'Invalid certificate',
    });
  });

  it('should reject an exemption without a reason', async () => {
    jest.mocked(taxCommandRepo.updateTaxExemption).mockResolvedValue({ id: 'ex1' } as never);

    await useCase.execute('ex1');

    expect(taxCommandRepo.updateTaxExemption).toHaveBeenCalledWith('ex1', {
      status: 'rejected',
      notes: undefined,
    });
  });
});
