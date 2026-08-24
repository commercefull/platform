jest.mock('../../infrastructure/repositories/FulfillmentDataRepository', () => ({
  __esModule: true,
  default: {
    admin: {
      getOperationsStats: jest.fn().mockResolvedValue({ pendingFulfillments: 100, activeWarehouses: 5, abandonedCarts: 10 }),
      findRecentFulfillments: jest.fn().mockResolvedValue([{ fulfillmentId: 'f1' }]),
      findWarehousesWithCounts: jest.fn().mockResolvedValue([{ warehouseId: 'w1', count: 50 }]),
    },
  },
}));

import { ManageOperationsUseCase } from './ManageOperations';
import fulfillmentDataRepository from '../../infrastructure/repositories/FulfillmentDataRepository';

const mockRepo = fulfillmentDataRepository as unknown as { admin: Record<string, jest.Mock> };

describe('ManageOperationsUseCase', () => {
  let useCase: ManageOperationsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageOperationsUseCase();
  });

  it('should get operations stats', async () => {
    const result = await useCase.getOperationsStats();
    expect(result.pendingFulfillments).toBe(100);
  });

  it('should find recent fulfillments', async () => {
    const result = await useCase.findRecentFulfillments(10);
    expect(result).toHaveLength(1);
    expect(mockRepo.admin.findRecentFulfillments).toHaveBeenCalledWith(10);
  });

  it('should find warehouses with counts', async () => {
    const result = await useCase.findWarehousesWithCounts();
    expect(result).toHaveLength(1);
  });
});
