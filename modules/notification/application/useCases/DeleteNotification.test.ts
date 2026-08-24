jest.mock('../../infrastructure/repositories/NotificationDataRepository', () => ({
  __esModule: true,
  default: {
    notifications: {
      delete: jest.fn().mockResolvedValue(true),
      deleteAllForUser: jest.fn().mockResolvedValue(5),
    },
  },
}));

import { DeleteNotificationUseCase } from './DeleteNotification';
import notificationDataRepository from '../../infrastructure/repositories/NotificationDataRepository';

const mockRepo = notificationDataRepository as unknown as { notifications: Record<string, jest.Mock> };

describe('DeleteNotificationUseCase', () => {
  let useCase: DeleteNotificationUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new DeleteNotificationUseCase();
  });

  it('should delete single notification (happy path)', async () => {
    const result = await useCase.execute({ notificationId: 'n1' });

    expect(result.deleted).toBe(true);
    expect(result.deletedCount).toBe(1);
    expect(mockRepo.notifications.delete).toHaveBeenCalledWith('n1');
  });

  it('should delete all notifications for user', async () => {
    const result = await useCase.execute({ userId: 'u1', deleteAll: true });

    expect(result.deleted).toBe(true);
    expect(result.deletedCount).toBe(5);
  });

  it('should return not deleted when no ID provided', async () => {
    const result = await useCase.execute({});

    expect(result.deleted).toBe(false);
    expect(result.deletedCount).toBe(0);
  });
});
