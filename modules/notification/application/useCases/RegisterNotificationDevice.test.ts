import { createNotificationDevice, createNotificationDeviceRepository } from '../../tests/testUtils';
import { RegisterNotificationDeviceUseCase, RegisterNotificationDeviceCommand } from './RegisterNotificationDevice';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

describe('RegisterNotificationDeviceUseCase', () => {
  let useCase: RegisterNotificationDeviceUseCase;
  let deviceRepo: ReturnType<typeof createNotificationDeviceRepository>;

  beforeEach(() => {
    deviceRepo = createNotificationDeviceRepository();
    deviceRepo.upsert.mockResolvedValue(createNotificationDevice());
    useCase = new RegisterNotificationDeviceUseCase(deviceRepo);
  });

  it('should upsert the device and return its record when the command is valid', async () => {
    const result = await useCase.execute(new RegisterNotificationDeviceCommand('u-1', 'customer', 'token-abc', 'ios'));

    expect(result.notificationDeviceId).toBe('dev-1');
    expect(result.deviceToken).toBe('token-abc');
    expect(result.platform).toBe('ios');
    expect(deviceRepo.upsert).toHaveBeenCalledWith({
      userId: 'u-1',
      userType: 'customer',
      deviceToken: 'token-abc',
      platform: 'ios',
      isActive: true,
    });
  });

  it.each([
    ['userId', new RegisterNotificationDeviceCommand('', 'customer', 'token', 'ios')],
    ['deviceToken', new RegisterNotificationDeviceCommand('u-1', 'customer', '', 'ios')],
    ['platform', new RegisterNotificationDeviceCommand('u-1', 'customer', 'token', '')],
  ])('should throw NotificationValidationError when %s is missing', async (_field, command) => {
    await expect(useCase.execute(command)).rejects.toThrow(NotificationValidationError);
    expect(deviceRepo.upsert).not.toHaveBeenCalled();
  });

  it('should throw NotificationValidationError when the upsert returns null', async () => {
    deviceRepo.upsert.mockResolvedValue(null);

    await expect(useCase.execute(new RegisterNotificationDeviceCommand('u-1', 'customer', 'token', 'ios'))).rejects.toThrow(
      NotificationValidationError,
    );
  });
});
