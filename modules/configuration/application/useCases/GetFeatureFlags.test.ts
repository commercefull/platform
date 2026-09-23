import { createFeatureFlagRepository } from '../../tests/testUtils';
import { GetFeatureFlagsUseCase } from './GetFeatureFlags';

describe('GetFeatureFlagsUseCase', () => {
  it('should return the flags when the repository has them', async () => {
    const repository = createFeatureFlagRepository();
    repository.findFeatureFlags.mockResolvedValue([
      { key: 'new_checkout', name: 'New Checkout', enabled: true, scope: 'global' },
      { key: 'loyalty', name: 'Loyalty Program', enabled: false, scope: 'global', rolloutPercentage: 50 },
    ]);

    const result = await new GetFeatureFlagsUseCase(repository).execute({});

    expect(result.flags).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.flags[1]).toMatchObject({ key: 'loyalty', enabled: false, rolloutPercentage: 50 });
  });

  it('should pass scope and includeDisabled through when provided', async () => {
    const repository = createFeatureFlagRepository();

    await new GetFeatureFlagsUseCase(repository).execute({ scope: 'store', scopeId: 's1', includeDisabled: true });

    expect(repository.findFeatureFlags).toHaveBeenCalledWith({ scope: 'store', scopeId: 's1', includeDisabled: true });
  });

  it('should default to global scope when no scope is given', async () => {
    const repository = createFeatureFlagRepository();

    const result = await new GetFeatureFlagsUseCase(repository).execute({});

    expect(result.flags).toEqual([]);
    expect(repository.findFeatureFlags).toHaveBeenCalledWith({ scope: 'global', scopeId: undefined, includeDisabled: false });
  });
});
