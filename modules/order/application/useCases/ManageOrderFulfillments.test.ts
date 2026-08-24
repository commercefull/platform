jest.mock('../../infrastructure/repositories/OrderFulfillmentDataRepository', () => ({
  __esModule: true,
  default: {
    fulfillments: {
      findByStatus: jest.fn().mockResolvedValue([{ fulfillmentId: 'f1' }]),
      findById: jest.fn().mockResolvedValue({ fulfillmentId: 'f1' }),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      addTracking: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      markAsShipped: jest.fn().mockResolvedValue(undefined),
      markAsDelivered: jest.fn().mockResolvedValue(undefined),
      cancel: jest.fn().mockResolvedValue(undefined),
      getStatusStatistics: jest.fn().mockResolvedValue({ pending: 5, shipped: 10 }),
      findOverdue: jest.fn().mockResolvedValue([{ fulfillmentId: 'f1' }]),
      findShippedToday: jest.fn().mockResolvedValue([{ fulfillmentId: 'f2' }]),
    },
    returns: {},
  },
}));

jest.mock('../../infrastructure/repositories/OrderDataRepository', () => ({
  __esModule: true,
  default: {
    commands: {
      findById: jest.fn().mockResolvedValue({ orderId: 'o1' }),
    },
    queries: {},
  },
}));

import { ManageOrderFulfillmentsUseCase, GetOrderForFulfillmentUseCase } from './ManageOrderFulfillments';
import orderFulfillmentDataRepository from '../../infrastructure/repositories/OrderFulfillmentDataRepository';

const mockRepo = orderFulfillmentDataRepository as unknown as { fulfillments: Record<string, jest.Mock> };

describe('ManageOrderFulfillmentsUseCase', () => {
  let useCase: ManageOrderFulfillmentsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageOrderFulfillmentsUseCase();
  });

  it('should find by status', async () => {
    const result = await useCase.findByStatus('pending', 10, 0);
    expect(result).toHaveLength(1);
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('f1');
    expect(result).toEqual({ fulfillmentId: 'f1' });
  });

  it('should add tracking', async () => {
    await useCase.addTracking('f1', 'TRK123', 'ups', 'UPS', 'https://ups.com');
    expect(mockRepo.fulfillments.addTracking).toHaveBeenCalledWith('f1', 'TRK123', 'ups', 'UPS', 'https://ups.com');
  });

  it('should mark as shipped', async () => {
    await useCase.markAsShipped('f1');
    expect(mockRepo.fulfillments.markAsShipped).toHaveBeenCalledWith('f1');
  });

  it('should mark as delivered', async () => {
    await useCase.markAsDelivered('f1');
    expect(mockRepo.fulfillments.markAsDelivered).toHaveBeenCalledWith('f1');
  });

  it('should cancel fulfillment', async () => {
    await useCase.cancel('f1', 'Customer request');
    expect(mockRepo.fulfillments.cancel).toHaveBeenCalledWith('f1', 'Customer request');
  });

  it('should get status statistics', async () => {
    const result = await useCase.getStatusStatistics() as unknown as Record<string, unknown>;
    expect(result.pending).toBe(5);
  });

  it('should find overdue', async () => {
    const result = await useCase.findOverdue();
    expect(result).toHaveLength(1);
  });
});

describe('GetOrderForFulfillmentUseCase', () => {
  let useCase: GetOrderForFulfillmentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetOrderForFulfillmentUseCase();
  });

  it('should find order by ID', async () => {
    const result = await useCase.findById('o1');
    expect(result).toEqual({ orderId: 'o1' });
  });
});
