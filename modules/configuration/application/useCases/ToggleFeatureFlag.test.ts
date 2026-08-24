import { ToggleFeatureFlagUseCase} from './ToggleFeatureFlag';
import { ConfigurationValidationError } from '../../domain/errors/ConfigurationErrors';

describe('ToggleFeatureFlagUseCase', () => {
  let useCase: ToggleFeatureFlagUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findFeatureFlag: jest.fn().mockResolvedValue(null),
      upsertFeatureFlag: jest.fn().mockResolvedValue({
        key: 'new_checkout', enabled: true, scope: 'global', updatedAt: new Date(),
      }),
    };
    useCase = new ToggleFeatureFlagUseCase(mockRepo as never);
  });

  it('should toggle feature flag on (happy path)', async () => {
    const result = await useCase.execute({ key: 'new_checkout', enabled: true, updatedBy: 'admin' });

    expect(result.key).toBe('new_checkout');
    expect(result.enabled).toBe(true);
    expect(result.previousState).toBe(false);
  });

  it('should report previousState correctly when flag exists', async () => {
    mockRepo.findFeatureFlag.mockResolvedValue({ key: 'new_checkout', enabled: true, scope: 'global', updatedAt: new Date() });
    mockRepo.upsertFeatureFlag.mockResolvedValue({ key: 'new_checkout', enabled: false, scope: 'global', updatedAt: new Date() });

    const result = await useCase.execute({ key: 'new_checkout', enabled: false, updatedBy: 'admin' });

    expect(result.previousState).toBe(true);
    expect(result.enabled).toBe(false);
  });

  it('should throw ConfigurationValidationError when key is empty', async () => {
    await expect(useCase.execute({ key: '', enabled: true, updatedBy: 'admin' })).rejects.toThrow(ConfigurationValidationError);
  });
});
