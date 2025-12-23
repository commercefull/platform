/**
 * Notification Controller
 * Handles notification template management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import notificationTemplateRepo from '../../../modules/notification/repos/notificationTemplateRepo';
import { adminRespond } from 'web/respond';

// ============================================================================
// Notification Templates Management
// ============================================================================

export const listNotificationTemplates = async (req: Request, res: Response): Promise<void> => {
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

export const createNotificationTemplateForm = async (req: Request, res: Response): Promise<void> => {
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

export const createNotificationTemplate = async (req: Request, res: Response): Promise<void> => {
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

export const viewNotificationTemplate = async (req: Request, res: Response): Promise<void> => {
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

export const editNotificationTemplateForm = async (req: Request, res: Response): Promise<void> => {
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

export const updateNotificationTemplate = async (req: Request, res: Response): Promise<void> => {
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

export const activateNotificationTemplate = async (req: Request, res: Response): Promise<void> => {
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

export const deactivateNotificationTemplate = async (req: Request, res: Response): Promise<void> => {
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

export const deleteNotificationTemplate = async (req: Request, res: Response): Promise<void> => {
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

export const cloneNotificationTemplate = async (req: Request, res: Response): Promise<void> => {
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

export const previewNotificationTemplate = async (req: Request, res: Response): Promise<void> => {
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
