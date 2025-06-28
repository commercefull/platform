import { Request, Response } from "express";
import { NotificationService } from "../services/notificationService";
import { BaseNotification } from "../domain/notification";

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

// Initialize the notification service
const notificationService = new NotificationService();

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
    const notifications = await notificationService.getUnreadNotifications(userId);
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
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
    const notifications = await notificationService.getRecentNotifications(userId, limit);
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
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
    const updatedNotification = await notificationService.markAsRead(id);
    
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
    console.error('Error marking notification as read:', error);
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
    const updatedCount = await notificationService.markAllAsRead(userId);
    res.json({ success: true, data: { count: updatedCount } });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
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
    const notification = await notificationService.getUnreadNotifications(userId);
    const userNotification = notification?.find(n => n.id === id);
    
    if (!userNotification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    
    const deleted = await notificationService.deleteNotification(id);
    
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Notification not found or already deleted' });
      return;
    }
    
    res.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error deleting notification:', error);
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
    const count = await notificationService.getUnreadCount(userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    res.status(500).json({ success: false, message: 'Failed to get notification count' });
  }
};
