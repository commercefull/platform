import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { NotificationRepo } from '../../infrastructure/repositories/notificationRepo';
import * as notificationBatchRepo from '../../infrastructure/repositories/notificationBatchRepo';
import * as notificationTemplateTranslationRepo from '../../infrastructure/repositories/notificationTemplateTranslationRepo';
import notificationTemplateRepo, { NotificationTemplate } from '../../infrastructure/repositories/notificationTemplateRepo';
import { SendNotificationBatchUseCase, SendNotificationBatchCommand } from '../../application/useCases/SendNotificationBatch';
import { ManageNotificationWebhookUseCase, ManageNotificationWebhookCommand } from '../../application/useCases/ManageNotificationWebhook';
import { UpsertTemplateTranslationUseCase, UpsertTemplateTranslationCommand } from '../../application/useCases/UpsertTemplateTranslation';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import * as notificationPreferenceRepo from '../../infrastructure/repositories/notificationPreferenceRepo';

// Typed body interfaces
interface CreateNotificationBody {
  userId: string;
  userType?: string;
  type: string;
  title: string;
  content: string;
  channel: string;
  priority?: string;
  category?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface UpdateNotificationBody {
  title?: string;
  content?: string;
  priority?: string;
  category?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface SendBatchBody {
  name: string;
  channel: string;
  type: string;
  title: string;
  content: string;
  recipients: Array<{ userId: string; userType: string }>;
  scheduledAt?: string;
}

interface CreateWebhookBody {
  url: string;
  secret: string;
  events: string[];
}

interface UpsertTranslationBody {
  locale: string;
  subject?: string;
  body: string;
}

// Extend Express Request with User
interface UserRequest extends TypedRequest {
  user?: {
    _id?: string;
    id?: string;
    organizationId?: string;
  };
  flash: {
    (): { [key: string]: string[] };
    (message: string): string[];
    (type: string, message: string | string[]): number;
    (type: string, format: string, ...args: unknown[]): number;
  };
}

// Initialize the notification repository
const notificationRepo = new NotificationRepo();

// ============================================================================
// Existing notification CRUD handlers
// ============================================================================

export const getAllNotifications = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const notifications = await notificationRepo.findAll(limit, offset);
    res.status(200).json({
      success: true,
      data: notifications,
      pagination: { limit, offset, total: notifications.length },
    });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const getNotificationById = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await notificationRepo.findById(id);
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notification' });
  }
};

export const createNotification = async (req: TypedRequest<Record<string, string>, unknown, CreateNotificationBody>, res: Response): Promise<void> => {
  try {
    const { userId, userType, type, title, content, channel, priority, category, data, metadata } = req.body;
    if (!userId || !type || !title || !content || !channel) {
      res.status(400).json({ success: false, message: 'userId, type, title, content, and channel are required' });
      return;
    }
    const notification = await notificationRepo.create({
      userId,
      userType: userType || 'customer',
      type,
      title,
      content,
      channel,
      priority: priority || 'normal',
      category,
      data,
      metadata,
    });
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
};

export const updateNotification = async (req: TypedRequest<Record<string, string>, unknown, UpdateNotificationBody>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, priority, category, data, metadata } = req.body;
    const existing = await notificationRepo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    const updated = await notificationRepo.update(id, { title, content, priority, category, data, metadata });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

export const markNotificationAsSent = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await notificationRepo.markAsSent(id);
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as sent' });
  }
};

