import { GetDispatchesByStoreUseCase } from './GetDispatchesByStore';
import { StoreDispatchRepository } from '../../domain/repositories/StoreDispatchRepository';

const mockRepo: StoreDispatchRepository = {
  findById: jest.fn(),
  findByNumber: jest.fn(),
  findAll: jest.fn().mockResolvedValue({ data: [{ dispatchId: 'd1' }], total: 1 }),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('GetDispatchesByStoreUseCase', () => {
  let useCase: GetDispatchesByStoreUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetDispatchesByStoreUseCase(mockRepo);
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
