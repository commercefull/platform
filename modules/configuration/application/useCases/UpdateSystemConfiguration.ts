/**
 * Update System Configuration Use Case
 * Updates system configuration settings
 */

import { SystemConfigurationRepository } from '../../domain/repositories/SystemConfigurationRepository';
import { SystemConfiguration } from '../../domain/entities/SystemConfiguration';

export class UpdateSystemConfigurationCommand {
  constructor(
    public readonly configId: string,
    public readonly updates: {
      platformName?: string;
      platformDomain?: string;
      supportEmail?: string;
      defaultCurrency?: string;
      defaultLanguage?: string;
      timezone?: string;
      systemMode?: 'marketplace' | 'multi_store' | 'single_store';
      features?: any;
      businessSettings?: any;
      platformSettings?: any;
      securitySettings?: any;
      notificationSettings?: any;
      integrationSettings?: any;
      metadata?: any;
    }
  ) {}
}

export interface UpdateSystemConfigurationResponse {
  configId: string;
  systemMode: string;
  platformName: string;
  updatedAt: string;
}

export class UpdateSystemConfigurationUseCase {
  constructor(
    private readonly systemConfigRepository: SystemConfigurationRepository
  ) {}

  async execute(command: UpdateSystemConfigurationCommand): Promise<UpdateSystemConfigurationResponse> {
    // Find existing configuration
    const existingConfig = await this.systemConfigRepository.findById(command.configId);
    if (!existingConfig) {
      throw new Error('System configuration not found');
    }

    // Apply updates
    if (command.updates.systemMode) {
      existingConfig.changeSystemMode(command.updates.systemMode);
    }

    if (command.updates.platformName || command.updates.platformDomain ||
        command.updates.supportEmail || command.updates.defaultCurrency ||
        command.updates.defaultLanguage || command.updates.timezone) {
      existingConfig.updatePlatformSettings({
        platformName: command.updates.platformName,
        platformDomain: command.updates.platformDomain,
        supportEmail: command.updates.supportEmail,
        defaultCurrency: command.updates.defaultCurrency,
        defaultLanguage: command.updates.defaultLanguage,
        timezone: command.updates.timezone
      });
    }

    if (command.updates.features) {
      existingConfig.updateFeatures(command.updates.features);
    }

    if (command.updates.businessSettings) {
      existingConfig.updateBusinessSettings(command.updates.businessSettings);
    }

    if (command.updates.securitySettings) {
      existingConfig.updateSecuritySettings(command.updates.securitySettings);
    }

    if (command.updates.notificationSettings) {
      existingConfig.updateNotificationSettings(command.updates.notificationSettings);
    }

    if (command.updates.integrationSettings) {
      existingConfig.updateIntegrationSettings(command.updates.integrationSettings);
    }

    if (command.updates.metadata) {
      existingConfig.updateMetadata(command.updates.metadata);
    }

    // Save updated configuration
    const updatedConfig = await this.systemConfigRepository.save(existingConfig);

    return {
      configId: updatedConfig.configId,
      systemMode: updatedConfig.systemMode,
      platformName: updatedConfig.platformSettings.platformName,
      updatedAt: updatedConfig.updatedAt.toISOString()
    };
  }
}
