import notificationDataRepository from '../../infrastructure/repositories/NotificationDataRepository';

const notificationDeliveryLogRepo = notificationDataRepository.deliveryLogs;

export class GetNotificationDeliveryLogsUseCase {
  async findByBatchId(batchId: string, limit?: number) {
    return notificationDeliveryLogRepo.findByBatchId(batchId, limit);
  }
}
