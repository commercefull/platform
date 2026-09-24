import { createConfigurationRecord, createConfigurationRepository } from '../../tests/testUtils';
import { GetConfigurationUseCase } from './GetConfiguration';

describe('GetConfigurationUseCase', () => {
  it('should return the configuration when it exists at the requested scope', async () => {
    const repository = createConfigurationRepository();
    repository.findByKey.mockResolvedValue(
      createConfigurationRecord({ value: 'StoreName', scope: 'store', scopeId: 's1' }),
    );

    const result = await new GetConfigurationUseCase(repository).execute({ key: 'site.name', scope: 'store', scopeId: 's1' });

    expect(result.found).toBe(true);
    expect(result.configuration?.value).toBe('StoreName');
    expect(result.configuration?.lastUpdated).toBe('2026-01-01T00:00:00.000Z');
    expect(result.inheritedFrom).toBeUndefined();
  });

  it('should inherit the global value when not found at the requested scope', async () => {
    const repository = createConfigurationRepository();
    repository.findByKey.mockImplementation((_key, scope) =>
      Promise.resolve(scope === 'global' ? createConfigurationRecord({ value: 'GlobalName' }) : null),
    );

    const result = await new GetConfigurationUseCase(repository).execute({ key: 'site.name', scope: 'store', scopeId: 's1' });

    expect(result.found).toBe(true);
    expect(result.inheritedFrom).toBe('global');
    expect(result.configuration?.value).toBe('GlobalName');
    expect(repository.findByKey).toHaveBeenCalledWith('site.name', 'store', 's1');
    expect(repository.findByKey).toHaveBeenCalledWith('site.name', 'global');
  });

  it('should return not found when no configuration exists at any scope', async () => {
    const result = await new GetConfigurationUseCase(createConfigurationRepository()).execute({
      key: 'missing.key',
      scope: 'store',
      scopeId: 's1',
    });

    expect(result.found).toBe(false);
  });

  it('should not check the global scope again when the requested scope is already global', async () => {
    const repository = createConfigurationRepository();

    const result = await new GetConfigurationUseCase(repository).execute({ key: 'missing.key' });

    expect(result.found).toBe(false);
    expect(repository.findByKey).toHaveBeenCalledTimes(1);
  });
});
