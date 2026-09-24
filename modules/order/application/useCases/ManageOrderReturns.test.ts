import { lazyMock, createOrderReturn, createOrderReturnParams } from '../../tests/testUtils';
import { ManageOrderReturnsUseCase } from './ManageOrderReturns';
import type { OrderReturnRepository } from '../../domain/repositories/OrderReturnRepository';

describe('ManageOrderReturnsUseCase', () => {
  let useCase: ManageOrderReturnsUseCase;
  let returnRepo: jest.Mocked<OrderReturnRepository>;

  beforeEach(() => {
    returnRepo = lazyMock<OrderReturnRepository>();
    useCase = new ManageOrderReturnsUseCase(returnRepo);
  });

  it('should find returns by customer', async () => {
    returnRepo.findByCustomerId.mockResolvedValue([createOrderReturn()]);

    const result = await useCase.findByCustomerId('c1');

    expect(result).toHaveLength(1);
  });

  it('should create a return', async () => {
    returnRepo.create.mockResolvedValue(createOrderReturn({ orderReturnId: 'r2' }));
    const params = createOrderReturnParams({ orderId: 'o1', returnReason: 'Damaged' });

    const result = await useCase.create(params);

    expect(result.orderReturnId).toBe('r2');
    expect(returnRepo.create).toHaveBeenCalledWith(params);
  });

  it('should update return status', async () => {
    returnRepo.updateStatus.mockResolvedValue(createOrderReturn({ status: 'approved' }));

    await useCase.updateStatus('r1', 'approved');

    expect(returnRepo.updateStatus).toHaveBeenCalledWith('r1', 'approved');
  });
});
