/**
 * System Configuration HTTP Controller
 * Handles system configuration-related HTTP requests
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { SystemConfiguration } from '../../domain/entities/SystemConfiguration';
import { UpdateSystemConfigurationUseCase, UpdateSystemConfigurationCommand } from '../../application/useCases/UpdateSystemConfiguration';
import { SystemConfigurationRepo } from '../../infrastructure/repositories/SystemConfigurationRepo';

interface CreateConfigBody {
  configId?: string;
  platformName: string;
  platformDomain: string;
  supportEmail: string;
  defaultCurrency?: string;
  defaultLanguage?: string;
  timezone?: string;
}

interface UpdateConfigBody {
  platformName?: string;
  platformDomain?: string;
  supportEmail?: string;
  defaultCurrency?: string;
  defaultLanguage?: string;
  timezone?: string;
  systemMode?: 'marketplace' | 'multi_store' | 'single_store';
  features?: Record<string, unknown>;
  businessSettings?: Record<string, unknown>;
  platformSettings?: Record<string, unknown>;
  securitySettings?: Record<string, unknown>;
  notificationSettings?: Record<string, unknown>;
  integrationSettings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class SystemConfigurationController {
  private updateSystemConfigurationUseCase: UpdateSystemConfigurationUseCase;

  constructor() {
    const systemConfigRepository = new SystemConfigurationRepo();
    this.updateSystemConfigurationUseCase = new UpdateSystemConfigurationUseCase(systemConfigRepository);
  }

  /**
   * Create system configuration
   * POST /business/configuration
   */
  async createSystemConfiguration(req: TypedRequest<Record<string, string>, unknown, CreateConfigBody>, res: Response) {
    try {
      const body = req.body;
      const config = SystemConfiguration.create({
        configId: body.configId || `config_${Date.now()}`,
        platformName: body.platformName,
        platformDomain: body.platformDomain,
        supportEmail: body.supportEmail,
        defaultCurrency: body.defaultCurrency,
        defaultLanguage: body.defaultLanguage,
        timezone: body.timezone,
      });

      const systemConfigRepository = new SystemConfigurationRepo();
      await systemConfigRepository.save(config);

      res.status(201).json({
        success: true,
        data: config.toJSON(),
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      res.status(400).json({
        success: false,
        message: 'Failed to create system configuration',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Update system configuration
   * PUT /business/configuration/:configId
   */
  async updateSystemConfiguration(req: TypedRequest<Record<string, string>, unknown, UpdateConfigBody>, res: Response) {
    try {
      const body = req.body;
      const command = new UpdateSystemConfigurationCommand(req.params.configId, {
        platformName: body.platformName,
        platformDomain: body.platformDomain,
        supportEmail: body.supportEmail,
        defaultCurrency: body.defaultCurrency,
        defaultLanguage: body.defaultLanguage,
        timezone: body.timezone,
        systemMode: body.systemMode,
        features: body.features,
        businessSettings: body.businessSettings,
        platformSettings: body.platformSettings,
        securitySettings: body.securitySettings,
        notificationSettings: body.notificationSettings,
        integrationSettings: body.integrationSettings,
        metadata: body.metadata,
      });

      const result = await this.updateSystemConfigurationUseCase.execute(command);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      res.status(400).json({
        success: false,
        message: 'Failed to update system configuration',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Get system configuration by ID
   * GET /business/configuration/:configId
   */
  async getSystemConfiguration(req: TypedRequest, res: Response) {
    try {
      const systemConfigRepository = new SystemConfigurationRepo();
      const config = await systemConfigRepository.findById(req.params.configId);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'System configuration not found',
        });
      }

      res.json({
        success: true,
        data: config.toJSON(),
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get system configuration',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * Get active system configuration
   * GET /business/configuration/active
   */
  async getActiveSystemConfiguration(req: TypedRequest, res: Response) {
    try {
      const systemConfigRepository = new SystemConfigurationRepo();
      const config = await systemConfigRepository.findActive();

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'No active system configuration found',
        });
      }

      res.json({
        success: true,
        data: config.toJSON(),
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get active system configuration',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }

  /**
   * List all system configurations
   * GET /business/configuration
   */
  async listSystemConfigurations(req: TypedRequest, res: Response) {
    try {
      const systemConfigRepository = new SystemConfigurationRepo();
      const configs = await systemConfigRepository.findAll();

      res.json({
        success: true,
        data: configs.map(config => config.toJSON()),
        count: configs.length,
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to list system configurations',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  }
}
