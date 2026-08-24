import { UnsubscribeNotificationUseCase, UnsubscribeNotificationCommand } from './UnsubscribeNotification';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

describe('UnsubscribeNotificationUseCase', () => {
  let useCase: UnsubscribeNotificationUseCase;
  let mockUnsubRepo: Record<string, jest.Mock>;
  let mockPrefRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockUnsubRepo = { unsubscribe: jest.fn().mockResolvedValue(undefined) };
    mockPrefRepo = { upsert: jest.fn().mockResolvedValue(undefined) };
    useCase = new UnsubscribeNotificationUseCase(mockUnsubRepo as never, mockPrefRepo as never);
  });

  it('should unsubscribe user (happy path)', async () => {
    const result = await useCase.execute(new UnsubscribeNotificationCommand('u1', 'customer', 'email', 'promo'));

    expect(result.success).toBe(true);
    expect(result.userId).toBe('u1');
    expect(mockUnsubRepo.unsubscribe).toHaveBeenCalled();
    expect(mockPrefRepo.upsert).toHaveBeenCalled();
  });

  it('should not update preference when type is not specified', async () => {
    await useCase.execute(new UnsubscribeNotificationCommand('u1', 'customer', 'email'));

    expect(mockPrefRepo.upsert).not.toHaveBeenCalled();
  });

  it('should throw NotificationValidationError when userId is empty', async () => {
    await expect(useCase.execute(new UnsubscribeNotificationCommand('', 'customer', 'email'))).rejects.toThrow(NotificationValidationError);
  });

  it('should throw NotificationValidationError when channel is empty', async () => {
    await expect(useCase.execute(new UnsubscribeNotificationCommand('u1', 'customer', ''))).rejects.toThrow(NotificationValidationError);
  });
});
