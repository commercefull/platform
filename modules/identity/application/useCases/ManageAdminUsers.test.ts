import { lazyMock, createAdminUserRecord } from '../../tests/testUtils';
import { ManageAdminUsersUseCase } from './ManageAdminUsers';
import type { AdminUserManagementPort } from '../../domain/repositories/AdminIdentityPorts';

describe('ManageAdminUsersUseCase', () => {
  let useCase: ManageAdminUsersUseCase;
  let repo: jest.Mocked<AdminUserManagementPort>;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<AdminUserManagementPort>();
    useCase = new ManageAdminUsersUseCase(repo);
  });

  it('should list admin users with filters', async () => {
    repo.listManagedAdminUsers.mockResolvedValue({ users: [createAdminUserRecord()], total: 1 });

    const result = await useCase.listUsers({ status: 'active' });

    expect(result.users).toHaveLength(1);
    expect(repo.listManagedAdminUsers).toHaveBeenCalledWith({ status: 'active' });
  });

  it('should find an admin user by ID', async () => {
    repo.findManagedAdminUserById.mockResolvedValue(createAdminUserRecord({ adminId: 'u1' }));

    const result = await useCase.findById('u1');

    expect(result?.adminId).toBe('u1');
  });

  it('should create an admin user', async () => {
    repo.createManagedAdminUser.mockResolvedValue('u2');

    const result = await useCase.create({ email: 'admin@test.com', passwordHash: 'hash' });

    expect(result).toBe('u2');
    expect(repo.createManagedAdminUser).toHaveBeenCalledWith({ email: 'admin@test.com', passwordHash: 'hash' });
  });

  it('should delete an admin user', async () => {
    await useCase.delete('u1');

    expect(repo.deleteManagedAdminUser).toHaveBeenCalledWith('u1');
  });
});

