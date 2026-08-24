jest.mock('../../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn().mockReturnValue('uuid-mock'),
}));

import { AssignUserToStoreUseCase } from './AssignUserToStore';
import { UserNotFoundError, StoreNotFoundError, UserAlreadyAssignedToStoreError } from '../../../domain/errors/IdentityErrors';
import { generateUUID } from '../../../../../libs/uuid';

beforeEach(() => { jest.mocked(generateUUID).mockClear(); });

describe('AssignUserToStoreUseCase', () => {
  let useCase: AssignUserToStoreUseCase;
  let mockUserStoreRepo: Record<string, jest.Mock>;
  let mockUserRepo: Record<string, jest.Mock>;
  let mockStoreLookup: Record<string, jest.Mock>;

  beforeEach(() => {
    mockUserStoreRepo = {
      findByUserAndStore: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (assignment: unknown) => assignment),
    };
    mockUserRepo = { findById: jest.fn().mockResolvedValue({ userId: 'u1' }) };
    mockStoreLookup = { findById: jest.fn().mockResolvedValue({ storeId: 's1' }) };
    useCase = new AssignUserToStoreUseCase(mockUserStoreRepo as never, mockUserRepo as never, mockStoreLookup as never);
  });

  it('should assign user to store (happy path)', async () => {
    const result = await useCase.execute({ userId: 'u1', storeId: 's1', role: 'manager' });

    expect(result.userId).toBe('u1');
    expect(result.storeId).toBe('s1');
    expect(result.role).toBe('manager');
    expect(generateUUID).toHaveBeenCalled();
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'missing', storeId: 's1', role: 'manager' })).rejects.toThrow(UserNotFoundError);
  });

  it('should throw StoreNotFoundError when store does not exist', async () => {
    mockStoreLookup.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'u1', storeId: 'missing', role: 'manager' })).rejects.toThrow(StoreNotFoundError);
  });

  it('should throw UserAlreadyAssignedToStoreError when already assigned', async () => {
    mockUserStoreRepo.findByUserAndStore.mockResolvedValue({ userStoreId: 'existing' });

    await expect(useCase.execute({ userId: 'u1', storeId: 's1', role: 'manager' })).rejects.toThrow(UserAlreadyAssignedToStoreError);
  });
});
