import { createNotificationPreference, createNotificationPreferenceRepository } from '../../tests/testUtils';
import { ManageNotificationPreferenceUseCase, ManageNotificationPreferenceCommand } from './ManageNotificationPreference';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

describe('ManageNotificationPreferenceUseCase', () => {
  let useCase: ManageNotificationPreferenceUseCase;
  let preferenceRepo: ReturnType<typeof createNotificationPreferenceRepository>;

  beforeEach(() => {
    preferenceRepo = createNotificationPreferenceRepository();
    preferenceRepo.upsert.mockResolvedValue(createNotificationPreference());
    useCase = new ManageNotificationPreferenceUseCase(preferenceRepo);
  });

  it('should upsert the preference and return its record when the command is valid', async () => {
    const result = await useCase.execute(
      new ManageNotificationPreferenceCommand('u-1', 'customer', 'order_updates', { email: false }, false),
    );

    expect(result.id).toBe('pref-1');
    expect(result.userId).toBe('u-1');
    expect(result.isEnabled).toBe(true);
    expect(preferenceRepo.upsert).toHaveBeenCalledWith({
      userId: 'u-1',
      userType: 'customer',
      type: 'order_updates',
      channelPreferences: { email: false },
      isEnabled: false,
      schedulePreferences: null,
      metadata: null,
    });
  });

  it('should throw NotificationValidationError when userId is missing', async () => {
    await expect(
      useCase.execute(new ManageNotificationPreferenceCommand('', 'customer', 'order_updates', {}, true)),
    ).rejects.toThrow(NotificationValidationError);
    expect(preferenceRepo.upsert).not.toHaveBeenCalled();
  });

  it('should throw NotificationValidationError when type is missing', async () => {
    await expect(
      useCase.execute(new ManageNotificationPreferenceCommand('u-1', 'customer', '', {}, true)),
    ).rejects.toThrow(NotificationValidationError);
    expect(preferenceRepo.upsert).not.toHaveBeenCalled();
  });

  it('should throw NotificationValidationError when the upsert returns null', async () => {
    preferenceRepo.upsert.mockResolvedValue(null);

    await expect(
      useCase.execute(new ManageNotificationPreferenceCommand('u-1', 'customer', 'order_updates', {}, true)),
    ).rejects.toThrow(NotificationValidationError);
  });
});
