jest.mock('../../infrastructure/repositories/NotificationDataRepository', () => ({
  __esModule: true,
  default: {
    notifications: {},
    eventLogs: {},
    deliveryLogs: {},
    batches: {
      findAll: jest.fn().mockResolvedValue([{ batchId: 'b1' }]),
      findById: jest.fn().mockResolvedValue({ batchId: 'b1' }),
      count: jest.fn().mockResolvedValue(1),
    },
  },
}));

import { ManageNotificationBatchesUseCase } from './ManageNotificationBatches';
import notificationDataRepository from '../../infrastructure/repositories/NotificationDataRepository';

const _mockRepo = notificationDataRepository as unknown as { batches: Record<string, jest.Mock> };

describe('ManageNotificationBatchesUseCase', () => {
  let useCase: ManageNotificationBatchesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageNotificationBatchesUseCase();
  });

  it('should find all batches', async () => {
    const result = await useCase.findAll(10, 0);
    expect(result).toHaveLength(1);
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('b1');
    expect(result).toEqual({ batchId: 'b1' });
  });

  it('should count batches', async () => {
    const result = await useCase.count();
    expect(result).toBe(1);
  });
});