export const getUnreadNotifications = async (req: UserRequest, res: Response): Promise<void> => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  try {
    const notifications = await notificationRepo.findUnreadByUser(userId);
    res.json({ success: true, data: notifications });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const getRecentNotifications = async (req: UserRequest, res: Response): Promise<void> => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  try {
    const notifications = await notificationRepo.findByUser(userId, limit);
    res.json({ success: true, data: notifications });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const markNotificationAsRead = async (req: UserRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  try {
    const updatedNotification = await notificationRepo.markAsRead(id);
    if (!updatedNotification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    if (updatedNotification.userId !== userId) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }
    res.json({ success: true, data: updatedNotification });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

export const markAllNotificationsAsRead = async (req: UserRequest, res: Response): Promise<void> => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  try {
    const updatedCount = await notificationRepo.markAllAsRead(userId);
    res.json({ success: true, data: { count: updatedCount } });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};

export const deleteNotification = async (req: UserRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  try {
    const notification = await notificationRepo.findById(id);
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    if (notification.userId !== userId) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const deleted = await notificationRepo.delete(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Notification not found or already deleted' });
      return;
    }
    res.json({ success: true, data: { id } });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

export const getUnreadCount = async (req: UserRequest, res: Response): Promise<void> => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  try {
    const count = await notificationRepo.countUnread(userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get notification count' });
  }
};

// ============================================================================
// Batch handlers
// ============================================================================

/**
 * GET /business/notifications/batches
 */
export const listBatches = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    successResponse(res, { batches: [], limit, offset });
  } catch (error: unknown) {
    logger.error('listBatches error:', error);
    errorResponse(res, (error as Error).message || 'Failed to list batches');
  }
};

/**
 * GET /business/notifications/batches/:batchId
 */
export const getBatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;
    const batch = await notificationBatchRepo.findById(batchId);
    if (!batch) {
      errorResponse(res, 'Batch not found', 404);
      return;
    }
    successResponse(res, { batch });
  } catch (error: unknown) {
    logger.error('getBatch error:', error);
    errorResponse(res, (error as Error).message || 'Failed to get batch');
  }
};

/**
 * POST /business/notifications/batches
 */
export const sendBatch = async (req: TypedRequest<Record<string, string>, unknown, SendBatchBody>, res: Response): Promise<void> => {
  try {
    const { name, channel, type, title, content, recipients, scheduledAt } = req.body;
    const useCase = new SendNotificationBatchUseCase();
    const result = await useCase.execute(
      new SendNotificationBatchCommand(name, channel, type, title, content, recipients, scheduledAt ? new Date(scheduledAt) : undefined),
    );
    successResponse(res, result, 201);
  } catch (error: unknown) {
    logger.error('sendBatch error:', error);
    errorResponse(res, (error as Error).message || 'Failed to send batch');
  }
};

// ============================================================================
// Webhook handlers
// ============================================================================

/**
 * GET /business/notifications/webhooks
 */
export const listWebhooks = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || (req.query.organizationId as string);
    const useCase = new ManageNotificationWebhookUseCase();
    const result = await useCase.execute(new ManageNotificationWebhookCommand('list', organizationId));
    if (!result.success) {
      errorResponse(res, result.error || 'Failed to list webhooks', 400);
      return;
    }
    successResponse(res, { webhooks: result.webhooks });
  } catch (error: unknown) {
    logger.error('listWebhooks error:', error);
    errorResponse(res, (error as Error).message || 'Failed to list webhooks');
  }
};

/**
 * POST /business/notifications/webhooks
 */
export const createWebhook = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId || req.user?.id;
    const { url, secret, events } = req.body as CreateWebhookBody;
    const useCase = new ManageNotificationWebhookUseCase();
    const result = await useCase.execute(new ManageNotificationWebhookCommand('create', organizationId, undefined, url, secret, events));
    if (!result.success) {
      errorResponse(res, result.error || 'Failed to create webhook', 400);
      return;
    }
    successResponse(res, result.webhook, 201);
  } catch (error: unknown) {
    logger.error('createWebhook error:', error);
    errorResponse(res, (error as Error).message || 'Failed to create webhook');
  }
};

/**
 * DELETE /business/notifications/webhooks/:webhookId
 */
export const deactivateWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { webhookId } = req.params;
    const useCase = new ManageNotificationWebhookUseCase();
    const result = await useCase.execute(new ManageNotificationWebhookCommand('deactivate', undefined, webhookId));
    if (!result.success) {
      errorResponse(res, result.error || 'Failed to deactivate webhook', 400);
      return;
    }
    successResponse(res, { webhookId });
  } catch (error: unknown) {
    logger.error('deactivateWebhook error:', error);
    errorResponse(res, (error as Error).message || 'Failed to deactivate webhook');
  }
};

// ============================================================================
// Template translation handlers
// ============================================================================

/**
 * GET /business/notifications/templates/:templateId/translations
 */
export const listTranslations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const translations = await notificationTemplateTranslationRepo.findByTemplate(templateId);
    successResponse(res, { translations });
  } catch (error: unknown) {
    logger.error('listTranslations error:', error);
    errorResponse(res, (error as Error).message || 'Failed to list translations');
  }
};

/**
 * POST /business/notifications/templates/:templateId/translations
 */
