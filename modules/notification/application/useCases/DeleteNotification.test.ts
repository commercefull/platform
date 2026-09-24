import { createNotificationCommandRepository } from '../../tests/testUtils';
import { DeleteNotificationUseCase } from './DeleteNotification';

describe('DeleteNotificationUseCase', () => {
  let useCase: DeleteNotificationUseCase;
  let notificationRepo: ReturnType<typeof createNotificationCommandRepository>;

  beforeEach(() => {
    notificationRepo = createNotificationCommandRepository();
    useCase = new DeleteNotificationUseCase(notificationRepo);
  });

  it('should delete a single notification when notificationId is provided', async () => {
    notificationRepo.delete.mockResolvedValue(true);

    const result = await useCase.execute({ notificationId: 'n-1' });

    expect(result).toEqual({ deleted: true, deletedCount: 1 });
    expect(notificationRepo.delete).toHaveBeenCalledWith('n-1');
    expect(notificationRepo.deleteAllForUser).not.toHaveBeenCalled();
  });

  it('should delete all notifications when deleteAll is set with a userId', async () => {
    notificationRepo.deleteAllForUser.mockResolvedValue(5);

    const result = await useCase.execute({ userId: 'u-1', deleteAll: true });

    expect(result).toEqual({ deleted: true, deletedCount: 5 });
    expect(notificationRepo.deleteAllForUser).toHaveBeenCalledWith('u-1');
    expect(notificationRepo.delete).not.toHaveBeenCalled();
  });

  it('should report not deleted when the repository delete fails', async () => {
    notificationRepo.delete.mockResolvedValue(false);

    const result = await useCase.execute({ notificationId: 'n-1' });

    expect(result).toEqual({ deleted: false, deletedCount: 0 });
  });

  it('should report not deleted when neither notificationId nor deleteAll is provided', async () => {
    const result = await useCase.execute({});

    expect(result).toEqual({ deleted: false, deletedCount: 0 });
    expect(notificationRepo.delete).not.toHaveBeenCalled();
    expect(notificationRepo.deleteAllForUser).not.toHaveBeenCalled();
  });
});
