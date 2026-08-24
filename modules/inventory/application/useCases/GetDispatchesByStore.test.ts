jest.mock('../../infrastructure/repositories/StoreDispatchAggregateRepository', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn().mockResolvedValue({ data: [{ dispatchId: 'd1' }], total: 1 }),
  },
}));

import { GetDispatchesByStoreUseCase } from './GetDispatchesByStore';
import storeDispatchRepository from '../../infrastructure/repositories/StoreDispatchAggregateRepository';

const mockRepo = storeDispatchRepository as unknown as Record<string, jest.Mock>;

describe('GetDispatchesByStoreUseCase', () => {
  let useCase: GetDispatchesByStoreUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetDispatchesByStoreUseCase();
  });

  it('should get dispatches by store (happy path)', async () => {
    const result = await useCase.execute('s1');

    expect(result.data).toHaveLength(1);
    expect(mockRepo.findAll).toHaveBeenCalledWith({ fromStoreId: 's1' }, { limit: 10, offset: 0 });
  });

  it('should pass custom limit and offset', async () => {
    await useCase.execute('s1', 20, 10);

    expect(mockRepo.findAll).toHaveBeenCalledWith({ fromStoreId: 's1' }, { limit: 20, offset: 10 });
  });
});
