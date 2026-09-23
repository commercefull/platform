import type { NotificationDeliveryLogRepository } from '../../domain/repositories/NotificationDeliveryLogRepository';

export class GetNotificationDeliveryLogsUseCase {
  constructor(private readonly notificationDeliveryLogRepo: Pick<NotificationDeliveryLogRepository, 'findByBatchId'>) {}

  async findByBatchId(batchId: string, limit?: number) {
    return this.notificationDeliveryLogRepo.findByBatchId(batchId, limit);
  }
}
