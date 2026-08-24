jest.mock('../../infrastructure/repositories/NotificationConfigRepository', () => ({
  __esModule: true,
  default: {
    preferences: {
      upsert: jest.fn().mockResolvedValue({
        notificationPreferenceId: 'p1', userId: 'u1', userType: 'customer', type: 'order',
        channelPreferences: { email: true, sms: false }, isEnabled: true,
        schedulePreferences: null, metadata: null, updatedAt: new Date(),
      }),
    },
  },
}));

import { ManageNotificationPreferenceUseCase, ManageNotificationPreferenceCommand } from './ManageNotificationPreference';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';
import notificationConfigRepository from '../../infrastructure/repositories/NotificationConfigRepository';

const _mockRepo = notificationConfigRepository as unknown as { preferences: Record<string, jest.Mock> };

describe('ManageNotificationPreferenceUseCase', () => {
  let useCase: ManageNotificationPreferenceUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageNotificationPreferenceUseCase();
  });

  it('should upsert notification preference (happy path)', async () => {
    const result = await useCase.execute(new ManageNotificationPreferenceCommand(
      'u1', 'customer', 'order', { email: true, sms: false }, true,
    ));

    expect(result.id).toBe('p1');
    expect(result.userId).toBe('u1');
  });

  it('should throw NotificationValidationError when userId is empty', async () => {
    await expect(useCase.execute(new ManageNotificationPreferenceCommand(
      '', 'customer', 'order', {}, true,
    ))).rejects.toThrow(NotificationValidationError);
  });

  it('should throw NotificationValidationError when type is empty', async () => {
    await expect(useCase.execute(new ManageNotificationPreferenceCommand(
      'u1', 'customer', '', {}, true,
    ))).rejects.toThrow(NotificationValidationError);
  });
});
