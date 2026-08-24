jest.mock('../../infrastructure/repositories/IdentityDataRepository', () => ({
  __esModule: true,
  default: {
    users: {
      listManagedAdminUsers: jest.fn().mockResolvedValue([{ userId: 'u1' }]),
      findManagedAdminUserById: jest.fn().mockResolvedValue({ userId: 'u1' }),
      findManagedAdminUserByEmail: jest.fn().mockResolvedValue({ userId: 'u1' }),
      createManagedAdminUser: jest.fn().mockResolvedValue({ userId: 'u2' }),
      updateManagedAdminUser: jest.fn().mockResolvedValue(undefined),
      deleteManagedAdminUser: jest.fn().mockResolvedValue(undefined),
      listRoles: jest.fn().mockResolvedValue([{ roleId: 'r1' }]),
      findRoleById: jest.fn().mockResolvedValue({ roleId: 'r1' }),
      createRole: jest.fn().mockResolvedValue({ roleId: 'r2' }),
      updateRole: jest.fn().mockResolvedValue(undefined),
      deleteRole: jest.fn().mockResolvedValue(undefined),
      countRoleAssignments: jest.fn().mockResolvedValue(3),
    },
  },
}));

import { ManageAdminUsersUseCase, ManageRolesUseCase } from './ManageAdminUsers';
import identityDataRepository from '../../infrastructure/repositories/IdentityDataRepository';

const mockRepo = identityDataRepository as unknown as { users: Record<string, jest.Mock> };

describe('ManageAdminUsersUseCase', () => {
  let useCase: ManageAdminUsersUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageAdminUsersUseCase();
  });

  it('should list users', async () => {
    const result = await useCase.listUsers({ status: 'active' });
    expect(result).toHaveLength(1);
    expect(mockRepo.users.listManagedAdminUsers).toHaveBeenCalledWith({ status: 'active' });
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('u1') as unknown as { userId: string };
    expect(result.userId).toBe('u1');
  });

  it('should create user', async () => {
    const result = await useCase.create({ email: 'admin@test.com', passwordHash: 'hash' }) as unknown as { userId: string };
    expect(result.userId).toBe('u2');
  });

  it('should delete user', async () => {
    await useCase.delete('u1');
    expect(mockRepo.users.deleteManagedAdminUser).toHaveBeenCalledWith('u1');
  });
});

describe('ManageRolesUseCase', () => {
  let useCase: ManageRolesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageRolesUseCase();
  });

  it('should list roles', async () => {
    const result = await useCase.listRoles();
    expect(result).toHaveLength(1);
  });

  it('should create role', async () => {
    const result = await useCase.create({ name: 'Admin', permissions: ['read'] }) as unknown as { roleId: string };
    expect(result.roleId).toBe('r2');
  });

  it('should count assignments', async () => {
    const result = await useCase.countAssignments('r1');
    expect(result).toBe(3);
  });
});
