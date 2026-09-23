import { RecomputeAllProfilesUseCase } from './RecomputeAllProfiles';
import type { CustomerProfileRepository } from '../../domain/repositories/SegmentRepository';
import { lazyMock } from '../../tests/testUtils';

describe('RecomputeAllProfilesUseCase', () => {
  it('should recompute all profiles and return the count', async () => {
    const repo = lazyMock<CustomerProfileRepository>();
    repo.recomputeAll.mockResolvedValue(42);

    const result = await new RecomputeAllProfilesUseCase(repo).execute();

    expect(result).toBe(42);
  });
});

