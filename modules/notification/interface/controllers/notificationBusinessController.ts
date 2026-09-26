import type { HttpRequest, HttpResponse } from 'libs/http';
import { SendNotificationBatchCommand } from '../../application/useCases/SendNotificationBatch';
import { ManageNotificationWebhookCommand } from '../../application/useCases/ManageNotificationWebhook';
import { UpsertTemplateTranslationCommand } from '../../application/useCases/UpsertTemplateTranslation';
import {
  sendNotificationBatchUseCase,
  manageNotificationWebhookUseCase,
  upsertTemplateTranslationUseCase,
  getTemplateTranslationsUseCase,
  manageNotificationBatchesUseCase,
  manageNotificationTemplatesUseCase,
  manageNotificationPreferencesUseCase,
  manageNotificationRecordsUseCase,
} from '../../application/useCases/wired';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';
import { NotificationTemplate, NotificationPreference } from '../../application/wired';

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
  name?: string;
  channel: string;
  type: string;
  title: string;
  content: string;
  recipients?: Array<{ userId: string; userType: string }>;
  userIds?: string[];
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
interface UserRequest extends HttpRequest {
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

function respondError(res: HttpResponse, error: unknown, fallback: string): void {
  res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) || fallback });
}

// ============================================================================
// Existing notification CRUD handlers
// ============================================================================

export const getAllNotifications = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const notifications = await manageNotificationRecordsUseCase.list(limit, offset);
  res.status(200).json({
    success: true,
    data: notifications,
    pagination: { limit, offset, total: notifications.length },
  });
};

export const getNotificationById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  try {
    res.status(200).json({ success: true, data: await manageNotificationRecordsUseCase.getById(id) });
  } catch (error) {
    respondError(res, error, 'Notification not found');
  }
};

export const createNotification = async (
  req: HttpRequest<Record<string, string>, unknown, CreateNotificationBody>,
  res: HttpResponse,
): Promise<void> => {
  const { userId, userType, type, title, content, channel, priority, category, data, metadata } = req.body;
  try {
    const notification = await manageNotificationRecordsUseCase.create({
      userId,
      userType,
      type,
      title,
      content,
      channel,
      priority,
      category,
      data,
      metadata,
    });
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    respondError(res, error, 'Failed to create notification');
  }
};

export const updateNotification = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateNotificationBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const { title, content, priority, category, data, metadata } = req.body;
  try {
    const updated = await manageNotificationRecordsUseCase.update(id, { title, content, priority, category, data, metadata });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    respondError(res, error, 'Failed to update notification');
  }
};

export const markNotificationAsSent = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  try {
    res.status(200).json({ success: true, data: await manageNotificationRecordsUseCase.markAsSent(id) });
  } catch (error) {
    respondError(res, error, 'Notification not found');
  }
};

export const getUnreadNotifications = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?._id || req.user?.id || req.user?.organizationId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  const notifications = await manageNotificationRecordsUseCase.findUnreadByUser(userId);
  res.json({ success: true, data: notifications });
};

export const getRecentNotifications = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?._id || req.user?.id || req.user?.organizationId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const notifications = await manageNotificationRecordsUseCase.findByUser(userId, limit);
  res.json({ success: true, data: notifications });
};

export const markNotificationAsRead = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?._id || req.user?.id || req.user?.organizationId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  try {
    const updatedNotification = await manageNotificationRecordsUseCase.markAsReadOwned(id, userId);
    res.json({ success: true, data: updatedNotification });
  } catch (error) {
    respondError(res, error, 'Failed to mark notification as read');
  }
};

export const markAllNotificationsAsRead = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?._id || req.user?.id || req.user?.organizationId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  const updatedCount = await manageNotificationRecordsUseCase.markAllAsRead(userId);
  res.json({ success: true, data: { count: updatedCount } });
};

export const deleteNotification = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?._id || req.user?.id || req.user?.organizationId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  try {
    const result = await manageNotificationRecordsUseCase.deleteOwned(id, userId);
    res.json({ success: true, data: result });
  } catch (error) {
    respondError(res, error, 'Failed to delete notification');
  }
};

export const getUnreadCount = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?._id || req.user?.id || req.user?.organizationId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }
  const count = await manageNotificationRecordsUseCase.countUnread(userId);
  res.json({ success: true, data: { count } });
};

// ============================================================================
// Batch handlers
// ============================================================================

/**
 * GET /business/notifications/batches
 */
export const listBatches = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const batches = await manageNotificationBatchesUseCase.findAll(limit, offset);
  successResponse(res, { batches, limit, offset });
};

/**
 * GET /business/notifications/batches/:batchId
 */
export const getBatch = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { batchId } = req.params;
  const batch = await manageNotificationBatchesUseCase.findById(batchId);
  if (!batch) {
    errorResponse(res, 'Batch not found', 404);
    return;
  }
  successResponse(res, { batch });
};

/**
 * POST /business/notifications/batches
 */
export const sendBatch = async (req: HttpRequest<Record<string, string>, unknown, SendBatchBody>, res: HttpResponse): Promise<void> => {
  const { name, channel, type, title, content, recipients, userIds, scheduledAt } = req.body;
  // Normalize: accept userIds as shorthand for recipients
  const normalizedRecipients = recipients || (userIds || []).map(userId => ({ userId, userType: 'customer' }));
  const normalizedName = name || title || 'Batch notification';
  const useCase = sendNotificationBatchUseCase;
  const result = await useCase.execute(
    new SendNotificationBatchCommand(
      normalizedName,
      channel,
      type,
      title,
      content,
      normalizedRecipients,
      scheduledAt ? new Date(scheduledAt) : undefined,
    ),
  );
  successResponse(res, result, 201);
};

