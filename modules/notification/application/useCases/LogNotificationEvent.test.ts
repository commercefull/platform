jest.mock('../../infrastructure/repositories/NotificationDataRepository', () => ({
  __esModule: true,
  default: {
    notifications: {},
    eventLogs: {
      create: jest.fn().mockResolvedValue({
        notificationEventLogId: 'log1', eventType: 'sent', entityId: 'n1', entityType: 'notification', createdAt: new Date(),
      }),
    },
  },
}));

import { LogNotificationEventUseCase, LogNotificationEventCommand } from './LogNotificationEvent';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

describe('LogNotificationEventUseCase', () => {
  let useCase: LogNotificationEventUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LogNotificationEventUseCase();
  });

  it('should log notification event (happy path)', async () => {
    const result = await useCase.execute(new LogNotificationEventCommand('sent', 'n1', 'notification'));

    expect(result.notificationEventLogId).toBe('log1');
    expect(result.eventType).toBe('sent');
  });

  it('should throw NotificationValidationError when eventType is empty', async () => {
    await expect(useCase.execute(new LogNotificationEventCommand(''))).rejects.toThrow(NotificationValidationError);
  });
});
