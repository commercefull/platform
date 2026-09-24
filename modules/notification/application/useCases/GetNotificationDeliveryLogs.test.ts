import { createNotificationDeliveryLog, createNotificationDeliveryLogRepository } from '../../tests/testUtils';
import { GetNotificationDeliveryLogsUseCase } from './GetNotificationDeliveryLogs';

describe('GetNotificationDeliveryLogsUseCase', () => {
  let useCase: GetNotificationDeliveryLogsUseCase;
  let deliveryLogRepo: ReturnType<typeof createNotificationDeliveryLogRepository>;

  beforeEach(() => {
    deliveryLogRepo = createNotificationDeliveryLogRepository();
    useCase = new GetNotificationDeliveryLogsUseCase(deliveryLogRepo);
  });

  it('should return the delivery logs for a batch', async () => {
    const logs = [createNotificationDeliveryLog({ notificationDeliveryLogId: 'l-1' })];
    deliveryLogRepo.findByBatchId.mockResolvedValue(logs);

    const result = await useCase.findByBatchId('batch-1');

    expect(result).toEqual(logs);
    expect(deliveryLogRepo.findByBatchId).toHaveBeenCalledWith('batch-1', undefined);
  });

  it('should pass the limit through to the repository', async () => {
    deliveryLogRepo.findByBatchId.mockResolvedValue([]);

    await useCase.findByBatchId('batch-1', 10);

    expect(deliveryLogRepo.findByBatchId).toHaveBeenCalledWith('batch-1', 10);
  });
});
