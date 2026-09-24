import { createSystemConfiguration, createSystemConfigurationRepository } from '../../tests/testUtils';
import { UpdateSystemConfigurationUseCase, UpdateSystemConfigurationCommand } from './UpdateSystemConfiguration';
import { ConfigurationNotFoundError } from '../../domain/errors/ConfigurationErrors';

describe('UpdateSystemConfigurationUseCase', () => {
  it('should change the system mode when a new mode is provided', async () => {
    const repository = createSystemConfigurationRepository(createSystemConfiguration({ systemMode: 'multi_store' }));

    const result = await new UpdateSystemConfigurationUseCase(repository).execute(
      new UpdateSystemConfigurationCommand('cfg-1', { systemMode: 'single_store' }),
    );

    expect(result.systemMode).toBe('single_store');
    expect(repository.save).toHaveBeenCalled();
    expect(repository.save.mock.calls[0][0].features.enableMultiStore).toBe(false);
  });

  it('should update the platform settings when platform fields are provided', async () => {
    const repository = createSystemConfigurationRepository();

    const result = await new UpdateSystemConfigurationUseCase(repository).execute(
      new UpdateSystemConfigurationCommand('cfg-1', { platformName: 'New Name', defaultCurrency: 'EUR' }),
    );

    expect(result.platformName).toBe('New Name');
    expect(repository.save.mock.calls[0][0].platformSettings.defaultCurrency).toBe('EUR');
  });

  it('should update features when feature flags are provided', async () => {
    const repository = createSystemConfigurationRepository();

    await new UpdateSystemConfigurationUseCase(repository).execute(
      new UpdateSystemConfigurationCommand('cfg-1', { features: { enableCoupons: false } }),
    );

    expect(repository.save.mock.calls[0][0].features.enableCoupons).toBe(false);
  });

  it('should merge metadata when metadata is provided', async () => {
    const repository = createSystemConfigurationRepository(createSystemConfiguration({ metadata: { tier: 'gold' } }));

    await new UpdateSystemConfigurationUseCase(repository).execute(
      new UpdateSystemConfigurationCommand('cfg-1', { metadata: { region: 'eu' } }),
    );

    expect(repository.save.mock.calls[0][0].metadata).toEqual({ tier: 'gold', region: 'eu' });
  });

  it('should throw ConfigurationNotFoundError when the configuration does not exist', async () => {
    const repository = createSystemConfigurationRepository(null);

    await expect(
      new UpdateSystemConfigurationUseCase(repository).execute(new UpdateSystemConfigurationCommand('missing', {})),
    ).rejects.toThrow(ConfigurationNotFoundError);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
