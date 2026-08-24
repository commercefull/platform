import { RemoveUserFromStoreUseCase } from './RemoveUserFromStore';
import { UserStoreAssignmentNotFoundError } from '../../../domain/errors/IdentityErrors';

describe('RemoveUserFromStoreUseCase', () => {
  let useCase: RemoveUserFromStoreUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByUserAndStore: jest.fn().mockResolvedValue({ userStoreId: 'us1' }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RemoveUserFromStoreUseCase(mockRepo as never);
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
