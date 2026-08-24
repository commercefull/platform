/**
 * Storefront Notification Controller
 * Customer-facing notification pages
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import {
  ManageStorefrontNotificationsUseCase,
  ManageNotificationDevicesUseCase,
  registerNotificationDeviceUseCase,
} from '../../../modules/notification/application/useCases/wired';
import { RegisterNotificationDeviceCommand } from '../../../modules/notification/application/useCases/RegisterNotificationDevice';

const manageNotificationsUseCase = new ManageStorefrontNotificationsUseCase();
const manageDevicesUseCase = new ManageNotificationDevicesUseCase();

/**
 * GET: List customer notifications
 */
export const listNotifications = async (req: TypedRequest, res: Response) => {
  const customerId = req.user?.customerId;
  if (!customerId) return res.redirect('/signin');

  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const total = await manageNotificationsUseCase.countByUserId(customerId);
  const notifications = await manageNotificationsUseCase.findByUserId(customerId, limit, offset);
  const unreadCount = await manageNotificationsUseCase.countUnreadByUserId(customerId);

  const totalPages = Math.ceil(total / limit);

  storefrontRespond(req, res, 'notifications/list', {
    pageName: 'Notifications',
    notifications,
    unreadCount,
    pagination: { page, totalPages, total, limit },
  });
  
};

/**
 * POST: Mark notification as read
 */
export const markAsRead = async (req: TypedRequest, res: Response) => {
  const customerId = req.user?.customerId;
  if (!customerId) return res.redirect('/signin');

  const { notificationId } = req.params;

  await manageNotificationsUseCase.markAsRead(notificationId, customerId);

  // If AJAX request, return JSON
  if (req.xhr || req.headers.accept?.includes('json')) {
    res.json({ success: true });
    return;
  }

  res.redirect('/notifications');
  
};

/**
 * POST: Mark all notifications as read
 */
export const markAllAsRead = async (req: TypedRequest, res: Response) => {
  const customerId = req.user?.customerId;
  if (!customerId) return res.redirect('/signin');

  await manageNotificationsUseCase.markAllAsRead(customerId);

  if (req.xhr || req.headers.accept?.includes('json')) {
    res.json({ success: true });
    return;
  }

  req.flash?.('success', 'All notifications marked as read');
  res.redirect('/notifications');
  
};

/**
 * GET: Notification preferences
 */
export const getPreferences = async (req: TypedRequest, res: Response) => {
  const customerId = req.user?.customerId;
  if (!customerId) return res.redirect('/signin');

  const preferences = await manageNotificationsUseCase.getPreferences(customerId);

  storefrontRespond(req, res, 'notifications/preferences', {
    pageName: 'Notification Preferences',
    preferences: preferences || {},
  });
  
};

/**
 * POST: Update notification preferences
 */
export const updatePreferences = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const body = req.body as RequestBody;
    const { emailOrderUpdates, emailPromotions, emailNewsletter, pushEnabled } = body;

    await manageNotificationsUseCase.upsertPreferences(customerId, {
      emailOrderUpdates: !!emailOrderUpdates,
      emailPromotions: !!emailPromotions,
      emailNewsletter: !!emailNewsletter,
      pushEnabled: !!pushEnabled,
    });

    req.flash?.('success', 'Notification preferences updated');
    res.redirect('/notifications/preferences');
  } catch (error) {
    logger.warn('Error:', error);
    req.flash?.('error', 'Failed to update preferences');
    res.redirect('/notifications/preferences');
  }
};

/**
 * GET /notifications/devices
 * List registered push notification devices
 */
export const getDevices = async (req: TypedRequest, res: Response) => {
  const customerId = req.user?.customerId;
  if (!customerId) return res.redirect('/signin');

  const devices = await manageDevicesUseCase.findByUser(customerId);

  storefrontRespond(req, res, 'notifications/devices', {
    pageName: 'Push Notification Devices',
    devices,
  });
  
};

/**
 * POST /notifications/devices
 * Register a new push notification device
 */
export const registerDevice = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const body = req.body as RequestBody;
    const { deviceToken, platform } = body;

    await registerNotificationDeviceUseCase.execute(new RegisterNotificationDeviceCommand(customerId, 'customer', deviceToken as string, platform as string));

    req.flash?.('success', 'Device registered successfully');
    res.redirect('/notifications/devices');
  } catch (error) {
    logger.warn('Error registering notification device:', error);
    req.flash?.('error', 'Failed to register device');
    res.redirect('/notifications/devices');
  }
};

/**
 * POST /notifications/devices/:deviceToken/delete
 * Remove a registered push notification device
 */
export const deleteDevice = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const { deviceToken } = req.params;

    await manageDevicesUseCase.deactivate(deviceToken);

    req.flash?.('success', 'Device removed successfully');
    res.redirect('/notifications/devices');
  } catch (error) {
    logger.warn('Error deleting notification device:', error);
    req.flash?.('error', 'Failed to remove device');
    res.redirect('/notifications/devices');
  }
};
