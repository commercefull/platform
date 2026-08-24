import { ListStoreDispatchesUseCase} from './ListStoreDispatches';

describe('ListStoreDispatchesUseCase', () => {
  let useCase: ListStoreDispatchesUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue({
        data: [
          { toJSON: () => ({ dispatchId: 'd1', status: 'pending' }) },
          { toJSON: () => ({ dispatchId: 'd2', status: 'approved' }) },
        ],
        total: 2, limit: 10, offset: 0, hasMore: false,
      }),
    };
    useCase = new ListStoreDispatchesUseCase(mockRepo as never);
  });

  it('should list store dispatches (happy path)', async () => {
    const result = await useCase.execute({ fromStoreId: 's1', limit: 10, offset: 0 });

    expect(result.dispatches).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.hasMore).toBe(false);
  });

  it('should pass filters and pagination to repository', async () => {
    await useCase.execute({ status: 'approved', limit: 5, offset: 10, orderBy: 'createdAt', orderDirection: 'desc' });

    expect(mockRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'approved' }),
      expect.objectContaining({ limit: 5, offset: 10, orderBy: 'createdAt', orderDirection: 'desc' }),
    );
  });
});
