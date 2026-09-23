import { createNotificationUnsubscribeRepository, createNotificationPreferenceRepository } from '../../tests/testUtils';
import { UnsubscribeNotificationUseCase, UnsubscribeNotificationCommand } from './UnsubscribeNotification';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

describe('UnsubscribeNotificationUseCase', () => {
  let useCase: UnsubscribeNotificationUseCase;
  let unsubscribeRepo: ReturnType<typeof createNotificationUnsubscribeRepository>;
  let preferenceRepo: ReturnType<typeof createNotificationPreferenceRepository>;

  beforeEach(() => {
    unsubscribeRepo = createNotificationUnsubscribeRepository();
    preferenceRepo = createNotificationPreferenceRepository();
    useCase = new UnsubscribeNotificationUseCase(unsubscribeRepo, preferenceRepo);
  });

  it('should record the unsubscribe and disable the preference when a type is given', async () => {
    const result = await useCase.execute(new UnsubscribeNotificationCommand('u-1', 'customer', 'email', 'promo', 'too many'));

    expect(result).toEqual({ success: true, userId: 'u-1', channel: 'email', type: 'promo' });
    expect(unsubscribeRepo.unsubscribe).toHaveBeenCalledWith({
      userId: 'u-1',
      category: 'promo',
      reason: 'too many',
    });
    expect(preferenceRepo.upsert).toHaveBeenCalledWith({
      userId: 'u-1',
      userType: 'customer',
      type: 'promo',
      channelPreferences: { email: false },
      isEnabled: false,
    });
  });

  it('should record the unsubscribe against the channel when no type is given', async () => {
    const result = await useCase.execute(new UnsubscribeNotificationCommand('u-1', 'customer', 'email'));

    expect(result.success).toBe(true);
    expect(unsubscribeRepo.unsubscribe).toHaveBeenCalledWith({ userId: 'u-1', category: 'email', reason: undefined });
    expect(preferenceRepo.upsert).not.toHaveBeenCalled();
  });

  it.each([
    ['userId', new UnsubscribeNotificationCommand('', 'customer', 'email')],
    ['channel', new UnsubscribeNotificationCommand('u-1', 'customer', '')],
  ])('should throw NotificationValidationError when %s is missing', async (_field, cmd) => {
    await expect(useCase.execute(cmd)).rejects.toThrow(NotificationValidationError);
    expect(unsubscribeRepo.unsubscribe).not.toHaveBeenCalled();
  });
});
