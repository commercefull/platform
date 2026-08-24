import { UpdateSystemConfigurationUseCase, UpdateSystemConfigurationCommand } from './UpdateSystemConfiguration';
import { ConfigurationNotFoundError } from '../../domain/errors/ConfigurationErrors';

describe('UpdateSystemConfigurationUseCase', () => {
  let useCase: UpdateSystemConfigurationUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockConfig: Record<string, unknown>;

  beforeEach(() => {
    mockConfig = {
      changeSystemMode: jest.fn(),
      updatePlatformSettings: jest.fn(),
      updateFeatures: jest.fn(),
      updateOrganizationSettings: jest.fn(),
      updateSecuritySettings: jest.fn(),
      updateNotificationSettings: jest.fn(),
      updateIntegrationSettings: jest.fn(),
      updateMetadata: jest.fn(),
      configId: 'cfg-1',
      systemMode: 'multi_store',
      platformSettings: { platformName: 'Updated' },
      updatedAt: new Date(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockConfig),
      save: jest.fn().mockResolvedValue(mockConfig),
    };
    useCase = new UpdateSystemConfigurationUseCase(mockRepo as never);
  });

  it('should update system mode (happy path)', async () => {
    const result = await useCase.execute(new UpdateSystemConfigurationCommand('cfg-1', { systemMode: 'single_store' }));

    expect(result.configId).toBe('cfg-1');
    expect(mockConfig.changeSystemMode).toHaveBeenCalledWith('single_store');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should update platform settings', async () => {
    await useCase.execute(new UpdateSystemConfigurationCommand('cfg-1', { platformName: 'New Name', defaultCurrency: 'EUR' }));

    expect(mockConfig.updatePlatformSettings).toHaveBeenCalled();
  });

  it('should throw ConfigurationNotFoundError when config not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateSystemConfigurationCommand('missing', {}))).rejects.toThrow(ConfigurationNotFoundError);
  });
});
