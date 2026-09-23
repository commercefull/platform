import {
  createNotificationBatch,
  createNotificationBatchRepository,
  createNotificationCommandRepository,
  createNotificationEventLogRepository,
  createNotificationUnsubscribeRepository,
} from '../../tests/testUtils';
import { SendNotificationBatchUseCase, SendNotificationBatchCommand } from './SendNotificationBatch';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

const command = (overrides: { name?: string; channel?: string; recipients?: { userId: string; userType: string }[] } = {}) =>
  new SendNotificationBatchCommand(
    overrides.name ?? 'Promo blast',
    overrides.channel ?? 'email',
    'promo',
    'Sale!',
    'Check our sale',
    overrides.recipients ?? [
      { userId: 'u-1', userType: 'customer' },
      { userId: 'u-2', userType: 'customer' },
    ],
  );

describe('SendNotificationBatchUseCase', () => {
  let useCase: SendNotificationBatchUseCase;
  let batchRepo: ReturnType<typeof createNotificationBatchRepository>;
  let notifRepo: ReturnType<typeof createNotificationCommandRepository>;
  let unsubscribeRepo: ReturnType<typeof createNotificationUnsubscribeRepository>;
  let eventLogRepo: ReturnType<typeof createNotificationEventLogRepository>;

  beforeEach(() => {
    batchRepo = createNotificationBatchRepository();
    notifRepo = createNotificationCommandRepository();
    unsubscribeRepo = createNotificationUnsubscribeRepository();
    eventLogRepo = createNotificationEventLogRepository();
    batchRepo.create.mockResolvedValue(createNotificationBatch());
    unsubscribeRepo.isUnsubscribed.mockResolvedValue(false);
    useCase = new SendNotificationBatchUseCase(batchRepo, notifRepo, unsubscribeRepo, eventLogRepo);
  });

  it('should create the batch and enqueue a notification per recipient when none are unsubscribed', async () => {
    const result = await useCase.execute(command());

    expect(result.notificationBatchId).toBe('batch-1');
    expect(result.targetCount).toBe(2);
    expect(result.enqueuedCount).toBe(2);
    expect(result.suppressedCount).toBe(0);
    expect(batchRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Promo blast', channel: 'email', targetCount: 2 }),
    );
    expect(notifRepo.create).toHaveBeenCalledTimes(2);
    expect(notifRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u-1', title: 'Sale!', channel: 'email' }),
    );
    expect(eventLogRepo.create).not.toHaveBeenCalled();
  });

  it('should suppress unsubscribed recipients and log a notification.suppressed event for each', async () => {
    unsubscribeRepo.isUnsubscribed.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const result = await useCase.execute(command());

    expect(result.enqueuedCount).toBe(1);
    expect(result.suppressedCount).toBe(1);
    expect(notifRepo.create).toHaveBeenCalledTimes(1);
    expect(notifRepo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u-1' }));
    expect(eventLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'notification.suppressed',
        entityId: 'batch-1',
        entityType: 'notificationBatch',
        payload: expect.objectContaining({ userId: 'u-2', reason: 'unsubscribed' }),
      }),
    );
  });

  it.each([
    ['name', command({ name: '' })],
    ['channel', command({ channel: '' })],
    ['recipients', command({ recipients: [] })],
  ])('should throw NotificationValidationError when %s is missing', async (_field, cmd) => {
    await expect(useCase.execute(cmd)).rejects.toThrow(NotificationValidationError);
    expect(batchRepo.create).not.toHaveBeenCalled();
  });

  it('should throw NotificationValidationError when the batch cannot be created', async () => {
    batchRepo.create.mockResolvedValue(null);

    await expect(useCase.execute(command())).rejects.toThrow(NotificationValidationError);
    expect(notifRepo.create).not.toHaveBeenCalled();
  });
});
