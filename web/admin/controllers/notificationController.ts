/**
 * Notification Controller
 * Handles notification template management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';;
import notificationTemplateRepo from '../../../modules/notification/infrastructure/repositories/notificationTemplateRepo';
import { adminRespond } from '../../respond';

// ============================================================================
// Notification Templates Management
// ============================================================================

export const listNotificationTemplates = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const activeOnly = req.query.activeOnly !== 'false'; // Default to true
    const category = req.query.category as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let templates;
    if (category) {
      templates = await notificationTemplateRepo.findByCategory(category, activeOnly);
    } else {
      templates = await notificationTemplateRepo.findAll(activeOnly);
    }

    // Get categories for filtering
    const allTemplates = await notificationTemplateRepo.findAll(false);
    const categories = [...new Set(allTemplates.map(t => t.categoryCode).filter(Boolean))];

    // Get stats
    const totalCount = await notificationTemplateRepo.count(false);
    const activeCount = await notificationTemplateRepo.count(true);

    adminRespond(req, res, 'notifications/templates/index', {
      pageName: 'Notification Templates',
      templates,
      categories,
      filters: { activeOnly, category },
      stats: { total: totalCount, active: activeCount },

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load notification templates',
    });
  }
};

export const createNotificationTemplateForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'notifications/templates/create', {
      pageName: 'Create Notification Template',
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
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
    } = req.body;

    const template = await notificationTemplateRepo.create({
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
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'notifications/templates/create', {
      pageName: 'Create Notification Template',
      error: error.message || 'Failed to create notification template',
      formData: req.body,
    });
  }
};

export const viewNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;

    const template = await notificationTemplateRepo.findById(templateId);

    if (!template) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Notification template not found',
      });
      return;
    }

    // Get preview data
    const preview = await notificationTemplateRepo.getPreview(templateId);

    adminRespond(req, res, 'notifications/templates/view', {
      pageName: `Template: ${template.name}`,
      template,
      preview,

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load notification template',
    });
  }
};

export const editNotificationTemplateForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;

    const template = await notificationTemplateRepo.findById(templateId);

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
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const updates: any = {};

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
    } = req.body;

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

    const template = await notificationTemplateRepo.update(templateId, updates);

    if (!template) {
      throw new Error('Notification template not found after update');
    }

    res.redirect(`/hub/notifications/templates/${templateId}?success=Notification template updated successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    try {
      const template = await notificationTemplateRepo.findById(req.params.templateId);

      adminRespond(req, res, 'notifications/templates/edit', {
        pageName: `Edit: ${template?.name || 'Template'}`,
        template,
        error: error.message || 'Failed to update notification template',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update notification template',
      });
    }
  }
};

export const activateNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;

    const template = await notificationTemplateRepo.activate(templateId);

    if (!template) {
      throw new Error('Notification template not found');
    }

    res.json({ success: true, message: 'Notification template activated successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to activate notification template' });
  }
};

export const deactivateNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;

    const template = await notificationTemplateRepo.deactivate(templateId);

    if (!template) {
      throw new Error('Notification template not found');
    }

    res.json({ success: true, message: 'Notification template deactivated successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to deactivate notification template' });
  }
};

export const deleteNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;

    const success = await notificationTemplateRepo.delete(templateId);

    if (!success) {
      throw new Error('Failed to delete notification template');
    }

    res.json({ success: true, message: 'Notification template deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to delete notification template' });
  }
};

export const cloneNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const { newCode, newName } = req.body;

    const clonedTemplate = await notificationTemplateRepo.clone(templateId, newCode, newName);

    res.json({
      success: true,
      message: 'Notification template cloned successfully',
      template: clonedTemplate,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to clone notification template' });
  }
};

export const previewNotificationTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const previewData = req.body.data ? JSON.parse(req.body.data) : undefined;

    const preview = await notificationTemplateRepo.getPreview(templateId, previewData);

    res.json({
      success: true,
      preview,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to preview notification template' });
  }
};

// ============================================================================
// Notification Batches Management
// ============================================================================

import { query, queryOne } from '../../../libs/db';
import notificationWebhookRepo from '../../../modules/notification/infrastructure/repositories/notificationWebhookRepo';
import notificationDeliveryLogRepo from '../../../modules/notification/infrastructure/repositories/notificationDeliveryLogRepo';
import notificationTemplateTranslationRepo from '../../../modules/notification/infrastructure/repositories/notificationTemplateTranslationRepo';

export const listBatches = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const batches = await query<any[]>(
      `SELECT * FROM "notificationBatch" ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    ) || [];

    const totalResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "notificationBatch"`);
    const total = totalResult ? parseInt(totalResult.count, 10) : 0;

    adminRespond(req, res, 'notifications/batches/index', {
      pageName: 'Notification Batches',
      batches,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load batches' });
  }
};

export const viewBatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;

    const batch = await queryOne<any>(
      `SELECT * FROM "notificationBatch" WHERE "notificationBatchId" = $1`,
      [batchId],
    );

    if (!batch) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Batch not found' });
      return;
    }

    const deliveryLogs = await query<any[]>(
      `SELECT * FROM "notificationDeliveryLog" WHERE "notificationId" IN (
        SELECT "notificationId" FROM "notification" WHERE "notificationBatchId" = $1
      ) ORDER BY "createdAt" DESC LIMIT 100`,
      [batchId],
    ) || [];

    adminRespond(req, res, 'notifications/batches/detail', {
      pageName: `Batch: ${batch.name}`,
      batch,
      deliveryLogs,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load batch' });
  }
};

// ============================================================================
// Notification Webhooks Management
// ============================================================================

export const listWebhooks = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const webhooks = await query<any[]>(
      `SELECT * FROM "notificationWebhook" ORDER BY "createdAt" DESC`,
    ) || [];

    adminRespond(req, res, 'notifications/webhooks/index', {
      pageName: 'Notification Webhooks',
      webhooks,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load webhooks' });
  }
};

export const createWebhookForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'notifications/webhooks/form', {
      pageName: 'Create Webhook',
      webhook: null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load form' });
  }
};

export const createWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { url, secret, events, merchantId } = req.body;
    const eventsArray = Array.isArray(events) ? events : (events ? [events] : []);

    await notificationWebhookRepo.create({
      url,
      secret: secret || undefined,
      events: eventsArray,
      isActive: true,
      merchantId: merchantId || undefined,
    });

    res.redirect('/admin/notifications/webhooks?success=Webhook+created+successfully');
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'notifications/webhooks/form', {
      pageName: 'Create Webhook',
      webhook: null,
      error: error.message || 'Failed to create webhook',
      formData: req.body,
    });
  }
};

export const deactivateWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { webhookId } = req.params;
    await notificationWebhookRepo.deactivate(webhookId);
    res.redirect('/admin/notifications/webhooks?success=Webhook+deactivated');
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect('/admin/notifications/webhooks?error=' + encodeURIComponent(error.message || 'Failed to deactivate webhook'));
  }
};

// ============================================================================
// Notification Template Translations
// ============================================================================

export const listTemplateTranslations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;

    const template = await notificationTemplateRepo.findById(templateId);

    if (!template) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Notification template not found' });
      return;
    }

    const translations = await notificationTemplateTranslationRepo.findByTemplate(templateId);
    const preview = await notificationTemplateRepo.getPreview(templateId);

    adminRespond(req, res, 'notifications/templates/view', {
      pageName: `Template: ${template.name}`,
      template,
      preview,
      translations,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load template translations' });
  }
};