export const upsertTranslation = async (req: TypedRequest<Record<string, string>, unknown, UpsertTranslationBody>, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const { locale, subject, body } = req.body;
    const useCase = new UpsertTemplateTranslationUseCase(notificationTemplateTranslationRepo);
    const result = await useCase.execute(new UpsertTemplateTranslationCommand(templateId, locale, body, subject));
    successResponse(res, result);
  } catch (error: unknown) {
    logger.error('upsertTranslation error:', error);
    errorResponse(res, (error as Error).message || 'Failed to upsert translation');
  }
};

// ============================================================================
// Notification Template CRUD handlers
// ============================================================================

interface CreateTemplateBody {
  code: string;
  name: string;
  description?: string;
  type: string;
  supportedChannels: string[];
  defaultChannel: string;
  subject?: string;
  htmlTemplate?: string;
  textTemplate?: string;
  pushTemplate?: string;
  smsTemplate?: string;
  parameters?: Record<string, unknown>;
  isActive?: boolean;
  categoryCode?: string;
  previewData?: Record<string, unknown>;
}

interface UpdateTemplateBody {
  name?: string;
  description?: string;
  type?: string;
  supportedChannels?: string[];
  defaultChannel?: string;
  subject?: string;
  htmlTemplate?: string;
  textTemplate?: string;
  pushTemplate?: string;
  smsTemplate?: string;
  parameters?: Record<string, unknown>;
  isActive?: boolean;
  categoryCode?: string;
  previewData?: Record<string, unknown>;
}

function mapTemplate(t: NotificationTemplate) {
  return {
    id: t.notificationTemplateId,
    code: t.code,
    name: t.name,
    description: t.description,
    type: t.type,
    supportedChannels: t.supportedChannels,
    defaultChannel: t.defaultChannel,
    subject: t.subject,
    htmlTemplate: t.htmlTemplate,
    textTemplate: t.textTemplate,
    pushTemplate: t.pushTemplate,
    smsTemplate: t.smsTemplate,
    parameters: t.parameters,
    isActive: t.isActive,
    categoryCode: t.categoryCode,
    previewData: t.previewData,
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export const getAllTemplates = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const templates = await notificationTemplateRepo.findAll(activeOnly);
    successResponse(res, templates.map(mapTemplate));
  } catch (error: unknown) {
    logger.error('getAllTemplates error:', error);
    errorResponse(res, (error as Error).message || 'Failed to fetch templates');
  }
};

export const getTemplateById = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const template = await notificationTemplateRepo.findById(String(req.params.id));
    if (!template) {
      errorResponse(res, 'Template not found', 404);
      return;
    }
    successResponse(res, mapTemplate(template));
  } catch (error: unknown) {
    logger.error('getTemplateById error:', error);
    errorResponse(res, (error as Error).message || 'Failed to fetch template');
  }
};

export const getTemplatesByType = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params;
    const all = await notificationTemplateRepo.findAll(false);
    const filtered = all.filter((t) => t.type === type);
    successResponse(res, filtered.map(mapTemplate));
  } catch (error: unknown) {
    logger.error('getTemplatesByType error:', error);
    errorResponse(res, (error as Error).message || 'Failed to fetch templates by type');
  }
};

export const createTemplate = async (req: TypedRequest<Record<string, string>, unknown, CreateTemplateBody>, res: Response): Promise<void> => {
  try {
    const { code, name, type, supportedChannels, defaultChannel } = req.body;
    if (!code || !name || !type || !supportedChannels || !defaultChannel) {
      errorResponse(res, 'code, name, type, supportedChannels, and defaultChannel are required', 400);
      return;
    }

    const created = await notificationTemplateRepo.create({
      code,
      name,
      description: req.body.description,
      type: type as never,
      supportedChannels: supportedChannels as never,
      defaultChannel: defaultChannel as never,
      subject: req.body.subject,
      htmlTemplate: req.body.htmlTemplate,
      textTemplate: req.body.textTemplate,
      pushTemplate: req.body.pushTemplate,
      smsTemplate: req.body.smsTemplate,
      parameters: req.body.parameters,
      isActive: req.body.isActive ?? true,
      categoryCode: req.body.categoryCode,
      previewData: req.body.previewData,
    });

    successResponse(res, mapTemplate(created), 201);
  } catch (error: unknown) {
    logger.error('createTemplate error:', error);
    errorResponse(res, (error as Error).message || 'Failed to create template');
  }
};

