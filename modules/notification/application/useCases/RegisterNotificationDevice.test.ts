jest.mock('../../infrastructure/repositories/NotificationConfigRepository', () => ({
  __esModule: true,
  default: {
    devices: {
      upsert: jest.fn().mockResolvedValue({
        notificationDeviceId: 'dev1', userId: 'u1', userType: 'customer', deviceToken: 'token123',
        platform: 'ios', isActive: true, updatedAt: new Date(),
      }),
    },
    preferences: {},
  },
}));

import { RegisterNotificationDeviceUseCase, RegisterNotificationDeviceCommand } from './RegisterNotificationDevice';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

describe('RegisterNotificationDeviceUseCase', () => {
  let useCase: RegisterNotificationDeviceUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RegisterNotificationDeviceUseCase();
  });

  it('should register device (happy path)', async () => {
    const result = await useCase.execute(new RegisterNotificationDeviceCommand(
      'u1', 'customer', 'token123', 'ios', true,
    ));

    expect(result.notificationDeviceId).toBe('dev1');
    expect(result.platform).toBe('ios');
  });

  it('should throw NotificationValidationError when userId is empty', async () => {
    await expect(useCase.execute(new RegisterNotificationDeviceCommand(
      '', 'customer', 'token', 'ios',
    ))).rejects.toThrow(NotificationValidationError);
  });

  it('should throw NotificationValidationError when deviceToken is empty', async () => {
    await expect(useCase.execute(new RegisterNotificationDeviceCommand(
      'u1', 'customer', '', 'ios',
    ))).rejects.toThrow(NotificationValidationError);
  });

  it('should throw NotificationValidationError when platform is empty', async () => {
    await expect(useCase.execute(new RegisterNotificationDeviceCommand(
      'u1', 'customer', 'token', '',
    ))).rejects.toThrow(NotificationValidationError);
  });
});
