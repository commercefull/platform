import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { logger } from '../../../../libs/logger';
import * as notificationPreferenceRepo from '../../infrastructure/repositories/notificationPreferenceRepo';
import * as notificationDeviceRepo from '../../infrastructure/repositories/notificationDeviceRepo';
import { ManageNotificationPreferenceUseCase, ManageNotificationPreferenceCommand } from '../../application/useCases/ManageNotificationPreference';
import { RegisterNotificationDeviceUseCase, RegisterNotificationDeviceCommand } from '../../application/useCases/RegisterNotificationDevice';

/**
 * GET /customer/notifications/preferences
 * Returns notification preferences for the authenticated customer.
 */
export const getPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const preferences = await notificationPreferenceRepo.findByUser(userId, 'customer');
    successResponse(res, { preferences });
  } catch (error: any) {
    logger.error('getPreferences error:', error);
    errorResponse(res, error.message || 'Failed to fetch preferences');
  }
};

/**
 * POST /customer/notifications/preferences
 * Upserts a notification preference for the authenticated customer.
 */
export const updatePreference = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { channel, type, isEnabled } = req.body;
    const useCase = new ManageNotificationPreferenceUseCase(notificationPreferenceRepo);
    const result = await useCase.execute(
      new ManageNotificationPreferenceCommand(userId, 'customer', channel, type, isEnabled),
    );

    successResponse(res, result);
  } catch (error: any) {
    logger.error('updatePreference error:', error);
    errorResponse(res, error.message || 'Failed to update preference');
  }
};

/**
 * GET /customer/notifications/devices
 * Lists push devices for the authenticated customer.
 */
export const listDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const devices = await notificationDeviceRepo.findByUser(userId);
    successResponse(res, { devices });
  } catch (error: any) {
    logger.error('listDevices error:', error);
    errorResponse(res, error.message || 'Failed to fetch devices');
  }
};

/**
 * POST /customer/notifications/devices
 * Registers a push device for the authenticated customer.
 */
export const registerDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { deviceToken, platform } = req.body;
    const useCase = new RegisterNotificationDeviceUseCase(notificationDeviceRepo);
    const result = await useCase.execute(
      new RegisterNotificationDeviceCommand(userId, 'customer', deviceToken, platform),
    );

    successResponse(res, result, 201);
  } catch (error: any) {
    logger.error('registerDevice error:', error);
    errorResponse(res, error.message || 'Failed to register device');
  }
};

/**
 * DELETE /customer/notifications/devices/:deviceToken
 * Deactivates a push device for the authenticated customer.
 */
export const deleteDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceToken } = req.params;
    await notificationDeviceRepo.deactivate(deviceToken);
    successResponse(res, { deviceToken });
  } catch (error: any) {
    logger.error('deleteDevice error:', error);
    errorResponse(res, error.message || 'Failed to delete device');
  }
};
