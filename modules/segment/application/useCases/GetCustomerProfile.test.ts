import { GetCustomerProfileUseCase } from './GetCustomerProfile';
import type { CustomerProfileRepository } from '../../domain/repositories/SegmentRepository';
import { createCustomerProfile, lazyMock } from '../../tests/testUtils';

describe('GetCustomerProfileUseCase', () => {
  let repo: jest.Mocked<CustomerProfileRepository>;

  beforeEach(() => {
    repo = lazyMock<CustomerProfileRepository>();
    repo.findByCustomerId.mockResolvedValue(createCustomerProfile());
  });

  it('should return the profile when the customer exists', async () => {
    const result = await new GetCustomerProfileUseCase(repo).execute('cust-1');

    expect(result?.customerId).toBe('cust-1');
  });

  it('should return null when the customer has no profile', async () => {
    repo.findByCustomerId.mockResolvedValue(null);

    const result = await new GetCustomerProfileUseCase(repo).execute('missing');

    expect(result).toBeNull();
  });
});

