import { lazyMock, createOrderReturn } from '../../tests/testUtils';
import { ManageStorefrontReturnsUseCase } from './ManageStorefrontReturns';
import type { OrderReturnRepository } from '../../domain/repositories/OrderReturnRepository';

describe('ManageStorefrontReturnsUseCase', () => {
  let useCase: ManageStorefrontReturnsUseCase;
  let returnRepo: jest.Mocked<OrderReturnRepository>;

  beforeEach(() => {
    returnRepo = lazyMock<OrderReturnRepository>();
    useCase = new ManageStorefrontReturnsUseCase(returnRepo);
  });

  it('should find returns by customer with order numbers', async () => {
    returnRepo.findByCustomerIdWithOrderNumber.mockResolvedValue([{ returnId: 'r1', orderNumber: 'ORD-001' }]);

    const result = await useCase.findByCustomerIdWithOrderNumber('c1');

    expect(result).toHaveLength(1);
    expect(returnRepo.findByCustomerIdWithOrderNumber).toHaveBeenCalledWith('c1');
  });

  it('should find an order for a customer', async () => {
    returnRepo.findOrderForCustomer.mockResolvedValue({ orderId: 'o1' });

    const result = await useCase.findOrderForCustomer('o1', 'c1');

    expect(result).toEqual({ orderId: 'o1' });
  });

  it('should find order items with product info', async () => {
    returnRepo.findOrderItemsWithProduct.mockResolvedValue([{ productId: 'p1', name: 'Widget' }]);

    const result = await useCase.findOrderItemsWithProduct('o1');

    expect(result).toHaveLength(1);
  });

  it('should create a simple return', async () => {
    returnRepo.createSimple.mockResolvedValue(createOrderReturn({ orderReturnId: 'r2' }));

    const result = await useCase.createSimple('o1', 'Damaged', 'Item broken');

    expect(result?.orderReturnId).toBe('r2');
    expect(returnRepo.createSimple).toHaveBeenCalledWith('o1', 'Damaged', 'Item broken');
  });

  it('should find a return by ID with order number', async () => {
    returnRepo.findByIdWithOrderNumber.mockResolvedValue({ returnId: 'r1', orderNumber: 'ORD-001' });

    const result = await useCase.findByIdWithOrderNumber('r1', 'c1');

    expect(result).toEqual({ returnId: 'r1', orderNumber: 'ORD-001' });
  });
});
