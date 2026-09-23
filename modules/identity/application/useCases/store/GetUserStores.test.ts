import { lazyMock, createUserStoreAssignment } from '../../../tests/testUtils';
import { GetUserStoresUseCase } from './GetUserStores';

describe('GetUserStoresUseCase', () => {
  let useCase: GetUserStoresUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof GetUserStoresUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof GetUserStoresUseCase>[0]>();
    mockRepo.findByUserId.mockResolvedValue([
      createUserStoreAssignment({ userId: 'u1', storeId: 's1', isPrimary: true }),
      createUserStoreAssignment({ userId: 'u1', storeId: 's2', role: 'manager' }),
    ]);
    useCase = new GetUserStoresUseCase(mockRepo);
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
