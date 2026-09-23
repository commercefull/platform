import { lazyMock, createOrderPaymentRefund } from '../../tests/testUtils';
import { GetOrderRefundsUseCase } from './GetOrderRefunds';
import type { OrderQueryRepository } from '../../domain/repositories/OrderQueryRepository';

describe('GetOrderRefundsUseCase', () => {
  let useCase: GetOrderRefundsUseCase;
  let queryRepo: jest.Mocked<OrderQueryRepository>;

  beforeEach(() => {
    queryRepo = lazyMock<OrderQueryRepository>();
    useCase = new GetOrderRefundsUseCase(queryRepo);
  });

  it('should find refunds by order', async () => {
    queryRepo.findRefundsByOrder.mockResolvedValue([createOrderPaymentRefund({ amount: 50 })]);

    const result = await useCase.findByOrder('o1');

    expect(result).toHaveLength(1);
    expect(queryRepo.findRefundsByOrder).toHaveBeenCalledWith('o1');
  });
});
