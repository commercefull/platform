jest.mock('../../infrastructure/repositories/OrderFulfillmentDataRepository', () => ({
  __esModule: true,
  default: {
    fulfillments: {
      findByOrder: jest.fn().mockResolvedValue([{ packageId: 'p1', orderId: 'o1' }]),
    },
    returns: {},
  },
}));

import { GetFulfillmentPackagesUseCase } from './GetFulfillmentPackages';
import orderFulfillmentDataRepository from '../../infrastructure/repositories/OrderFulfillmentDataRepository';

const mockRepo = orderFulfillmentDataRepository as unknown as { fulfillments: Record<string, jest.Mock> };

describe('GetFulfillmentPackagesUseCase', () => {
  let useCase: GetFulfillmentPackagesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetFulfillmentPackagesUseCase();
  });

  it('should find packages by order', async () => {
    const result = await useCase.findByOrder('o1');
    expect(result).toHaveLength(1);
    expect(mockRepo.fulfillments.findByOrder).toHaveBeenCalledWith('o1');
  });
});
