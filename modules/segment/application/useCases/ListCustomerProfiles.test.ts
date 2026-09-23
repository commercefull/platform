import { ListCustomerProfilesUseCase } from './ListCustomerProfiles';
import type { CustomerProfileRepository } from '../../domain/repositories/SegmentRepository';
import { createCustomerProfile, lazyMock } from '../../tests/testUtils';

describe('ListCustomerProfilesUseCase', () => {
  it('should list profiles with pagination', async () => {
    const repo = lazyMock<CustomerProfileRepository>();
    repo.findAll.mockResolvedValue([createCustomerProfile()]);

    const result = await new ListCustomerProfilesUseCase(repo).execute(10, 0);

    expect(result).toHaveLength(1);
    expect(repo.findAll).toHaveBeenCalledWith(10, 0);
  });
});

