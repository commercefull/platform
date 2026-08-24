/**
 * Notification Controller
 * Handles notification template management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageNotificationTemplatesUseCase } from '../../../modules/notification/application/useCases/ManageNotificationTemplates';
import { ManageNotificationBatchesUseCase } from '../../../modules/notification/application/useCases/ManageNotificationBatches';
import { GetNotificationDeliveryLogsUseCase } from '../../../modules/notification/application/useCases/GetNotificationDeliveryLogs';
import { ManageNotificationWebhooksAdminUseCase } from '../../../modules/notification/application/useCases/ManageNotificationWebhooksAdmin';
import { GetTemplateTranslationsUseCase } from '../../../modules/notification/application/useCases/GetTemplateTranslations';
import { adminRespond } from '../../respond';

const manageTemplatesUseCase = new ManageNotificationTemplatesUseCase();
const manageBatchesUseCase = new ManageNotificationBatchesUseCase();
const getDeliveryLogsUseCase = new GetNotificationDeliveryLogsUseCase();
const manageWebhooksUseCase = new ManageNotificationWebhooksAdminUseCase();
const getTranslationsUseCase = new GetTemplateTranslationsUseCase();

// ============================================================================
// Notification Templates Management
// ============================================================================

export const listNotificationTemplates = async (req: TypedRequest, res: Response): Promise<void> => {
  const activeOnly = req.query.activeOnly !== 'false'; // Default to true
  const category = req.query.category as string;
  const _limit = parseInt(req.query.limit as string) || 50;
  const _offset = parseInt(req.query.offset as string) || 0;

  let templates;
  if (category) {
    templates = await manageTemplatesUseCase.findByCategory(category, activeOnly);
  } else {
    templates = await manageTemplatesUseCase.findAll(activeOnly);
  }

  // Get categories for filtering
  const allTemplates = await manageTemplatesUseCase.findAll(false);
  const categories = [...new Set(allTemplates.map(t => t.categoryCode).filter(Boolean))];

  // Get stats
  const totalCount = await manageTemplatesUseCase.count(false);
  const activeCount = await manageTemplatesUseCase.count(true);

  adminRespond(req, res, 'notifications/templates/index', {
    pageName: 'Notification Templates',
    templates,
    categories,
    filters: { activeOnly, category },
    stats: { total: totalCount, active: activeCount },

    success: req.query.success || null,
  });
  
};

export const createNotificationTemplateForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'notifications/templates/create', {
    pageName: 'Create Notification Template',
  });
  
};

export const createNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const {
      code,
      name,
      description,
      type,
      supportedChannels,
      defaultChannel,
      subject,
      htmlTemplate,
      textTemplate,
      pushTemplate,
      smsTemplate,
      parameters,
      categoryCode,
    } = body;

    const template = await manageTemplatesUseCase.create({
      code,
      name,
      description: description || undefined,
      type,
      supportedChannels,
      defaultChannel,
      subject: subject || undefined,
      htmlTemplate: htmlTemplate || undefined,
      textTemplate: textTemplate || undefined,
      pushTemplate: pushTemplate || undefined,
      smsTemplate: smsTemplate || undefined,
      parameters: parameters ? JSON.parse(parameters) : undefined,
      isActive: true,
      categoryCode: categoryCode || undefined,
      createdBy: 'admin',
    });

    res.redirect(`/hub/notifications/templates/${template.notificationTemplateId}?success=Notification template created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'notifications/templates/create', {
      pageName: 'Create Notification Template',
      error: (error as Error).message || 'Failed to create notification template',
      formData: req.body as RequestBody,
    });
  }
};

export const viewNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { templateId } = req.params;

  const template = await manageTemplatesUseCase.findById(templateId);

  if (!template) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Notification template not found',
    });
    return;
  }

  // Get preview data
  const preview = await manageTemplatesUseCase.getPreview(templateId);

  adminRespond(req, res, 'notifications/templates/view', {
    pageName: `Template: ${template.name}`,
    template,
    preview,

    success: req.query.success || null,
  });
  
};

export const editNotificationTemplateForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { templateId } = req.params;

  const template = await manageTemplatesUseCase.findById(templateId);

  if (!template) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Notification template not found',
    });
    return;
  }

  adminRespond(req, res, 'notifications/templates/edit', {
    pageName: `Edit: ${template.name}`,
    template,
  });
  
};

export const updateNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { templateId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as RequestBody;
  const {
    name,
    description,
    supportedChannels,
    defaultChannel,
    subject,
    htmlTemplate,
    textTemplate,
    pushTemplate,
    smsTemplate,
    parameters,
    categoryCode,
    isActive,
  } = body;

  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description || undefined;
  if (supportedChannels !== undefined) updates.supportedChannels = supportedChannels;
  if (defaultChannel !== undefined) updates.defaultChannel = defaultChannel;
  if (subject !== undefined) updates.subject = subject || undefined;
  if (htmlTemplate !== undefined) updates.htmlTemplate = htmlTemplate || undefined;
  if (textTemplate !== undefined) updates.textTemplate = textTemplate || undefined;
  if (pushTemplate !== undefined) updates.pushTemplate = pushTemplate || undefined;
  if (smsTemplate !== undefined) updates.smsTemplate = smsTemplate || undefined;
  if (parameters !== undefined) updates.parameters = parameters ? JSON.parse(parameters) : undefined;
  if (categoryCode !== undefined) updates.categoryCode = categoryCode || undefined;
  if (isActive !== undefined) updates.isActive = isActive === 'true';

  const template = await manageTemplatesUseCase.update(templateId, updates);

  if (!template) {
    throw new Error('Notification template not found after update');
  }

  res.redirect(`/hub/notifications/templates/${templateId}?success=Notification template updated successfully`);
  
};

export const activateNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { templateId } = req.params;

  const template = await manageTemplatesUseCase.activate(templateId);

  if (!template) {
    throw new Error('Notification template not found');
  }

  res.json({ success: true, message: 'Notification template activated successfully' });
  
};

export const deactivateNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { templateId } = req.params;

  const template = await manageTemplatesUseCase.deactivate(templateId);

  if (!template) {
    throw new Error('Notification template not found');
  }

  res.json({ success: true, message: 'Notification template deactivated successfully' });
  
};

export const deleteNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { templateId } = req.params;

  const success = await manageTemplatesUseCase.delete(templateId);

  if (!success) {
    throw new Error('Failed to delete notification template');
  }

  res.json({ success: true, message: 'Notification template deleted successfully' });
  
};

export const cloneNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { templateId } = req.params;
  const body = req.body as RequestBody;
  const { newCode, newName } = body;

  const clonedTemplate = await manageTemplatesUseCase.clone(templateId, newCode, newName);

  res.json({
    success: true,
    message: 'Notification template cloned successfully',
    template: clonedTemplate,
  });
  
};

export const previewNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { templateId } = req.params;
  const previewData = (req.body as RequestBody).data ? JSON.parse((req.body as RequestBody).data) : undefined;

  const preview = await manageTemplatesUseCase.getPreview(templateId, previewData);

  res.json({
    success: true,
    preview,
  });
  
};

// ============================================================================
// Notification Batches Management
// ============================================================================

export const listBatches = async (req: TypedRequest, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const batches = await manageBatchesUseCase.findAll(limit, offset);
  const total = await manageBatchesUseCase.count();

  adminRespond(req, res, 'notifications/batches/index', {
    pageName: 'Notification Batches',
    batches,
    total,
    limit,
    offset,
  });
  
};

export const viewBatch = async (req: TypedRequest, res: Response): Promise<void> => {
  const { batchId } = req.params;

  const batch = await manageBatchesUseCase.findById(batchId);

  if (!batch) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Batch not found' });
    return;
  }

  const deliveryLogs = await getDeliveryLogsUseCase.findByBatchId(batchId, 100);

  adminRespond(req, res, 'notifications/batches/detail', {
    pageName: `Batch: ${batch.name}`,
    batch,
    deliveryLogs,
  });
  
};

// ============================================================================
// Notification Webhooks Management
// ============================================================================

export const listWebhooks = async (req: TypedRequest, res: Response): Promise<void> => {
  const webhooks = await manageWebhooksUseCase.findAll();

  adminRespond(req, res, 'notifications/webhooks/index', {
    pageName: 'Notification Webhooks',
    webhooks,
    success: req.query.success || null,
  });
  
};

export const createWebhookForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'notifications/webhooks/form', {
    pageName: 'Create Webhook',
    webhook: null,
  });
  
};

export const createWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { url, secret, events, organizationId } = body;
    const eventsArray = Array.isArray(events) ? events : events ? [events] : [];

    await manageWebhooksUseCase.create({
      url,
      secret: secret || undefined,
      events: eventsArray,
      isActive: true,
      organizationId: organizationId || undefined,
    });

    res.redirect('/admin/notifications/webhooks?success=Webhook+created+successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    adminRespond(req, res, 'notifications/webhooks/form', {
      pageName: 'Create Webhook',
      webhook: null,
      error: (error as Error).message || 'Failed to create webhook',
      formData: req.body as RequestBody,
    });
  }
};

export const deactivateWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { webhookId } = req.params;
    await manageWebhooksUseCase.deactivate(webhookId);
    res.redirect('/admin/notifications/webhooks?success=Webhook+deactivated');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect('/admin/notifications/webhooks?error=' + encodeURIComponent((error as Error).message || 'Failed to deactivate webhook'));
  }
};

// ============================================================================
// Notification Template Translations
// ============================================================================

export const listTemplateTranslations = async (req: TypedRequest, res: Response): Promise<void> => {
  const { templateId } = req.params;

  const template = await manageTemplatesUseCase.findById(templateId);

  if (!template) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Notification template not found' });
    return;
  }

  const translations = await getTranslationsUseCase.findByTemplate(templateId);
  const preview = await manageTemplatesUseCase.getPreview(templateId);

  adminRespond(req, res, 'notifications/templates/view', {
    pageName: `Template: ${template.name}`,
    template,
    preview,
    translations,
    success: req.query.success || null,
  });
  
};
