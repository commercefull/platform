import { notificationDataRepository } from '../wired';

const notificationDeliveryLogRepo = notificationDataRepository.deliveryLogs;

export class GetNotificationDeliveryLogsUseCase {
  async findByBatchId(batchId: string, limit?: number) {
    return notificationDeliveryLogRepo.findByBatchId(batchId, limit);
  }
}
