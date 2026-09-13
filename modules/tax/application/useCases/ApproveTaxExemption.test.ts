/**
 * Unit Tests for ApproveTaxExemption Use Case
 */

jest.mock('../../infrastructure/repositories/taxCommandRepo', () => {
  const mock = {
    updateTaxExemption: jest.fn(),
  };
  return {
    __esModule: true,
    default: mock,
    TaxCommandRepo: function () { return mock; },
  };
});

import { ApproveTaxExemptionUseCase } from './ApproveTaxExemption';
import taxCommandRepo from '../../infrastructure/repositories/taxCommandRepo';

describe('ApproveTaxExemptionUseCase', () => {
  let useCase: ApproveTaxExemptionUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ApproveTaxExemptionUseCase();
  });

  it('should approve a pending exemption', async () => {
    const mockResult = { id: 'ex1', status: 'approved', isVerified: true };
    jest.mocked(taxCommandRepo.updateTaxExemption).mockResolvedValue(mockResult as never);

    const result = await useCase.execute('ex1', 'admin-1');

    expect(result).toEqual(mockResult);
    expect(taxCommandRepo.updateTaxExemption).toHaveBeenCalledWith('ex1', {
      status: 'approved',
      isVerified: true,
      verifiedBy: 'admin-1',
      verifiedAt: expect.any(Number),
    });
  });
});
