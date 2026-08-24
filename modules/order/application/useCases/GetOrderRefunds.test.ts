jest.mock('../../infrastructure/repositories/OrderDataRepository', () => ({
  __esModule: true,
  default: {
    queries: {
      findRefundsByOrder: jest.fn().mockResolvedValue([{ refundId: 'rf1', amount: 50 }]),
    },
    commands: {},
  },
}));

import { GetOrderRefundsUseCase } from './GetOrderRefunds';
import orderDataRepository from '../../infrastructure/repositories/OrderDataRepository';

const mockRepo = orderDataRepository as unknown as { queries: Record<string, jest.Mock> };

describe('GetOrderRefundsUseCase', () => {
  let useCase: GetOrderRefundsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetOrderRefundsUseCase();
  });

  it('should find refunds by order', async () => {
    const result = await useCase.findByOrder('o1');
    expect(result).toHaveLength(1);
    expect(mockRepo.queries.findRefundsByOrder).toHaveBeenCalledWith('o1');
  });
});
