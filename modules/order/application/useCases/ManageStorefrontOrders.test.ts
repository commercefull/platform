jest.mock('../../infrastructure/repositories/OrderDataRepository', () => ({
  __esModule: true,
  default: {
    commands: {
      findById: jest.fn().mockResolvedValue({ orderId: 'o1' }),
      findByCustomerId: jest.fn().mockResolvedValue({ data: [{ orderId: 'o1' }], total: 1 }),
      findAll: jest.fn().mockResolvedValue({ data: [{ orderId: 'o1' }], total: 1 }),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(1),
      countByCustomer: jest.fn().mockResolvedValue(5),
      getOrderItems: jest.fn().mockResolvedValue([{ productId: 'p1', quantity: 2 }]),
    },
    queries: {},
  },
}));

jest.mock('../../infrastructure/repositories/OrderFulfillmentDataRepository', () => ({
  __esModule: true,
  default: {
    returns: {
      findByCustomerId: jest.fn().mockResolvedValue([{ returnId: 'r1' }]),
      findById: jest.fn().mockResolvedValue({ returnId: 'r1' }),
      create: jest.fn().mockResolvedValue({ returnId: 'r2' }),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

import { GetOrderUseCase, ManageOrderReturnsUseCase } from './ManageStorefrontOrders';
import orderDataRepository from '../../infrastructure/repositories/OrderDataRepository';
import orderFulfillmentDataRepository from '../../infrastructure/repositories/OrderFulfillmentDataRepository';

const _mockOrderRepo = orderDataRepository as unknown as { commands: Record<string, jest.Mock> };
const mockReturnRepo = orderFulfillmentDataRepository as unknown as { returns: Record<string, jest.Mock> };

describe('GetOrderUseCase', () => {
  let useCase: GetOrderUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetOrderUseCase();
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('o1');
    expect(result).toEqual({ orderId: 'o1' });
  });

  it('should find by customer ID', async () => {
    const result = await useCase.findByCustomerId('c1');
    expect(result.total).toBe(1);
  });

  it('should get order items', async () => {
    const result = await useCase.getOrderItems('o1');
    expect(result).toHaveLength(1);
  });

  it('should count by customer', async () => {
    const result = await useCase.countByCustomer('c1');
    expect(result).toBe(5);
  });
});

describe('ManageOrderReturnsUseCase', () => {
  let useCase: ManageOrderReturnsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageOrderReturnsUseCase();
  });

  it('should find returns by customer', async () => {
    const result = await useCase.findByCustomerId('c1');
    expect(result).toHaveLength(1);
  });

  it('should create return', async () => {
    const result = await useCase.create({ orderId: 'o1', reason: 'Damaged' } as never);
    expect(result).toEqual({ returnId: 'r2' });
  });

  it('should update status', async () => {
    await useCase.updateStatus('r1', 'approved');
    expect(mockReturnRepo.returns.updateStatus).toHaveBeenCalledWith('r1', 'approved');
  });
});
