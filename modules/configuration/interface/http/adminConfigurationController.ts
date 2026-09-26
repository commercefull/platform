/**
 * System Configuration Admin UI Controller
 * Admin views for managing system configuration
 */

import { randomUUID } from 'crypto';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { manageSystemConfigurationUseCase } from '../../application/wired';
import { SystemConfiguration } from '../../domain/entities/SystemConfiguration';
import { adminRespond } from '../../../../libs/adminRespond';

export const listSystemConfigurations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const configs = await manageSystemConfigurationUseCase.findAll();

  adminRespond(req, res, 'configuration/index', {
    pageName: 'System Configurations',
    configs: configs.map(c => c.toJSON()),
    success: req.query.success || null,
  });
};

export const viewSystemConfiguration = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { configId } = req.params;
  const config = await manageSystemConfigurationUseCase.findById(configId);

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

export const createSystemConfigurationForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'configuration/create', { pageName: 'Create System Configuration' });
};

export const createSystemConfiguration = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as HttpRequestBody;
  const config = SystemConfiguration.create({
    configId: randomUUID(),
    platformName: body.platformName as string,
    platformDomain: body.platformDomain as string,
    supportEmail: body.supportEmail as string,
    defaultCurrency: body.defaultCurrency as string | undefined,
    defaultLanguage: body.defaultLanguage as string | undefined,
    timezone: body.timezone as string | undefined,
  });

  await manageSystemConfigurationUseCase.save(config);

  res.redirect(`/admin/configuration/${config.configId}?success=Configuration created successfully`);
};

export const editSystemConfigurationForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { configId } = req.params;
  const config = await manageSystemConfigurationUseCase.findById(configId);

  if (!config) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Configuration not found' });
    return;
  }

  adminRespond(req, res, 'configuration/edit', {
    pageName: `Edit: ${config.platformSettings.platformName}`,
    config: config.toJSON(),
  });
};

export const updateSystemConfiguration = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { configId } = req.params;
  const body = req.body as HttpRequestBody;
  const config = await manageSystemConfigurationUseCase.findById(configId);

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

  await manageSystemConfigurationUseCase.save(config);

  res.redirect(`/admin/configuration/${configId}?success=Configuration updated successfully`);
};
