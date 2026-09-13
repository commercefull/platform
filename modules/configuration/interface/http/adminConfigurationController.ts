/**
 * System Configuration Admin UI Controller
 * Admin views for managing system configuration
 */

import { randomUUID } from 'crypto';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { SystemConfigurationRepo } from '../../application/wired';
import { SystemConfiguration } from '../../domain/entities/SystemConfiguration';
import { adminRespond } from '../../../../libs/adminRespond';

export const listSystemConfigurations = async (req: TypedRequest, res: Response): Promise<void> => {
  const repo = new SystemConfigurationRepo();
  const configs = await repo.findAll();

  adminRespond(req, res, 'configuration/index', {
    pageName: 'System Configurations',
    configs: configs.map(c => c.toJSON()),
    success: req.query.success || null,
  });
};

export const viewSystemConfiguration = async (req: TypedRequest, res: Response): Promise<void> => {
  const { configId } = req.params;
  const repo = new SystemConfigurationRepo();
  const config = await repo.findById(configId);

  if (!config) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Configuration not found' });
    return;
  }

  adminRespond(req, res, 'configuration/view', {
    pageName: `Config: ${config.platformSettings.platformName}`,
    config: config.toJSON(),
    success: req.query.success || null,
  });
};

export const createSystemConfigurationForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'configuration/create', { pageName: 'Create System Configuration' });
};

export const createSystemConfiguration = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as RequestBody;
  const config = SystemConfiguration.create({
    configId: randomUUID(),
    platformName: body.platformName as string,
    platformDomain: body.platformDomain as string,
    supportEmail: body.supportEmail as string,
    defaultCurrency: body.defaultCurrency as string | undefined,
    defaultLanguage: body.defaultLanguage as string | undefined,
    timezone: body.timezone as string | undefined,
  });

  const repo = new SystemConfigurationRepo();
  await repo.save(config);

  res.redirect(`/admin/configuration/${config.configId}?success=Configuration created successfully`);
};

export const editSystemConfigurationForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { configId } = req.params;
  const repo = new SystemConfigurationRepo();
  const config = await repo.findById(configId);

  if (!config) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Configuration not found' });
    return;
  }

  adminRespond(req, res, 'configuration/edit', {
    pageName: `Edit: ${config.platformSettings.platformName}`,
    config: config.toJSON(),
  });
};

export const updateSystemConfiguration = async (req: TypedRequest, res: Response): Promise<void> => {
  const { configId } = req.params;
  const body = req.body as RequestBody;
  const repo = new SystemConfigurationRepo();
  const config = await repo.findById(configId);

  if (!config) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Configuration not found' });
    return;
  }

  config.updatePlatformSettings({
    platformName: body.platformName as string | undefined,
    platformDomain: body.platformDomain as string | undefined,
    supportEmail: body.supportEmail as string | undefined,
    defaultCurrency: body.defaultCurrency as string | undefined,
    defaultLanguage: body.defaultLanguage as string | undefined,
    timezone: body.timezone as string | undefined,
  });

  await repo.save(config);

  res.redirect(`/admin/configuration/${configId}?success=Configuration updated successfully`);
};
