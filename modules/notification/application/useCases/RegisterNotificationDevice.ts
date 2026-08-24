/**
 * RegisterNotificationDevice Use Case
 *
 * Creates or updates a push device record via notificationDeviceRepo.
 *
 * Validates: Requirements 7.2
 */

import notificationConfigRepository from '../../infrastructure/repositories/NotificationConfigRepository';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

const notificationDeviceRepo = notificationConfigRepository.devices;

// ============================================================================
// Command
// ============================================================================

export class RegisterNotificationDeviceCommand {
  constructor(
    public readonly userId: string,
    public readonly userType: string,
    public readonly deviceToken: string,
    public readonly platform: string,
    public readonly isActive: boolean = true,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface RegisterNotificationDeviceResponse {
  notificationDeviceId: string;
  userId: string;
  userType: string;
  deviceToken: string;
  platform: string;
  isActive: boolean;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class RegisterNotificationDeviceUseCase {
  constructor(private readonly deviceRepo: typeof notificationDeviceRepo = notificationDeviceRepo) {}

  async execute(command: RegisterNotificationDeviceCommand): Promise<RegisterNotificationDeviceResponse> {
    if (!command.userId) throw new NotificationValidationError('userId is required');
    if (!command.deviceToken) throw new NotificationValidationError('deviceToken is required');
    if (!command.platform) throw new NotificationValidationError('platform is required');

    const device = await this.deviceRepo.upsert({
      userId: command.userId,
      userType: command.userType,
      deviceToken: command.deviceToken,
      platform: command.platform,
      isActive: command.isActive,
    });

    if (!device) throw new NotificationValidationError('Failed to register notification device');

    return {
      notificationDeviceId: device.notificationDeviceId,
      userId: device.userId,
      userType: device.userType,
      deviceToken: device.deviceToken,
      platform: device.platform,
      isActive: device.isActive,
      updatedAt: device.updatedAt.toISOString(),
    };
  }
}
