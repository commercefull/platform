import type { NotificationBatchRepository } from '../../domain/repositories/NotificationBatchRepository';

export class ManageNotificationBatchesUseCase {
  constructor(private readonly notificationBatchRepo: Pick<NotificationBatchRepository, 'findAll' | 'findById' | 'count'>) {}

  async findAll(limit?: number, offset?: number) {
    return this.notificationBatchRepo.findAll(limit, offset);
  }
  async findById(id: string) {
    return this.notificationBatchRepo.findById(id);
  }
  async count() {
    return this.notificationBatchRepo.count();
  }
}
