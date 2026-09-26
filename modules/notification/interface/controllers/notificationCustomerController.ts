import type { HttpRequest, HttpResponse } from 'libs/http';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';
import { ManageNotificationPreferenceCommand } from '../../application/useCases/ManageNotificationPreference';
import { RegisterNotificationDeviceCommand } from '../../application/useCases/RegisterNotificationDevice';
import {
  manageNotificationDevicesUseCase,
  manageNotificationPreferenceUseCase,
  manageNotificationPreferencesUseCase,
  registerNotificationDeviceUseCase,
} from '../../application/useCases/wired';
import { NotificationPreference } from '../../application/wired';

function respondUseCaseError(res: HttpResponse, error: unknown, fallback: string): void {
  errorResponse(res, getErrorMessage(error) || fallback, getErrorStatusCode(error));
}

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
export const getPreferences = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const preferences = await manageNotificationPreferencesUseCase.findByUser(userId, 'customer');
  successResponse(res, preferences.map(mapPreference));
};

/**
 * GET /customer/notifications/preferences/:id
 * Returns a single notification preference by ID.
 */
export const getPreferenceById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  try {
    const preference = await manageNotificationPreferencesUseCase.getOwnedById(String(req.params.id), userId);
    successResponse(res, mapPreference(preference));
  } catch (error) {
    respondUseCaseError(res, error, 'Preference not found');
  }
};

/**
 * GET /customer/notifications/preferences/type/:type
 * Returns a single notification preference by notification type.
 */
export const getPreferenceByType = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const preference = await manageNotificationPreferencesUseCase.findByUserAndType(userId, 'customer', String(req.params.type));
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
export const createPreference = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const { type, channelPreferences, isEnabled, schedulePreferences, metadata } = req.body as {
    type?: string;
    channelPreferences?: Record<string, boolean>;
    isEnabled?: boolean;
    schedulePreferences?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };
  if (!type) {
    errorResponse(res, 'type is required', 400);
    return;
  }

  const useCase = manageNotificationPreferenceUseCase;
  const result = await useCase.execute(
    new ManageNotificationPreferenceCommand(
      userId,
      'customer',
      type,
      channelPreferences || {},
      isEnabled ?? true,
      schedulePreferences || undefined,
      metadata || undefined,
    ),
  );

  successResponse(res, result);
};

/**
 * PUT /customer/notifications/preferences/:id
 * Updates a notification preference for the authenticated customer.
 */
export const updatePreference = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const id = String(req.params.id);
  const { channelPreferences, isEnabled, schedulePreferences, metadata } = req.body as {
    channelPreferences?: Record<string, boolean>;
    isEnabled?: boolean;
    schedulePreferences?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  };

  try {
    const updated = await manageNotificationPreferencesUseCase.updateOwned(id, userId, {
      channelPreferences,
      isEnabled,
      schedulePreferences,
      metadata,
    });
    successResponse(res, mapPreference(updated));
  } catch (error) {
    respondUseCaseError(res, error, 'Failed to update preference');
  }
};

/**
 * PUT /customer/notifications/preferences/:id/schedule
 * Updates schedule preferences only.
 */
export const updateSchedule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const id = String(req.params.id);
  const { schedulePreferences } = req.body as { schedulePreferences?: Record<string, unknown> | null };

  try {
    const updated = await manageNotificationPreferencesUseCase.updateOwned(id, userId, { schedulePreferences });
    successResponse(res, mapPreference(updated));
  } catch (error) {
    respondUseCaseError(res, error, 'Failed to update schedule preferences');
  }
};

/**
 * DELETE /customer/notifications/preferences/:id
 * Deletes a notification preference.
 */
export const deletePreference = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const id = String(req.params.id);

  try {
    const result = await manageNotificationPreferencesUseCase.deleteOwned(id, userId);
    successResponse(res, result);
  } catch (error) {
    respondUseCaseError(res, error, 'Failed to delete preference');
  }
};

/**
 * POST /customer/notifications/preferences/bulk
 * Bulk upserts notification preferences.
 */
export const bulkUpdatePreferences = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const { updates } = req.body as {
    updates?: Array<{
      type: string;
      channelPreferences?: Record<string, boolean>;
      isEnabled?: boolean;
      schedulePreferences?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }>;
  };
  if (!Array.isArray(updates) || updates.length === 0) {
    errorResponse(res, 'updates array is required', 400);
    return;
  }

  const result = await manageNotificationPreferencesUseCase.bulkUpsert(userId, 'customer', updates);
  successResponse(res, result);
};

/**
 * GET /customer/notifications/devices
 * Lists push devices for the authenticated customer.
 */
export const listDevices = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const devices = await manageNotificationDevicesUseCase.findByUser(userId);
  successResponse(res, { devices });
};

/**
 * POST /customer/notifications/devices
 * Registers a push device for the authenticated customer.
 */
export const registerDevice = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    errorResponse(res, 'Not authenticated', 401);
    return;
  }

  const { deviceToken, platform } = req.body as { deviceToken: string; platform: string };
  const useCase = registerNotificationDeviceUseCase;
  const result = await useCase.execute(new RegisterNotificationDeviceCommand(userId, 'customer', deviceToken, platform));

  successResponse(res, result, 201);
};

/**
 * DELETE /customer/notifications/devices/:deviceToken
 * Deactivates a push device for the authenticated customer.
 */
export const deleteDevice = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { deviceToken } = req.params;
  await manageNotificationDevicesUseCase.deactivate(String(deviceToken));
  successResponse(res, { deviceToken });
};
