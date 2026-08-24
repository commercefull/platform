import { GetFeatureFlagsUseCase} from './GetFeatureFlags';

describe('GetFeatureFlagsUseCase', () => {
  let useCase: GetFeatureFlagsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findFeatureFlags: jest.fn().mockResolvedValue([
        { key: 'new_checkout', name: 'New Checkout', enabled: true, scope: 'global' },
        { key: 'loyalty', name: 'Loyalty Program', enabled: false, scope: 'global', rolloutPercentage: 50 },
      ]),
    };
    useCase = new GetFeatureFlagsUseCase(mockRepo as never);
  });

  it('should return feature flags (happy path)', async () => {
    const result = await useCase.execute({});

    expect(result.flags).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.flags[0].key).toBe('new_checkout');
  });

  it('should pass scope and includeDisabled to repository', async () => {
    await useCase.execute({ scope: 'store', scopeId: 's1', includeDisabled: true });

    expect(mockRepo.findFeatureFlags).toHaveBeenCalledWith({ scope: 'store', scopeId: 's1', includeDisabled: true });
  });

  it('should default scope to global and includeDisabled to false', async () => {
    await useCase.execute({});

    expect(mockRepo.findFeatureFlags).toHaveBeenCalledWith({ scope: 'global', scopeId: undefined, includeDisabled: false });
  });
});
