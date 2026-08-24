import { ListStoreUsersUseCase } from './ListStoreUsers';

describe('ListStoreUsersUseCase', () => {
  let useCase: ListStoreUsersUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByStoreId: jest.fn().mockResolvedValue([
        { userStoreId: 'us1', userId: 'u1', storeId: 's1', role: 'admin', isPrimary: true, isActive: true, permissions: ['read', 'write'] },
        { userStoreId: 'us2', userId: 'u2', storeId: 's1', role: 'staff', isPrimary: false, isActive: true, permissions: ['read'] },
      ]),
    };
    useCase = new ListStoreUsersUseCase(mockRepo as never);
  });

  it('should list store users (happy path)', async () => {
    const result = await useCase.execute('s1');

    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe('u1');
    expect(result[0].role).toBe('admin');
  });

  it('should return empty array when store has no users', async () => {
    mockRepo.findByStoreId.mockResolvedValue([]);

    const result = await useCase.execute('s-empty');

    expect(result).toHaveLength(0);
  });
});
