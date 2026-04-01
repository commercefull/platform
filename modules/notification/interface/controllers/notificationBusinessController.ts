import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { NotificationRepo } from '../../infrastructure/repositories/notificationRepo';
import * as notificationBatchRepo from '../../infrastructure/repositories/notificationBatchRepo';
import * as notificationTemplateTranslationRepo from '../../infrastructure/repositories/notificationTemplateTranslationRepo';
import { SendNotificationBatchUseCase, SendNotificationBatchCommand } from '../../application/useCases/SendNotificationBatch';
import { ManageNotificationWebhookUseCase, ManageNotificationWebhookCommand } from '../../application/useCases/ManageNotificationWebhook';
import { UpsertTemplateTranslationUseCase, UpsertTemplateTranslationCommand } from '../../application/useCases/UpsertTemplateTranslation';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';

// Extend Express Request with User
interface UserRequest extends TypedRequest {
  user?: {
    _id?: string;
    id?: string;
    merchantId?: string;
  };
  flash: {
    (): { [key: string]: string[] };
    (message: string): string[];
    (type: string, message: string | string[]): number;
    (type: string, format: string, ...args: any[]): number;
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

export const createNotification = async (req: TypedRequest, res: Response): Promise<void> => {
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

export const updateNotification = async (req: TypedRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    logger.error('listBatches error:', error);
    errorResponse(res, error.message || 'Failed to list batches');
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
  } catch (error: any) {
    logger.error('getBatch error:', error);
    errorResponse(res, error.message || 'Failed to get batch');
  }
};

/**
 * POST /business/notifications/batches
 */
export const sendBatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { name, channel, type, title, content, recipients, scheduledAt } = req.body;
    const useCase = new SendNotificationBatchUseCase();
    const result = await useCase.execute(
      new SendNotificationBatchCommand(name, channel, type, title, content, recipients, scheduledAt ? new Date(scheduledAt) : undefined),
    );
    successResponse(res, result, 201);
  } catch (error: any) {
    logger.error('sendBatch error:', error);
    errorResponse(res, error.message || 'Failed to send batch');
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
    const merchantId = req.user?.merchantId || (req.query.merchantId as string);
    const useCase = new ManageNotificationWebhookUseCase();
    const result = await useCase.execute(new ManageNotificationWebhookCommand('list', merchantId));
    if (!result.success) {
      errorResponse(res, result.error || 'Failed to list webhooks', 400);
      return;
    }
    successResponse(res, { webhooks: result.webhooks });
  } catch (error: any) {
    logger.error('listWebhooks error:', error);
    errorResponse(res, error.message || 'Failed to list webhooks');
  }
};

/**
 * POST /business/notifications/webhooks
 */
export const createWebhook = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user?.merchantId;
    const { url, secret, events } = req.body;
    const useCase = new ManageNotificationWebhookUseCase();
    const result = await useCase.execute(new ManageNotificationWebhookCommand('create', merchantId, undefined, url, secret, events));
    if (!result.success) {
      errorResponse(res, result.error || 'Failed to create webhook', 400);
      return;
    }
    successResponse(res, result.webhook, 201);
  } catch (error: any) {
    logger.error('createWebhook error:', error);
    errorResponse(res, error.message || 'Failed to create webhook');
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
  } catch (error: any) {
    logger.error('deactivateWebhook error:', error);
    errorResponse(res, error.message || 'Failed to deactivate webhook');
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
  } catch (error: any) {
    logger.error('listTranslations error:', error);
    errorResponse(res, error.message || 'Failed to list translations');
  }
};

/**
 * POST /business/notifications/templates/:templateId/translations
 */
export const upsertTranslation = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const { locale, subject, body } = req.body;
    const useCase = new UpsertTemplateTranslationUseCase(notificationTemplateTranslationRepo);
    const result = await useCase.execute(new UpsertTemplateTranslationCommand(templateId, locale, body, subject));
    successResponse(res, result);
  } catch (error: any) {
    logger.error('upsertTranslation error:', error);
    errorResponse(res, error.message || 'Failed to upsert translation');
  }
};
