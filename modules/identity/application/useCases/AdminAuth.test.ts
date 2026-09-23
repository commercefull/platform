import { lazyMock, createAdminUser, createUserStoreAssignment } from '../../tests/testUtils';
import { AdminAuthUseCase } from './AdminAuth';
import type { AdminAuthPort } from '../../domain/repositories/AdminIdentityPorts';

describe('AdminAuthUseCase', () => {
  let useCase: AdminAuthUseCase;
  let identityRepo: jest.Mocked<AdminAuthPort>;

  beforeEach(() => {
    jest.resetAllMocks();
    identityRepo = lazyMock<AdminAuthPort>();
    useCase = new AdminAuthUseCase(identityRepo);
  });

  it('should find an admin by email', async () => {
    identityRepo.findAdminByEmail.mockResolvedValue(createAdminUser({ adminId: 'a1' }));

    const result = await useCase.findByEmail('admin@test.com');

    expect(result?.adminId).toBe('a1');
    expect(identityRepo.findAdminByEmail).toHaveBeenCalledWith('admin@test.com');
  });

  it('should update the last login timestamp', async () => {
    await useCase.updateLastLogin('a1');

    expect(identityRepo.updateAdminLastLogin).toHaveBeenCalledWith('a1');
  });

  it('should return store assignments for a user', async () => {
    identityRepo.findStoreUsersByUserId.mockResolvedValue([createUserStoreAssignment({ userId: 'u1' })]);

    const result = await useCase.findStoreAssignmentsByUserId('u1');

    expect(result).toHaveLength(1);
    expect(result[0].storeId).toBe('store-1');
  });
});

