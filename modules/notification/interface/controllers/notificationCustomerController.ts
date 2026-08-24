import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import notificationConfigRepository from '../../infrastructure/repositories/NotificationConfigRepository';
import type { NotificationPreference } from '../../infrastructure/repositories/notificationPreferenceRepo';

const notificationPreferenceRepo = notificationConfigRepository.preferences;
const notificationDeviceRepo = notificationConfigRepository.devices;
import {
  ManageNotificationPreferenceUseCase,
  ManageNotificationPreferenceCommand,
} from '../../application/useCases/ManageNotificationPreference';
import {
  RegisterNotificationDeviceUseCase,
  RegisterNotificationDeviceCommand,
} from '../../application/useCases/RegisterNotificationDevice';

function mapPreference(p: NotificationPreference) {
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

/**
 * GET /customer/notifications/preferences
 * Returns notification preferences for the authenticated customer.
 */
export const getPreferences = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const preferences = await notificationPreferenceRepo.findByUser(userId, 'customer');
  successResponse(res, preferences.map(mapPreference));
};

/**
 * GET /customer/notifications/preferences/:id
 * Returns a single notification preference by ID.
 */
export const getPreferenceById = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const preference = await notificationPreferenceRepo.findById(String(req.params.id));
  if (!preference) {
    errorResponse(res, 'Preference not found', 404);
    return;
  }
  if (preference.userId !== userId) {
    errorResponse(res, 'Unauthorized', 403);
    return;
  }
  successResponse(res, mapPreference(preference));
};

/**
 * GET /customer/notifications/preferences/type/:type
 * Returns a single notification preference by notification type.
 */
export const getPreferenceByType = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const preference = await notificationPreferenceRepo.findByUserAndType(userId, 'customer', String(req.params.type));
  if (!preference) {
    errorResponse(res, 'Preference not found', 404);
    return;
  }
  successResponse(res, mapPreference(preference));
};

/**
 * POST /customer/notifications/preferences
 * Creates a new notification preference for the authenticated customer.
 */
export const createPreference = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const { type, channelPreferences, isEnabled, schedulePreferences, metadata } = req.body;
  if (!type) {
    errorResponse(res, 'type is required', 400);
    return;
  }

  const useCase = new ManageNotificationPreferenceUseCase(notificationPreferenceRepo);
  const result = await useCase.execute(
    new ManageNotificationPreferenceCommand(
      userId,
      'customer',
      type,
      channelPreferences || {},
      isEnabled ?? true,
      schedulePreferences || null,
      metadata || null,
    ),
  );

  successResponse(res, result);
};

/**
 * PUT /customer/notifications/preferences/:id
 * Updates a notification preference for the authenticated customer.
 */
export const updatePreference = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const id = String(req.params.id);
  const existing = await notificationPreferenceRepo.findById(id);
  if (!existing) {
    errorResponse(res, 'Preference not found', 404);
    return;
  }
  if (existing.userId !== userId) {
    errorResponse(res, 'Unauthorized', 403);
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
  successResponse(res, mapPreference(updated));
};

/**
 * PUT /customer/notifications/preferences/:id/schedule
 * Updates schedule preferences only.
 */
export const updateSchedule = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const id = String(req.params.id);
  const existing = await notificationPreferenceRepo.findById(id);
  if (!existing) {
    errorResponse(res, 'Preference not found', 404);
    return;
  }
  if (existing.userId !== userId) {
    errorResponse(res, 'Unauthorized', 403);
    return;
  }

  const { schedulePreferences } = req.body;
  const updated = await notificationPreferenceRepo.update(id, { schedulePreferences });

  if (!updated) {
    errorResponse(res, 'Failed to update schedule preferences', 500);
    return;
  }
  successResponse(res, mapPreference(updated));
};

/**
 * DELETE /customer/notifications/preferences/:id
 * Deletes a notification preference.
 */
export const deletePreference = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const id = String(req.params.id);
  const existing = await notificationPreferenceRepo.findById(id);
  if (!existing) {
    errorResponse(res, 'Preference not found', 404);
    return;
  }
  if (existing.userId !== userId) {
    errorResponse(res, 'Unauthorized', 403);
    return;
  }

  const deleted = await notificationPreferenceRepo.deleteById(id);
  if (!deleted) {
    errorResponse(res, 'Failed to delete preference', 500);
    return;
  }
  successResponse(res, { id });
};

/**
 * POST /customer/notifications/preferences/bulk
 * Bulk upserts notification preferences.
 */
export const bulkUpdatePreferences = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const { updates } = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    errorResponse(res, 'updates array is required', 400);
    return;
  }

  const result = await notificationPreferenceRepo.bulkUpsert(userId, 'customer', updates);
  successResponse(res, result);
};

/**
 * GET /customer/notifications/devices
 * Lists push devices for the authenticated customer.
 */
export const listDevices = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const devices = await notificationDeviceRepo.findByUser(userId);
  successResponse(res, { devices });
};

/**
 * POST /customer/notifications/devices
 * Registers a push device for the authenticated customer.
 */
export const registerDevice = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const { deviceToken, platform } = req.body;
  const useCase = new RegisterNotificationDeviceUseCase(notificationDeviceRepo);
  const result = await useCase.execute(new RegisterNotificationDeviceCommand(userId, 'customer', deviceToken, platform));

  successResponse(res, result, 201);
};

/**
 * DELETE /customer/notifications/devices/:deviceToken
 * Deactivates a push device for the authenticated customer.
 */
export const deleteDevice = async (req: Request, res: Response): Promise<void> => {
  const { deviceToken } = req.params;
  await notificationDeviceRepo.deactivate(String(deviceToken));
  successResponse(res, { deviceToken });
};
