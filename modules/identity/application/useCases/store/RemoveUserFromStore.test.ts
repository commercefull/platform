import { lazyMock, createUserStoreAssignment } from '../../../tests/testUtils';
import { RemoveUserFromStoreUseCase } from './RemoveUserFromStore';
import { UserStoreAssignmentNotFoundError } from '../../../domain/errors/IdentityErrors';

describe('RemoveUserFromStoreUseCase', () => {
  let useCase: RemoveUserFromStoreUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof RemoveUserFromStoreUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof RemoveUserFromStoreUseCase>[0]>();
    mockRepo.findByUserAndStore.mockResolvedValue(createUserStoreAssignment({ userStoreId: 'us1', userId: 'u1', storeId: 's1' }));
    mockRepo.delete.mockResolvedValue(undefined);
    useCase = new RemoveUserFromStoreUseCase(mockRepo);
  });

  it('should remove user from store (happy path)', async () => {
    await useCase.execute('u1', 's1');

    expect(mockRepo.delete).toHaveBeenCalledWith('us1');
  });

  it('should throw UserStoreAssignmentNotFoundError when assignment not found', async () => {
    mockRepo.findByUserAndStore.mockResolvedValue(null);

    await expect(useCase.execute('u1', 's1')).rejects.toThrow(UserStoreAssignmentNotFoundError);
  });
});
