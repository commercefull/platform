import { lazyMock, createOrderFulfillment } from '../../tests/testUtils';
import { ManageOrderFulfillmentsUseCase } from './ManageOrderFulfillments';
import type { OrderFulfillmentRepository, FulfillmentStatus } from '../../domain/repositories/OrderFulfillmentRepository';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';

describe('ManageOrderFulfillmentsUseCase', () => {
  let useCase: ManageOrderFulfillmentsUseCase;
  let fulfillmentRepo: jest.Mocked<OrderFulfillmentRepository>;
  let orderRepo: jest.Mocked<OrderRepository>;

  beforeEach(() => {
    fulfillmentRepo = lazyMock<OrderFulfillmentRepository>();
    orderRepo = lazyMock<OrderRepository>();
    useCase = new ManageOrderFulfillmentsUseCase(fulfillmentRepo, orderRepo);
  });

  it('should find fulfillments by status', async () => {
    fulfillmentRepo.findByStatus.mockResolvedValue([createOrderFulfillment()]);

    const result = await useCase.findByStatus('pending', 10, 0);

    expect(result).toHaveLength(1);
    expect(fulfillmentRepo.findByStatus).toHaveBeenCalledWith('pending', 10, 0);
  });

  it('should find a fulfillment by ID', async () => {
    fulfillmentRepo.findById.mockResolvedValue(createOrderFulfillment({ orderFulfillmentId: 'f1' }));

    const result = await useCase.findById('f1');

    expect(result?.orderFulfillmentId).toBe('f1');
  });

  it('should add tracking to a fulfillment', async () => {
    fulfillmentRepo.addTracking.mockResolvedValue(createOrderFulfillment({ trackingNumber: 'TRK123' }));

    await useCase.addTracking('f1', 'TRK123', 'ups', 'UPS', 'https://ups.com');

    expect(fulfillmentRepo.addTracking).toHaveBeenCalledWith('f1', 'TRK123', 'ups', 'UPS', 'https://ups.com');
  });

  it('should mark a fulfillment as shipped', async () => {
    fulfillmentRepo.markAsShipped.mockResolvedValue(createOrderFulfillment({ status: 'shipped' }));

    await useCase.markAsShipped('f1');

    expect(fulfillmentRepo.markAsShipped).toHaveBeenCalledWith('f1');
  });

  it('should mark a fulfillment as delivered', async () => {
    fulfillmentRepo.markAsDelivered.mockResolvedValue(createOrderFulfillment({ status: 'delivered' }));

    await useCase.markAsDelivered('f1');

    expect(fulfillmentRepo.markAsDelivered).toHaveBeenCalledWith('f1');
  });

  it('should cancel a fulfillment', async () => {
    fulfillmentRepo.cancel.mockResolvedValue(createOrderFulfillment({ status: 'cancelled' }));

    await useCase.cancel('f1', 'Customer request');

    expect(fulfillmentRepo.cancel).toHaveBeenCalledWith('f1', 'Customer request');
  });

  it('should return status statistics', async () => {
    fulfillmentRepo.getStatusStatistics.mockResolvedValue({ pending: 5, shipped: 10 } as unknown as Record<FulfillmentStatus, number>);

    const result = await useCase.getStatusStatistics();

    expect(result.pending).toBe(5);
  });

  it('should find overdue fulfillments', async () => {
    fulfillmentRepo.findOverdue.mockResolvedValue([createOrderFulfillment()]);

    const result = await useCase.findOverdue();

    expect(result).toHaveLength(1);
  });
});
