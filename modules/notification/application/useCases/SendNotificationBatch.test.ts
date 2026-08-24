import { SendNotificationBatchUseCase, SendNotificationBatchCommand } from './SendNotificationBatch';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

describe('SendNotificationBatchUseCase', () => {
  let useCase: SendNotificationBatchUseCase;
  let mockBatchRepo: Record<string, jest.Mock>;
  let mockNotifRepo: Record<string, jest.Mock>;
  let mockUnsubRepo: Record<string, jest.Mock>;
  let mockEventLogRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockBatchRepo = {
      create: jest.fn().mockResolvedValue({
        notificationBatchId: 'batch-1', name: 'Test', channel: 'email', status: 'pending', createdAt: new Date(),
      }),
    };
    mockNotifRepo = { create: jest.fn().mockResolvedValue(undefined) };
    mockUnsubRepo = { isUnsubscribed: jest.fn().mockResolvedValue(false) };
    mockEventLogRepo = { create: jest.fn().mockResolvedValue(undefined) };
    useCase = new SendNotificationBatchUseCase(
      mockBatchRepo as never, mockNotifRepo as never, mockUnsubRepo as never, mockEventLogRepo as never,
    );
  });

  it('should send notification batch (happy path)', async () => {
    const result = await useCase.execute(new SendNotificationBatchCommand(
      'Test', 'email', 'order.confirmation', 'Order Confirmed', 'Your order is confirmed',
      [{ userId: 'u1', userType: 'customer' }, { userId: 'u2', userType: 'customer' }],
    ));

    expect(result.notificationBatchId).toBe('batch-1');
    expect(result.enqueuedCount).toBe(2);
    expect(result.suppressedCount).toBe(0);
    expect(mockNotifRepo.create).toHaveBeenCalledTimes(2);
  });

  it('should suppress notifications for unsubscribed users', async () => {
    mockUnsubRepo.isUnsubscribed.mockResolvedValue(true);

    const result = await useCase.execute(new SendNotificationBatchCommand(
      'Test', 'email', 'promo', 'Sale!', 'Check our sale',
      [{ userId: 'u1', userType: 'customer' }],
    ));

    expect(result.enqueuedCount).toBe(0);
    expect(result.suppressedCount).toBe(1);
    expect(mockEventLogRepo.create).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'notification.suppressed' }));
  });

  it('should throw NotificationValidationError when name is empty', async () => {
    await expect(useCase.execute(new SendNotificationBatchCommand(
      '', 'email', 'test', 'T', 'C', [{ userId: 'u1', userType: 'customer' }],
    ))).rejects.toThrow(NotificationValidationError);
  });

  it('should throw NotificationValidationError when no recipients', async () => {
    await expect(useCase.execute(new SendNotificationBatchCommand(
      'Test', 'email', 'test', 'T', 'C', [],
    ))).rejects.toThrow(NotificationValidationError);
  });
});
