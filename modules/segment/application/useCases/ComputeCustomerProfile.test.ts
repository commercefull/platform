import { ComputeCustomerProfileUseCase } from './ComputeCustomerProfile';
import type { CustomerProfileRepository } from '../../domain/repositories/SegmentRepository';
import { createCustomerProfile, lazyMock } from '../../tests/testUtils';

describe('ComputeCustomerProfileUseCase', () => {
  it('should compute aggregates for the customer', async () => {
    const repo = lazyMock<CustomerProfileRepository>();
    repo.computeAggregatesFromOrder.mockResolvedValue(createCustomerProfile());

    const result = await new ComputeCustomerProfileUseCase(repo).execute('cust-1');

    expect(result?.customerId).toBe('cust-1');
    expect(repo.computeAggregatesFromOrder).toHaveBeenCalledWith('cust-1');
  });
});

