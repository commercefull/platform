import { lazyMock, createUserStoreAssignment } from '../../../tests/testUtils';
import { User } from '../../../domain/entities/User';
import { AssignUserToStoreUseCase } from './AssignUserToStore';
import { UserNotFoundError, StoreNotFoundError, UserAlreadyAssignedToStoreError } from '../../../domain/errors/IdentityErrors';
import { generateUUID } from '../../../../../libs/uuid';

beforeEach(() => {
  jest.mocked(generateUUID).mockClear();
});

describe('AssignUserToStoreUseCase', () => {
  let useCase: AssignUserToStoreUseCase;
  let mockUserStoreRepo: jest.Mocked<ConstructorParameters<typeof AssignUserToStoreUseCase>[0]>;
  let mockUserRepo: jest.Mocked<ConstructorParameters<typeof AssignUserToStoreUseCase>[1]>;
  let mockStoreLookup: jest.Mocked<ConstructorParameters<typeof AssignUserToStoreUseCase>[2]>;

  beforeEach(() => {
    mockUserStoreRepo = lazyMock<ConstructorParameters<typeof AssignUserToStoreUseCase>[0]>();
    mockUserStoreRepo.findByUserAndStore.mockResolvedValue(null);
    mockUserStoreRepo.save.mockImplementation(async assignment => assignment);
    mockUserRepo = lazyMock<ConstructorParameters<typeof AssignUserToStoreUseCase>[1]>();
    mockUserRepo.findById.mockResolvedValue(User.create({ userId: 'u1', email: 'u@test.com', passwordHash: 'h', userType: 'customer' }));
    mockStoreLookup = lazyMock<ConstructorParameters<typeof AssignUserToStoreUseCase>[2]>();
    mockStoreLookup.findById.mockResolvedValue({ storeId: 's1' });
    useCase = new AssignUserToStoreUseCase(mockUserStoreRepo, mockUserRepo, mockStoreLookup);
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
    mockUserStoreRepo.findByUserAndStore.mockResolvedValue(createUserStoreAssignment({ userId: 'u1', storeId: 's1' }));

    await expect(useCase.execute({ userId: 'u1', storeId: 's1', role: 'manager' })).rejects.toThrow(UserAlreadyAssignedToStoreError);
  });
});
