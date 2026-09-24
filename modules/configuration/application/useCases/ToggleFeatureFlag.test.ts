import { createToggleFlagRepository } from '../../tests/testUtils';
import { ToggleFeatureFlagUseCase } from './ToggleFeatureFlag';
import { ConfigurationValidationError } from '../../domain/errors/ConfigurationErrors';

describe('ToggleFeatureFlagUseCase', () => {
  it('should enable the flag when it does not exist yet', async () => {
    const repository = createToggleFlagRepository();

    const result = await new ToggleFeatureFlagUseCase(repository).execute({
      key: 'new_checkout',
      enabled: true,
      updatedBy: 'admin',
    });

    expect(result.key).toBe('new_checkout');
    expect(result.enabled).toBe(true);
    expect(result.previousState).toBe(false);
    expect(repository.upsertFeatureFlag).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'new_checkout', enabled: true, scope: 'global', updatedBy: 'admin' }),
    );
  });

  it('should report the previous state when toggling an existing flag', async () => {
    const repository = createToggleFlagRepository();
    repository.findFeatureFlag.mockResolvedValue({
      key: 'new_checkout',
      enabled: true,
      scope: 'global',
      updatedAt: new Date('2026-01-01'),
    });

    const result = await new ToggleFeatureFlagUseCase(repository).execute({
      key: 'new_checkout',
      enabled: false,
      updatedBy: 'admin',
    });

    expect(result.previousState).toBe(true);
    expect(result.enabled).toBe(false);
  });

  it('should look up the flag at the requested scope when a scope is given', async () => {
    const repository = createToggleFlagRepository();

    await new ToggleFeatureFlagUseCase(repository).execute({
      key: 'flag',
      enabled: true,
      scope: 'store',
      scopeId: 's1',
      updatedBy: 'admin',
    });

    expect(repository.findFeatureFlag).toHaveBeenCalledWith('flag', 'store', 's1');
    expect(repository.upsertFeatureFlag).toHaveBeenCalledWith(expect.objectContaining({ scope: 'store', scopeId: 's1' }));
  });

  it('should throw ConfigurationValidationError when the key is empty', async () => {
    const repository = createToggleFlagRepository();

    await expect(
      new ToggleFeatureFlagUseCase(repository).execute({ key: '', enabled: true, updatedBy: 'admin' }),
    ).rejects.toThrow(ConfigurationValidationError);
    expect(repository.upsertFeatureFlag).not.toHaveBeenCalled();
  });
});
