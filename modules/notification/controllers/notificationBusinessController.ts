import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { NotificationRepo, Notification } from '../repos/notificationRepo';

// Extend Express Request with User
interface UserRequest extends Request {
  user?: {
    _id?: string;
    id?: string;
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

/**
 * Get all notifications (admin)
 */
export const getAllNotifications = async (req: Request, res: Response): Promise<void> => {
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

/**
 * Get notification by ID (admin)
 */
export const getNotificationById = async (req: Request, res: Response): Promise<void> => {
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

/**
 * Create a new notification (admin)
 */
export const createNotification = async (req: Request, res: Response): Promise<void> => {
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

/**
 * Update a notification (admin)
 */
export const updateNotification = async (req: Request, res: Response): Promise<void> => {
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

/**
 * Mark notification as sent (admin)
 */
export const markNotificationAsSent = async (req: Request, res: Response): Promise<void> => {
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

/**
 * Get unread notifications for the current user
 */
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

/**
 * Get recent notifications for the current user
 */
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

/**
 * Mark a notification as read
 */
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

    // Check if notification belongs to user
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

/**
 * Mark all notifications as read for the current user
 */
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

/**
 * Delete a notification
 */
export const deleteNotification = async (req: UserRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?._id || req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return;
  }

  try {
    // First, check if the notification belongs to the user
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

/**
 * Get unread notification count for the current user
 */
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
