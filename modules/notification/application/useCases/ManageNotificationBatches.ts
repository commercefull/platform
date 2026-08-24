import notificationDataRepository from '../../infrastructure/repositories/NotificationDataRepository';

const notificationBatchRepo = notificationDataRepository.batches;

export class ManageNotificationBatchesUseCase {
  async findAll(limit?: number, offset?: number) {
    return notificationBatchRepo.findAll(limit, offset);
  }
  async findById(id: string) {
    return notificationBatchRepo.findById(id);
  }
  async count() {
    return notificationBatchRepo.count();
  }
}
