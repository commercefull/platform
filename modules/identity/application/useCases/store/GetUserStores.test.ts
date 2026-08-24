import { GetUserStoresUseCase } from './GetUserStores';

describe('GetUserStoresUseCase', () => {
  let useCase: GetUserStoresUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByUserId: jest.fn().mockResolvedValue([
        { userStoreId: 'us1', userId: 'u1', storeId: 's1', role: 'admin', isPrimary: true, isActive: true, permissions: ['read', 'write'] },
        { userStoreId: 'us2', userId: 'u1', storeId: 's2', role: 'staff', isPrimary: false, isActive: true, permissions: ['read'] },
      ]),
    };
    useCase = new GetUserStoresUseCase(mockRepo as never);
  });

  it('should get user stores (happy path)', async () => {
    const result = await useCase.execute('u1');

    expect(result).toHaveLength(2);
    expect(result[0].storeId).toBe('s1');
    expect(result[0].role).toBe('admin');
    expect(result[0].isPrimary).toBe(true);
  });

  it('should return empty array when user has no stores', async () => {
    mockRepo.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute('u-missing');

    expect(result).toHaveLength(0);
  });
});