// ============================================================================
// Webhook handlers
// ============================================================================

/**
 * GET /business/notifications/webhooks
 */
export const listWebhooks = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const organizationId = req.user?.organizationId || req.user?.id || (req.query.organizationId as string);
  const useCase = manageNotificationWebhookUseCase;
  const result = await useCase.execute(new ManageNotificationWebhookCommand('list', organizationId));
  if (!result.success) {
    errorResponse(res, result.error || 'Failed to list webhooks', 400);
    return;
  }
  successResponse(res, { webhooks: result.webhooks });
};

/**
 * POST /business/notifications/webhooks
 */
export const createWebhook = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const organizationId = req.user?.organizationId || req.user?.id;
  const { url, secret, events } = req.body as CreateWebhookBody;
  const useCase = manageNotificationWebhookUseCase;
  const result = await useCase.execute(new ManageNotificationWebhookCommand('create', organizationId, undefined, url, secret, events));
  if (!result.success) {
    errorResponse(res, result.error || 'Failed to create webhook', 400);
    return;
  }
  successResponse(res, result.webhook, 201);
};

/**
 * DELETE /business/notifications/webhooks/:webhookId
 */
export const deactivateWebhook = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { webhookId } = req.params;
  const useCase = manageNotificationWebhookUseCase;
  const result = await useCase.execute(new ManageNotificationWebhookCommand('deactivate', undefined, webhookId));
  if (!result.success) {
    errorResponse(res, result.error || 'Failed to deactivate webhook', 400);
    return;
  }
  successResponse(res, { webhookId });
};

// ============================================================================
// Template translation handlers
// ============================================================================

/**
 * GET /business/notifications/templates/:templateId/translations
 */
export const listTranslations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { templateId } = req.params;
  const translations = await getTemplateTranslationsUseCase.findByTemplate(templateId);
  successResponse(res, { translations });
};

/**
 * POST /business/notifications/templates/:templateId/translations
 */
export const upsertTranslation = async (
  req: HttpRequest<Record<string, string>, unknown, UpsertTranslationBody>,
  res: HttpResponse,
): Promise<void> => {
  const { templateId } = req.params;
  const { locale, subject, body } = req.body;
  const useCase = upsertTemplateTranslationUseCase;
  const result = await useCase.execute(new UpsertTemplateTranslationCommand(templateId, locale, body, subject));
  successResponse(res, result);
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

export const getAllTemplates = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const activeOnly = req.query.activeOnly === 'true';
  const templates = await manageNotificationTemplatesUseCase.findAll(activeOnly);
  successResponse(res, templates.map(mapTemplate));
};

export const getTemplateById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    successResponse(res, mapTemplate(await manageNotificationTemplatesUseCase.getById(String(req.params.id))));
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const getTemplatesByType = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { type } = req.params;
  const filtered = await manageNotificationTemplatesUseCase.findByType(type);
  successResponse(res, filtered.map(mapTemplate));
};

export const createTemplate = async (
  req: HttpRequest<Record<string, string>, unknown, CreateTemplateBody>,
  res: HttpResponse,
): Promise<void> => {
  const { code, name, type, supportedChannels, defaultChannel } = req.body;

  try {
    const created = await manageNotificationTemplatesUseCase.create({
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
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const updateTemplate = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateTemplateBody>,
  res: HttpResponse,
): Promise<void> => {
  const id = String(req.params.id);

  try {
    const updated = await manageNotificationTemplatesUseCase.updateExisting(id, {
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
    successResponse(res, mapTemplate(updated));
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const deleteTemplate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const id = String(req.params.id);

  try {
    const deleted = await manageNotificationTemplatesUseCase.deleteExisting(id);
    if (!deleted) {
      errorResponse(res, 'Failed to delete template', 500);
      return;
    }
    successResponse(res, { id });
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const previewTemplate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const id = String(req.params.id);
  const { data, channel } = req.body as { data?: Record<string, unknown>; channel?: string };
  const result = await manageNotificationTemplatesUseCase.getPreview(id, data);

  const template = result.template;
  const html = channel === 'email' || !channel ? result.compiledHtml : undefined;
  const text = channel === 'email' || !channel ? result.compiledText : undefined;

  successResponse(res, { html, text, template: mapTemplate(template) });
};

// ============================================================================
// Admin Notification Preference handlers
// ============================================================================

function mapPreferenceAdmin(p: NotificationPreference) {
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

export const getAllPreferences = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const preferences = await manageNotificationPreferencesUseCase.findAll();
  successResponse(res, preferences.map(mapPreferenceAdmin));
};

export const getPreferencesByUser = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const userId = String(req.params.userId);
  const preferences = await manageNotificationPreferencesUseCase.findByUser(userId, 'customer');
  successResponse(res, preferences.map(mapPreferenceAdmin));
};

interface UpdatePreferenceAdminBody {
  channelPreferences?: Record<string, boolean>;
  isEnabled?: boolean;
  schedulePreferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export const updatePreferenceAdmin = async (
  req: HttpRequest<Record<string, string>, unknown, UpdatePreferenceAdminBody>,
  res: HttpResponse,
): Promise<void> => {
  const id = String(req.params.id);
  const { channelPreferences, isEnabled, schedulePreferences, metadata } = req.body;

  try {
    const updated = await manageNotificationPreferencesUseCase.update(id, {
      channelPreferences,
      isEnabled,
      schedulePreferences,
      metadata,
    });
    successResponse(res, mapPreferenceAdmin(updated));
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};
