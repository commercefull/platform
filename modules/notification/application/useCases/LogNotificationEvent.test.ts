import { createNotificationEventLog, createNotificationEventLogRepository } from '../../tests/testUtils';
import { LogNotificationEventUseCase, LogNotificationEventCommand } from './LogNotificationEvent';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

describe('LogNotificationEventUseCase', () => {
  let useCase: LogNotificationEventUseCase;
  let eventLogRepo: ReturnType<typeof createNotificationEventLogRepository>;

  beforeEach(() => {
    eventLogRepo = createNotificationEventLogRepository();
    eventLogRepo.create.mockResolvedValue(createNotificationEventLog({ entityId: 'ntf-1', entityType: 'notification' }));
    useCase = new LogNotificationEventUseCase(eventLogRepo);
  });

  it('should persist the event and return its record when the command is valid', async () => {
    const result = await useCase.execute(
      new LogNotificationEventCommand('notification.sent', 'ntf-1', 'notification', { channel: 'email' }),
    );

    expect(result.notificationEventLogId).toBe('evt-1');
    expect(result.eventType).toBe('notification.sent');
    expect(result.entityId).toBe('ntf-1');
    expect(eventLogRepo.create).toHaveBeenCalledWith({
      eventType: 'notification.sent',
      entityId: 'ntf-1',
      entityType: 'notification',
      payload: { channel: 'email' },
    });
  });

  it('should throw NotificationValidationError when eventType is missing', async () => {
    await expect(useCase.execute(new LogNotificationEventCommand(''))).rejects.toThrow(NotificationValidationError);
    expect(eventLogRepo.create).not.toHaveBeenCalled();
  });

  it('should throw NotificationValidationError when the repository fails to create the entry', async () => {
    eventLogRepo.create.mockResolvedValue(null);

    await expect(useCase.execute(new LogNotificationEventCommand('notification.sent'))).rejects.toThrow(
      NotificationValidationError,
    );
  });
});
