import { jsonResponse } from 'libs/apiResponse';
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
  manageNotificationRecordsUseCase,
} from '../../application/useCases/wired';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';

// Typed body interfaces
interface CreateNotificationBody {
  userId: string;
  userType?: 'customer' | 'organization' | 'admin';
  type: string;
  title: string;
  content: string;
  channel: 'email' | 'in_app' | 'inApp' | 'push' | 'sms';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
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
}

// ============================================================================
// Existing notification CRUD handlers
// ============================================================================

export const getAllNotifications = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const type = req.query.type as string | undefined;
  const notifications = await manageNotificationRecordsUseCase.list(limit, offset, type);
  jsonResponse(res, 200, {
    success: true,
    data: notifications,
    pagination: { limit, offset, total: notifications.length },
  });
};

export const getNotificationById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  jsonResponse(res, 200, { success: true, data: await manageNotificationRecordsUseCase.getById(id) });
};

export const createNotification = async (
  req: HttpRequest<Record<string, string>, unknown, CreateNotificationBody>,
  res: HttpResponse,
): Promise<void> => {
  const { userId, userType, type, title, content, channel, priority, category, data, metadata } = req.body;

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
  jsonResponse(res, 201, { success: true, data: notification });
};

export const updateNotification = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateNotificationBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const { title, content, priority, category, data, metadata } = req.body;

  const updated = await manageNotificationRecordsUseCase.update(id, { title, content, priority, category, data, metadata });
  jsonResponse(res, 200, { success: true, data: updated });
};

export const markNotificationAsSent = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  jsonResponse(res, 200, { success: true, data: await manageNotificationRecordsUseCase.markAsSent(id) });
};

export const getUnreadNotifications = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?._id || req.user?.id || req.user?.organizationId;
  if (!userId) {
    jsonResponse(res, 401, { success: false, message: 'User not authenticated' });
    return;
  }
  const notifications = await manageNotificationRecordsUseCase.findUnreadByUser(userId);
  jsonResponse(res, 200, { success: true, data: notifications });
};

export const getRecentNotifications = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?._id || req.user?.id || req.user?.organizationId;
  if (!userId) {
    jsonResponse(res, 401, { success: false, message: 'User not authenticated' });
    return;
  }
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const notifications = await manageNotificationRecordsUseCase.findByUser(userId, limit);
  jsonResponse(res, 200, { success: true, data: notifications });
};

export const markNotificationAsRead = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?._id || req.user?.id || req.user?.organizationId;
  if (!userId) {
    jsonResponse(res, 401, { success: false, message: 'User not authenticated' });
    return;
  }

  const updatedNotification = await manageNotificationRecordsUseCase.markAsReadOwned(id, userId);
  jsonResponse(res, 200, { success: true, data: updatedNotification });
};

export const markAllNotificationsAsRead = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?._id || req.user?.id || req.user?.organizationId;
  if (!userId) {
    jsonResponse(res, 401, { success: false, message: 'User not authenticated' });
    return;
  }
  const updatedCount = await manageNotificationRecordsUseCase.markAllAsRead(userId);
  jsonResponse(res, 200, { success: true, data: { count: updatedCount } });
};

export const deleteNotification = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?._id || req.user?.id || req.user?.organizationId;
  if (!userId) {
    jsonResponse(res, 401, { success: false, message: 'User not authenticated' });
    return;
  }

  const result = await manageNotificationRecordsUseCase.deleteOwned(id, userId);
  jsonResponse(res, 200, { success: true, data: result });
};

export const getUnreadCount = async (req: UserRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?._id || req.user?.id || req.user?.organizationId;
  if (!userId) {
    jsonResponse(res, 401, { success: false, message: 'User not authenticated' });
    return;
  }
  const count = await manageNotificationRecordsUseCase.countUnread(userId);
  jsonResponse(res, 200, { success: true, data: { count } });
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
    new SendNotificationBatchCommand({
      name: normalizedName,
      channel: channel,
      type: type,
      title: title,
      content: content,
      recipients: normalizedRecipients,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    }),
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
  const result = await useCase.execute(new ManageNotificationWebhookCommand({ action: 'list', organizationId: organizationId }));
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
  const result = await useCase.execute(
    new ManageNotificationWebhookCommand({ action: 'create', organizationId: organizationId, url: url, secret: secret, events: events }),
  );
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
  const result = await useCase.execute(new ManageNotificationWebhookCommand({ action: 'deactivate', notificationWebhookId: webhookId }));
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

// Re-exported from notificationTemplateControllers so existing router imports stay valid.
export {
  createTemplate,
  deleteTemplate,
  getAllPreferences,
  getAllTemplates,
  getPreferencesByUser,
  getTemplateById,
  getTemplatesByType,
  previewTemplate,
  updatePreferenceAdmin,
  updateTemplate,
} from './notificationTemplateControllers';
