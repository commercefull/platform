/**
 * System Configuration HTTP Controller
 * Handles system configuration-related HTTP requests
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import { SystemConfiguration } from '../../domain/entities/SystemConfiguration';
import { UpdateSystemConfigurationUseCase, UpdateSystemConfigurationCommand } from '../../application/useCases/UpdateSystemConfiguration';
import { SystemConfigurationRepo } from '../../infrastructure/repositories/SystemConfigurationRepo';

export class SystemConfigurationController {
  private updateSystemConfigurationUseCase: UpdateSystemConfigurationUseCase;

  constructor() {
    const systemConfigRepository = new SystemConfigurationRepo();
    this.updateSystemConfigurationUseCase = new UpdateSystemConfigurationUseCase(
      systemConfigRepository
    );
  }

  /**
   * Create system configuration
   * POST /business/configuration
   */
  async createSystemConfiguration(req: Request, res: Response) {
    try {
      const config = SystemConfiguration.create({
        configId: req.body.configId || `config_${Date.now()}`,
        platformName: req.body.platformName,
        platformDomain: req.body.platformDomain,
        supportEmail: req.body.supportEmail,
        defaultCurrency: req.body.defaultCurrency,
        defaultLanguage: req.body.defaultLanguage,
        timezone: req.body.timezone
      });

      const systemConfigRepository = new SystemConfigurationRepo();
      await systemConfigRepository.save(config);

      res.status(201).json({
        success: true,
        data: config.toJSON()
      });
    } catch (error) {
      logger.error('Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        message: 'Failed to create system configuration',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Update system configuration
   * PUT /business/configuration/:configId
   */
  async updateSystemConfiguration(req: Request, res: Response) {
    try {
      const command = new UpdateSystemConfigurationCommand(
        req.params.configId,
        {
          platformName: req.body.platformName,
          platformDomain: req.body.platformDomain,
          supportEmail: req.body.supportEmail,
          defaultCurrency: req.body.defaultCurrency,
          defaultLanguage: req.body.defaultLanguage,
          timezone: req.body.timezone,
          systemMode: req.body.systemMode,
          features: req.body.features,
          businessSettings: req.body.businessSettings,
          platformSettings: req.body.platformSettings,
          securitySettings: req.body.securitySettings,
          notificationSettings: req.body.notificationSettings,
          integrationSettings: req.body.integrationSettings,
          metadata: req.body.metadata
        }
      );

      const result = await this.updateSystemConfigurationUseCase.execute(command);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        message: 'Failed to update system configuration',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Get system configuration by ID
   * GET /business/configuration/:configId
   */
  async getSystemConfiguration(req: Request, res: Response) {
    try {
      const systemConfigRepository = new SystemConfigurationRepo();
      const config = await systemConfigRepository.findById(req.params.configId);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'System configuration not found'
        });
      }

      res.json({
        success: true,
        data: config.toJSON()
      });
    } catch (error) {
      logger.error('Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get system configuration',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * Get active system configuration
   * GET /business/configuration/active
   */
  async getActiveSystemConfiguration(req: Request, res: Response) {
    try {
      const systemConfigRepository = new SystemConfigurationRepo();
      const config = await systemConfigRepository.findActive();

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'No active system configuration found'
        });
      }

      res.json({
        success: true,
        data: config.toJSON()
      });
    } catch (error) {
      logger.error('Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to get active system configuration',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * List all system configurations
   * GET /business/configuration
   */
  async listSystemConfigurations(req: Request, res: Response) {
    try {
      const systemConfigRepository = new SystemConfigurationRepo();
      const configs = await systemConfigRepository.findAll();

      res.json({
        success: true,
        data: configs.map(config => config.toJSON()),
        count: configs.length
      });
    } catch (error) {
      logger.error('Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to list system configurations',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }
}
