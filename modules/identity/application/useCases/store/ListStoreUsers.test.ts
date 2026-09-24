import { lazyMock, createUserStoreAssignment } from '../../../tests/testUtils';
import { ListStoreUsersUseCase } from './ListStoreUsers';

describe('ListStoreUsersUseCase', () => {
  let useCase: ListStoreUsersUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ListStoreUsersUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof ListStoreUsersUseCase>[0]>();
    mockRepo.findByStoreId.mockResolvedValue([
      createUserStoreAssignment({ userId: 'u1', storeId: 's1', isPrimary: true }),
      createUserStoreAssignment({ userId: 'u2', storeId: 's1', role: 'manager' }),
    ]);
    useCase = new ListStoreUsersUseCase(mockRepo);
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
