jest.mock('../../infrastructure/repositories/OrderFulfillmentDataRepository', () => ({
  __esModule: true,
  default: {
    returns: {
      findByCustomerIdWithOrderNumber: jest.fn().mockResolvedValue([{ returnId: 'r1', orderNumber: 'ORD-001' }]),
      findOrderForCustomer: jest.fn().mockResolvedValue({ orderId: 'o1' }),
      findOrderItemsWithProduct: jest.fn().mockResolvedValue([{ productId: 'p1', name: 'Widget' }]),
      createSimple: jest.fn().mockResolvedValue({ returnId: 'r2' }),
      findByIdWithOrderNumber: jest.fn().mockResolvedValue({ returnId: 'r1', orderNumber: 'ORD-001' }),
    },
  },
}));

import { ManageStorefrontReturnsUseCase } from './ManageStorefrontReturns';
import orderFulfillmentDataRepository from '../../infrastructure/repositories/OrderFulfillmentDataRepository';

const _mockRepo = orderFulfillmentDataRepository as unknown as { returns: Record<string, jest.Mock> };

describe('ManageStorefrontReturnsUseCase', () => {
  let useCase: ManageStorefrontReturnsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageStorefrontReturnsUseCase();
  });

  it('should find by customer with order number', async () => {
    const result = await useCase.findByCustomerIdWithOrderNumber('c1');
    expect(result).toHaveLength(1);
  });

  it('should find order for customer', async () => {
    const result = await useCase.findOrderForCustomer('o1', 'c1');
    expect(result).toEqual({ orderId: 'o1' });
  });

  it('should find order items with product', async () => {
    const result = await useCase.findOrderItemsWithProduct('o1');
    expect(result).toHaveLength(1);
  });

  it('should create simple return', async () => {
    const result = await useCase.createSimple('o1', 'Damaged', 'Item broken');
    expect(result).toEqual({ returnId: 'r2' });
  });

  it('should find by ID with order number', async () => {
    const result = await useCase.findByIdWithOrderNumber('r1', 'c1');
    expect(result).toEqual({ returnId: 'r1', orderNumber: 'ORD-001' });
  });
});
