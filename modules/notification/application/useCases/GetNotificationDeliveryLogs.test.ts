jest.mock('../../infrastructure/repositories/NotificationDataRepository', () => ({
  __esModule: true,
  default: {
    notifications: {},
    eventLogs: {},
    deliveryLogs: {
      findByBatchId: jest.fn().mockResolvedValue([{ logId: 'l1', status: 'delivered' }]),
    },
  },
}));

import { GetNotificationDeliveryLogsUseCase } from './GetNotificationDeliveryLogs';
import notificationDataRepository from '../../infrastructure/repositories/NotificationDataRepository';

const mockRepo = notificationDataRepository as unknown as { deliveryLogs: Record<string, jest.Mock> };

describe('GetNotificationDeliveryLogsUseCase', () => {
  let useCase: GetNotificationDeliveryLogsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetNotificationDeliveryLogsUseCase();
  });

  it('should find delivery logs by batch ID (happy path)', async () => {
    const result = await useCase.findByBatchId('b1');

    expect(result).toHaveLength(1);
    expect(mockRepo.deliveryLogs.findByBatchId).toHaveBeenCalledWith('b1', undefined);
  });

  it('should pass limit to repository', async () => {
    await useCase.findByBatchId('b1', 50);

    expect(mockRepo.deliveryLogs.findByBatchId).toHaveBeenCalledWith('b1', 50);
  });
});