export const updateTemplate = async (req: TypedRequest<Record<string, string>, unknown, UpdateTemplateBody>, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await notificationTemplateRepo.findById(id);
    if (!existing) {
      errorResponse(res, 'Template not found', 404);
      return;
    }

    const updated = await notificationTemplateRepo.update(id, {
      name: req.body.name,
      description: req.body.description,
      type: req.body.type as never,
      supportedChannels: req.body.supportedChannels as never,
      defaultChannel: req.body.defaultChannel as never,
      subject: req.body.subject,
      htmlTemplate: req.body.htmlTemplate,
      textTemplate: req.body.textTemplate,
      pushTemplate: req.body.pushTemplate,
      smsTemplate: req.body.smsTemplate,
      parameters: req.body.parameters,
      isActive: req.body.isActive,
      categoryCode: req.body.categoryCode,
      previewData: req.body.previewData,
    });

    successResponse(res, mapTemplate(updated || existing));
  } catch (error: unknown) {
    logger.error('updateTemplate error:', error);
    errorResponse(res, (error as Error).message || 'Failed to update template');
  }
};

export const deleteTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await notificationTemplateRepo.findById(id);
    if (!existing) {
      errorResponse(res, 'Template not found', 404);
      return;
    }

    const deleted = await notificationTemplateRepo.delete(id);
    if (!deleted) {
      errorResponse(res, 'Failed to delete template', 500);
      return;
    }
    successResponse(res, { id });
  } catch (error: unknown) {
    logger.error('deleteTemplate error:', error);
    errorResponse(res, (error as Error).message || 'Failed to delete template');
  }
};

export const previewTemplate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { data, channel } = req.body as { data?: Record<string, unknown>; channel?: string };
    const result = await notificationTemplateRepo.getPreview(id, data);

    const template = result.template;
    const html = channel === 'email' || !channel ? result.compiledHtml : undefined;
    const text = channel === 'email' || !channel ? result.compiledText : undefined;

    successResponse(res, { html, text, template: mapTemplate(template) });
  } catch (error: unknown) {
    logger.error('previewTemplate error:', error);
    errorResponse(res, (error as Error).message || 'Failed to preview template');
  }
};

// ============================================================================
// Admin Notification Preference handlers
// ============================================================================

function mapPreferenceAdmin(p: notificationPreferenceRepo.NotificationPreference) {
  return {
    id: p.notificationPreferenceId,
    userId: p.userId,
    userType: p.userType,
    type: p.type,
    channelPreferences: p.channelPreferences,
    isEnabled: p.isEnabled,
    schedulePreferences: p.schedulePreferences || null,
    metadata: p.metadata || null,
    updatedAt: p.updatedAt.toISOString ? p.updatedAt.toISOString() : String(p.updatedAt),
  };
}

export const getAllPreferences = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const preferences = await notificationPreferenceRepo.findAll();
    successResponse(res, preferences.map(mapPreferenceAdmin));
  } catch (error: unknown) {
    logger.error('getAllPreferences error:', error);
    errorResponse(res, (error as Error).message || 'Failed to fetch preferences');
  }
};

export const getPreferencesByUser = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.userId);
    const preferences = await notificationPreferenceRepo.findByUser(userId, 'customer');
    successResponse(res, preferences.map(mapPreferenceAdmin));
  } catch (error: unknown) {
    logger.error('getPreferencesByUser error:', error);
    errorResponse(res, (error as Error).message || 'Failed to fetch preferences');
  }
};

interface UpdatePreferenceAdminBody {
  channelPreferences?: Record<string, boolean>;
  isEnabled?: boolean;
  schedulePreferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export const updatePreferenceAdmin = async (req: TypedRequest<Record<string, string>, unknown, UpdatePreferenceAdminBody>, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await notificationPreferenceRepo.findById(id);
    if (!existing) {
      errorResponse(res, 'Preference not found', 404);
      return;
    }

    const { channelPreferences, isEnabled, schedulePreferences, metadata } = req.body;
    const updated = await notificationPreferenceRepo.update(id, {
      channelPreferences,
      isEnabled,
      schedulePreferences,
      metadata,
    });

    if (!updated) {
      errorResponse(res, 'Failed to update preference', 500);
      return;
    }
    successResponse(res, mapPreferenceAdmin(updated));
  } catch (error: unknown) {
    logger.error('updatePreferenceAdmin error:', error);
    errorResponse(res, (error as Error).message || 'Failed to update preference');
  }
};
